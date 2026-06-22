/**
 * setup-ios-ci-secrets.mjs
 *
 * Configura os 6 secrets do CI iOS no GitHub Actions via `gh secret set`.
 * Roda interativamente: pede os valores, faz base64 onde necessário, seta.
 *
 * Uso:
 *   node scripts/setup-ios-ci-secrets.mjs
 *
 * Pré-requisitos:
 *   - gh CLI instalado e autenticado (gh auth login)
 *   - Arquivo .p8 da App Store Connect (baixado em S1-3)
 *   - Arquivo GoogleService-Info.plist do Firebase iOS (baixado em S1-4)
 *   - MATCH_PASSWORD definido (de S2-6)
 *   - GitHub PAT com acesso ao repo convoca-certs (de S2-8)
 */

import fs from "fs";
import path from "path";
import readline from "readline";
import { execSync, spawnSync } from "child_process";

// ── Configuração do repo alvo ──────────────────────────────────────────────
const REPO = "uzzaidev/Convoca"; // ajuste se o nome do repo mudar

// ── Utilitários ────────────────────────────────────────────────────────────

/** Pergunta interativa com suporte a input oculto (para senhas) */
function ask(question, hidden = false) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: hidden ? null : process.stdout,
      terminal: true,
    });

    if (hidden) {
      // Exibe a pergunta mas não o que é digitado
      process.stdout.write(question);
      process.stdin.setRawMode?.(true);
      process.stdin.resume();

      let value = "";
      process.stdin.on("data", function handler(char) {
        char = char.toString();
        if (char === "\r" || char === "\n") {
          process.stdout.write("\n");
          process.stdin.setRawMode?.(false);
          process.stdin.removeListener("data", handler);
          process.stdin.pause();
          rl.close();
          resolve(value);
        } else if (char === "\u0003") {
          process.exit(); // Ctrl+C
        } else if (char === "\u007f") {
          // Backspace
          value = value.slice(0, -1);
        } else {
          value += char;
        }
      });
    } else {
      rl.question(question, (answer) => {
        rl.close();
        resolve(answer.trim());
      });
    }
  });
}

