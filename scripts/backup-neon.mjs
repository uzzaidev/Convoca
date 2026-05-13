#!/usr/bin/env node
/**
 * Backup do banco Neon. Lê DATABASE_URL/POSTGRES_URL_NON_POOLING do .env.local.
 *
 * Uso:
 *   node scripts/backup-neon.mjs           # gera 3 arquivos: full, structure, data
 *   node scripts/backup-neon.mjs --quick    # apenas o backup completo
 *
 * Saída: src/db/backups/convoca_<tipo>_<timestamp>.sql
 */

import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { spawn } from "node:child_process";

const ROOT = process.cwd();
const BACKUP_DIR = path.join(ROOT, "src", "db", "backups");
const QUICK = process.argv.includes("--quick");

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
  };
}

function pgDump(args, env, outFile) {
  return new Promise((resolve, reject) => {
    const child = spawn("pg_dump", [...args, "--file", outFile], {
      env: { ...process.env, ...env },
      stdio: ["ignore", "inherit", "inherit"],
      shell: false,
    });
    child.on("error", reject);
    child.on("close", (code) =>
      code === 0 ? resolve() : reject(new Error(`pg_dump saiu com código ${code}`))
    );
  });
}

async function main() {
  loadEnvFile(path.join(ROOT, ".env.local"));

  const url =
    process.env.POSTGRES_URL_NON_POOLING ||
    process.env.DATABASE_URL_UNPOOLED ||
    process.env.POSTGRES_URL ||
    process.env.DATABASE_URL;

  if (!url) {
    console.error("❌ Nenhuma DATABASE_URL/POSTGRES_URL_NON_POOLING encontrada no .env.local.");
    process.exit(1);
  }

  const env = urlToPgEnv(url);
  if (!fs.existsSync(BACKUP_DIR)) fs.mkdirSync(BACKUP_DIR, { recursive: true });

  const ts = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  const base = ["--schema=public", "--no-owner", "--no-privileges"];

  console.log(`Backup do Neon → ${env.PGHOST}:${env.PGPORT}/${env.PGDATABASE}`);
  console.log(`Diretório: ${path.relative(ROOT, BACKUP_DIR)}\n`);

  const fullFile = path.join(BACKUP_DIR, `convoca_full_${ts}.sql`);
  console.log("[1/3] Backup COMPLETO (estrutura + dados)...");
  await pgDump(base, env, fullFile);
  console.log(`✓ ${path.basename(fullFile)}\n`);

  if (QUICK) {
    console.log("--quick: parando aqui.");
    return;
  }

  const structFile = path.join(BACKUP_DIR, `convoca_structure_${ts}.sql`);
  console.log("[2/3] Backup ESTRUTURA (schema-only)...");
  await pgDump([...base, "--schema-only"], env, structFile);
  console.log(`✓ ${path.basename(structFile)}\n`);

  const dataFile = path.join(BACKUP_DIR, `convoca_data_${ts}.sql`);
  console.log("[3/3] Backup DADOS (data-only)...");
  await pgDump([...base, "--data-only"], env, dataFile);
  console.log(`✓ ${path.basename(dataFile)}\n`);

  console.log("✅ Backup concluído.");
}

main().catch((err) => {
  console.error("❌ Erro no backup:", err.message || err);
  process.exit(1);
});
