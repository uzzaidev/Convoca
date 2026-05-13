#!/usr/bin/env node
/**
 * Migra o banco do Supabase Postgres para o Neon Postgres.
 *
 * Uso:
 *   node scripts/migrate-to-neon.mjs              # aborta se Neon não estiver vazio
 *   node scripts/migrate-to-neon.mjs --force-reset  # zera o schema public no Neon antes
 *   node scripts/migrate-to-neon.mjs --dump-only    # só faz o dump, não restaura
 *
 * Lê do .env.local:
 *   - POSTGRES_URL_NON_POOLING        (origem, Supabase porta 5432)
 *   - NEON_DATABASE_URL_NON_POOLING   (destino, Neon sem -pooler)
 */

import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { spawn } from "node:child_process";
import postgres from "postgres";

const ROOT = process.cwd();
const BACKUP_DIR = path.join(ROOT, "src", "db", "backups");

const ARGS = new Set(process.argv.slice(2));
const FORCE_RESET = ARGS.has("--force-reset");
const DUMP_ONLY = ARGS.has("--dump-only");

const CRITICAL_TABLES = [
  "users",
  "groups",
  "group_members",
  "events",
  "event_attendance",
  "teams",
  "team_members",
  "event_actions",
  "player_ratings",
  "mvp_tiebreakers",
  "mvp_tiebreaker_votes",
  "wallets",
  "charges",
  "transactions",
  "expenses",
  "invites",
  "venues",
  "seasons",
  "season_snapshots",
  "draw_configs",
  "event_settings",
  "event_recurrences",
  "scoring_configs",
  "subscription_plans",
  "group_subscriptions",
  "agent_conversations",
  "agent_messages",
  "agent_quotas",
  "agent_settings",
  "agent_usage",
  "schema_migrations",
];

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  const content = fs.readFileSync(filePath, "utf8");
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const equalsIndex = trimmed.indexOf("=");
    if (equalsIndex === -1) continue;
    const key = trimmed.slice(0, equalsIndex).trim();
    let value = trimmed.slice(equalsIndex + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    process.env[key] ??= value;
  }
}