/** Lê arquivo e normaliza quebras de linha (remove \r Windows) */
function readFile(filePath) {
  const abs = path.resolve(filePath.trim().replace(/^["']|["']$/g, ""));
  if (!fs.existsSync(abs)) {
    throw new Error(`Arquivo não encontrado: ${abs}`);
  }
  return fs.readFileSync(abs, "utf8").replace(/\r\n/g, "\n").trim();
}

/** Converte string para base64 */
function toBase64(str) {
  return Buffer.from(str).toString("base64");
}

/** Executa gh secret set para um secret */
function setSecret(name, value) {
  // Usa spawnSync para evitar problemas com caracteres especiais no valor
  const result = spawnSync(
    "gh",
    ["secret", "set", name, "--repo", REPO, "--body", value],
    { stdio: ["pipe", "pipe", "pipe"], encoding: "utf8" }
  );

  if (result.status !== 0) {
    const err = result.stderr || result.stdout || "erro desconhecido";
    throw new Error(`Falha ao setar ${name}: ${err}`);
  }
}

/** Verifica se gh está disponível e autenticado */
function checkGh() {
  try {
    const version = execSync("gh --version", { encoding: "utf8" });
    const authStatus = execSync("gh auth status 2>&1", { encoding: "utf8" });
    const isLoggedIn = authStatus.includes("Logged in");
    if (!isLoggedIn) {
      throw new Error("gh não está autenticado. Rode: gh auth login");
    }
    console.log("✅ gh CLI:", version.split("\n")[0].trim());
    return true;
  } catch (e) {
    if (e.message.includes("não está autenticado")) throw e;
    throw new Error(
      "gh CLI não encontrado. Instale: winget install GitHub.cli\nDepois: gh auth login"
    );
  }
}

// ── Main ───────────────────────────────────────────────────────────────────

console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
console.log("  Setup de Secrets iOS CI — GitHub Actions");
console.log(`  Repo: ${REPO}`);
console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

// 1. Verificar gh
checkGh();
console.log();

// 2. Coletar inputs
const p8Path = await ask(
  "📁 Caminho para o .p8 da App Store Connect\n   (ex: C:\\Users\\pedro\\convoca-ios-setup\\AuthKey_ABC.p8)\n   → "
);

const keyId = await ask(
  "\n🔑 App Store Connect Key ID\n   (ex: ABCD1234EF — parte do nome do arquivo .p8)\n   → "
);

const issuerId = await ask(
  "\n🔑 App Store Connect Issuer ID\n   (UUID na página Keys do App Store Connect)\n   → "
);

const plistPath = await ask(
  "\n📁 Caminho para GoogleService-Info.plist do iOS\n   (baixado do Firebase → projeto → app iOS)\n   → "
);

const matchPassword = await ask(
  "\n🔒 MATCH_PASSWORD (senha para criptografar os certs)\n   → ",
  true
);

const githubUser = await ask(
  "\n👤 GitHub username (dono do repo convoca-certs)\n   (ex: uzzaidev)\n   → "
);

const githubPat = await ask(
  "\n🔒 GitHub PAT com acesso a 'convoca-certs' (Contents: Read)\n   (ghp_...)\n   → ",
  true
);

console.log("\n");

// 3. Processar valores
let p8Content, plistBase64, matchAuth;

try {
  console.log("⏳ Lendo arquivos...");

  p8Content = readFile(p8Path);
  console.log(`   .p8 lido: ${p8Content.length} chars`);

  const plistContent = readFile(plistPath);
  plistBase64 = toBase64(plistContent);
  console.log(`   GoogleService-Info.plist: ${plistBase64.length} chars base64`);

  // base64 de "user:token" para MATCH_GIT_BASIC_AUTHORIZATION
  matchAuth = toBase64(`${githubUser.trim()}:${githubPat.trim()}`);
  console.log(`   MATCH_GIT_BASIC_AUTHORIZATION: gerado\n`);
} catch (e) {
  console.error("❌", e.message);
  process.exit(1);
}

// 4. Setar os 6 secrets
const secrets = [
  ["APP_STORE_CONNECT_API_KEY_ID", keyId.trim()],
  ["APP_STORE_CONNECT_API_ISSUER_ID", issuerId.trim()],
  ["APP_STORE_CONNECT_API_KEY_CONTENT", p8Content],
  ["MATCH_PASSWORD", matchPassword.trim()],
  ["MATCH_GIT_BASIC_AUTHORIZATION", matchAuth],
  ["GOOGLE_SERVICE_INFO_PLIST_BASE64", plistBase64],
];

console.log("⏳ Configurando secrets no GitHub Actions...\n");

let allOk = true;
for (const [name, value] of secrets) {
  process.stdout.write(`   ${name.padEnd(42)} `);
  try {
    setSecret(name, value);
    console.log("✅ set");
  } catch (e) {
    console.log("❌ ERRO");
    console.error(`      ${e.message}`);
    allOk = false;
  }
}

// 5. Verificar
console.log("\n⏳ Verificando secrets no GitHub...\n");
try {
  const list = execSync(`gh secret list --repo ${REPO}`, {
    encoding: "utf8",
  });
  console.log(list);
} catch (e) {
  console.warn("⚠️  Não foi possível listar secrets:", e.message);
}

// 6. Resultado final
if (allOk) {
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("✅ Todos os 6 secrets configurados com sucesso!");
  console.log("   Próximo passo: disparar o workflow iOS Release");
  console.log(
    "   GitHub → Actions → iOS Release → Run workflow"
  );
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
} else {
  console.log(
    "\n⚠️  Alguns secrets falharam. Corrija os erros e rode novamente.\n"
  );
  process.exit(1);
}
