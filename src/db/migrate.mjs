import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import postgres from "postgres";

const ROOT = process.cwd();
const MIGRATIONS_DIR = path.join(ROOT, "src", "db", "migrations");
const TRACKING_TABLE = "schema_migrations";

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

function getDatabaseUrl() {
  loadEnvFile(path.join(ROOT, ".env.local"));

  return (
    process.env.POSTGRES_URL_NON_POOLING ||
    process.env.DATABASE_URL_UNPOOLED ||
    process.env.POSTGRES_URL ||
    process.env.DATABASE_URL
  );
}

function getMigrationFiles() {
  return fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((name) => name.endsWith(".sql"))
    .sort();
}

function sha256(content) {
  return crypto.createHash("sha256").update(content).digest("hex");
}

function parseArgs() {
  const args = process.argv.slice(2);
  const onlyIndex = args.indexOf("--only");
  const only =
    onlyIndex >= 0 && args[onlyIndex + 1]
      ? args[onlyIndex + 1].split(",").map((name) => name.trim()).filter(Boolean)
      : [];

  return {
    all: args.includes("--all"),
    status: args.includes("--status"),
    only,
  };
}

async function ensureTrackingTable(sql) {
  await sql`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id SERIAL PRIMARY KEY,
      filename TEXT NOT NULL UNIQUE,
      hash TEXT NOT NULL,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      execution_ms INTEGER NOT NULL DEFAULT 0
    )
  `;
}

async function main() {
  const url = getDatabaseUrl();
  if (!url) {
    console.error("FALTA DATABASE_URL/POSTGRES_URL_NON_POOLING no ambiente ou .env.local.");
    process.exit(1);
  }

  const options = parseArgs();
  const sql = postgres(url, {
    ssl: "require",
    prepare: false,
    max: 1,
    onnotice: () => {},
  });

  try {
    await ensureTrackingTable(sql);

    const files = getMigrationFiles();
    const rows = await sql`
      SELECT filename, hash, applied_at
      FROM schema_migrations
      ORDER BY filename
    `;
    const appliedByFilename = new Map(rows.map((row) => [row.filename, row]));

    if (options.status) {
      console.log(`Historico: ${rows.length} migration(s) em public.${TRACKING_TABLE}.`);
      for (const file of files) {
        const applied = appliedByFilename.get(file);
        console.log(`${applied ? "OK " : "PEND"} ${file}`);
      }
      return;
    }

    if (!options.all && options.only.length === 0) {
      console.error("Informe --only nome.sql para aplicar uma migration especifica, ou --all para aplicar todas as pendentes.");
      console.error("Como este projeto nao tinha historico antes, --only e o caminho seguro para producao.");
      process.exit(1);
    }

    const selectedFiles = options.only.length > 0 ? options.only : files;
    for (const file of selectedFiles) {
      if (!files.includes(file)) {
        throw new Error(`Migration nao encontrada: ${file}`);
      }
    }

    const pending = selectedFiles.filter((file) => !appliedByFilename.has(file));
    console.log(`Selecionadas: ${selectedFiles.length}`);
    console.log(`Pendentes: ${pending.length}`);

    if (pending.length === 0) {
      console.log("Nada pendente. Banco sincronizado para a selecao informada.");
      return;
    }

    for (const file of pending) {
      const fullPath = path.join(MIGRATIONS_DIR, file);
      const content = fs.readFileSync(fullPath, "utf8");
      const hash = sha256(content);
      const start = Date.now();

      console.log(`Aplicando ${file}...`);
      await sql.unsafe(content);
      const executionMs = Date.now() - start;

      await sql`
        INSERT INTO schema_migrations (filename, hash, execution_ms)
        VALUES (${file}, ${hash}, ${executionMs})
      `;
      console.log(`OK ${file} (${executionMs}ms)`);
    }
  } finally {
    await sql.end({ timeout: 5 });
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