function urlToPgEnv(connectionString) {
  const u = new URL(connectionString);
  return {
    PGHOST: u.hostname,
    PGPORT: u.port || "5432",
    PGUSER: decodeURIComponent(u.username),
    PGPASSWORD: decodeURIComponent(u.password),
    PGDATABASE: u.pathname.replace(/^\//, "") || "postgres",
    PGSSLMODE: u.searchParams.get("sslmode") || "require",
    PGCHANNELBINDING: u.searchParams.get("channel_binding") || "prefer",
  };
}

function fmt(n) {
  return Number(n).toLocaleString("pt-BR");
}

function pad(s, len) {
  s = String(s);
  return s.length >= len ? s : s + " ".repeat(len - s.length);
}

function runCommand(cmd, args, env) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, {
      env: { ...process.env, ...env },
      stdio: ["ignore", "inherit", "inherit"],
      shell: false,
    });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${cmd} saiu com código ${code}`));
    });
  });
}

async function checkVersion() {
  return new Promise((resolve, reject) => {
    const child = spawn("pg_dump", ["--version"], { shell: false });
    let out = "";
    child.stdout.on("data", (d) => (out += d.toString()));
    child.on("error", reject);
    child.on("close", () => {
      const m = out.match(/(\d+)\.(\d+)/);
      if (!m) return reject(new Error("Não foi possível detectar versão do pg_dump"));
      const major = parseInt(m[1], 10);
      if (major < 16) {
        return reject(new Error(`pg_dump ${m[0]} é muito antigo. Precisa >= 16.`));
      }
      console.log(`✓ pg_dump versão ${m[0]}`);
      resolve();
    });
  });
}

async function tableCounts(sql, tables) {
  const result = {};
  for (const t of tables) {
    try {
      const r = await sql.unsafe(`SELECT count(*)::bigint AS c FROM public.${t}`);
      result[t] = Number(r[0].c);
    } catch {
      result[t] = null; // tabela não existe
    }
  }
  return result;
}

async function main() {
  console.log("=== Migração Supabase → Neon ===\n");

  loadEnvFile(path.join(ROOT, ".env.local"));

  const sourceUrl = process.env.POSTGRES_URL_NON_POOLING;
  const targetUrl = process.env.NEON_DATABASE_URL_NON_POOLING;

  if (!sourceUrl) {
    console.error("❌ POSTGRES_URL_NON_POOLING não definida (Supabase, porta 5432).");
    process.exit(1);
  }
  if (!targetUrl) {
    console.error("❌ NEON_DATABASE_URL_NON_POOLING não definida (Neon, sem -pooler).");
    process.exit(1);
  }

  const sourceEnv = urlToPgEnv(sourceUrl);
  const targetEnv = urlToPgEnv(targetUrl);

  console.log(`Origem:  ${sourceEnv.PGHOST}:${sourceEnv.PGPORT}/${sourceEnv.PGDATABASE}`);
  console.log(`Destino: ${targetEnv.PGHOST}:${targetEnv.PGPORT}/${targetEnv.PGDATABASE}\n`);

  await checkVersion();

  // --- 1. Conectar e checar estado do destino ---
  const targetSql = postgres(targetUrl, { ssl: "require", prepare: false, max: 1, onnotice: () => {} });

  const existingTables = await targetSql.unsafe(`
    SELECT count(*)::int AS c FROM information_schema.tables WHERE table_schema = 'public'
  `);
  const existing = existingTables[0].c;

  if (existing > 0) {
    console.log(`⚠ Destino tem ${existing} tabela(s) no schema public.`);
    if (!FORCE_RESET && !DUMP_ONLY) {
      console.error("Use --force-reset para zerar o schema public no destino antes do restore.");
      await targetSql.end();
      process.exit(1);
    }
    if (FORCE_RESET) {
      console.log("→ Zerando schema public no destino (--force-reset)...");
      await targetSql.unsafe("DROP SCHEMA IF EXISTS public CASCADE");
      await targetSql.unsafe("CREATE SCHEMA public");
      console.log("✓ Schema public recriado vazio.\n");
    }
  } else {
    console.log("✓ Destino está vazio.\n");
  }

  // --- 2. Pré-criar extensions necessárias no destino ---
  console.log("→ Criando extensão uuid-ossp no destino...");
  await targetSql.unsafe('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
  console.log("✓ uuid-ossp instalada.\n");

  // --- 3. Contagens da origem (para validação posterior) ---
  const sourceSql = postgres(sourceUrl, { ssl: "require", prepare: false, max: 1, onnotice: () => {} });
  console.log("→ Coletando contagens da origem...");
  const sourceCounts = await tableCounts(sourceSql, CRITICAL_TABLES);
  for (const [t, c] of Object.entries(sourceCounts)) {
    if (c !== null) console.log(`   ${pad(t, 24)} ${fmt(c)}`);
  }
  console.log();

  // --- 4. pg_dump ---
  if (!fs.existsSync(BACKUP_DIR)) fs.mkdirSync(BACKUP_DIR, { recursive: true });
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  const dumpFile = path.join(BACKUP_DIR, `migration_${timestamp}.dump`);

  console.log(`→ pg_dump para ${path.relative(ROOT, dumpFile)}...`);
  await runCommand(
    "pg_dump",
    [
      "--schema=public",
      "--no-owner",
      "--no-privileges",
      "--no-publications",
      "--no-subscriptions",
      "--format=custom",
      "--file", dumpFile,
      "--verbose",
    ].filter(Boolean),
    sourceEnv,
  );
  const stat = fs.statSync(dumpFile);
  console.log(`✓ Dump concluído (${(stat.size / 1024 / 1024).toFixed(2)} MB).\n`);

  if (DUMP_ONLY) {
    console.log("--dump-only: parando aqui. Restore não foi executado.");
    await sourceSql.end();
    await targetSql.end();
    return;
  }

  // --- 5. pg_restore ---
  console.log("→ pg_restore no destino...");
  await runCommand(
    "pg_restore",
    [
      "--dbname", `postgresql://${encodeURIComponent(targetEnv.PGUSER)}:${encodeURIComponent(targetEnv.PGPASSWORD)}@${targetEnv.PGHOST}:${targetEnv.PGPORT}/${targetEnv.PGDATABASE}?sslmode=${targetEnv.PGSSLMODE}`,
      "--no-owner",
      "--no-privileges",
      "--schema=public",
      "--verbose",
      dumpFile,
    ],
    targetEnv,
  );
  console.log("✓ Restore concluído.\n");

  // --- 6. Pós-restore: refresh MV + ANALYZE ---
  console.log("→ REFRESH MATERIALIZED VIEW + ANALYZE...");
  try {
    await targetSql.unsafe("REFRESH MATERIALIZED VIEW CONCURRENTLY mv_event_scoreboard");
  } catch (e) {
    // CONCURRENTLY pode falhar se MV ainda não populada — tenta sem
    if (String(e.message).includes("CONCURRENTLY")) {
      await targetSql.unsafe("REFRESH MATERIALIZED VIEW mv_event_scoreboard");
    } else {
      console.warn(`   (aviso: ${e.message})`);
    }
  }
  await targetSql.unsafe("ANALYZE");
  console.log("✓ Pós-restore ok.\n");

  // --- 7. Validação de contagens ---
  console.log("→ Comparando contagens entre origem e destino...");
  const targetCounts = await tableCounts(targetSql, CRITICAL_TABLES);

  console.log(`\n${pad("Tabela", 24)} ${pad("Origem", 12)} ${pad("Destino", 12)} OK?`);
  console.log("─".repeat(60));
  let allOk = true;
  for (const t of CRITICAL_TABLES) {
    const src = sourceCounts[t];
    const dst = targetCounts[t];
    const status = src === dst ? "✓" : "✗";
    if (src !== dst) allOk = false;
    const srcStr = src === null ? "—" : fmt(src);
    const dstStr = dst === null ? "—" : fmt(dst);
    console.log(`${pad(t, 24)} ${pad(srcStr, 12)} ${pad(dstStr, 12)} ${status}`);
  }
  console.log();

  await sourceSql.end();
  await targetSql.end();

  if (!allOk) {
    console.error("❌ Validação falhou: contagens divergem.");
    process.exit(1);
  }

  console.log("✅ Migração concluída com sucesso.");
  console.log(`   Dump salvo em: ${path.relative(ROOT, dumpFile)}`);
  console.log("\nPróximos passos:");
  console.log("  1. Editar .env.local: trocar DATABASE_URL/POSTGRES_URL/POSTGRES_URL_NON_POOLING para Neon");
  console.log("  2. Rodar: pnpm db:status   (deve listar 0 pendentes)");
  console.log("  3. Rodar: pnpm dev          (smoke test)");
  console.log("  4. Atualizar envs na Vercel e fazer deploy");
}

main().catch((err) => {
  console.error("\n❌ Erro na migração:");
  console.error(err.message || err);
  if (err.stack) console.error(err.stack);
  process.exit(1);
});
