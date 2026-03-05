/**
 * Script de teste — envia um e-mail de redefinição de senha de exemplo
 * Uso: node test-email.mjs
 */

import { Resend } from "resend";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Carrega .env manualmente (sem dotenv)
function loadEnv() {
  try {
    const envPath = resolve(__dirname, ".env");
    const content = readFileSync(envPath, "utf-8");
    for (const line of content.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eqIndex = trimmed.indexOf("=");
      if (eqIndex === -1) continue;
      const key = trimmed.slice(0, eqIndex).trim();
      const val = trimmed.slice(eqIndex + 1).trim().replace(/^["']|["']$/g, "");
      if (!process.env[key]) process.env[key] = val;
    }
  } catch {
    // .env não encontrado, usa variáveis de ambiente do sistema
  }
}

loadEnv();

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const NEXTAUTH_URL = process.env.NEXTAUTH_URL || "http://localhost:3000";
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "Convoca <no-reply@send.uzzai.com.br>";
const TO_EMAIL = process.env.RESEND_TEST_TO || "luisfboff@hotmail.com";

if (!RESEND_API_KEY) {
  console.error("❌ RESEND_API_KEY não encontrada no .env");
  process.exit(1);
}

console.log("🔧 Configuração:");
console.log(`   API Key : ${RESEND_API_KEY.slice(0, 10)}...`);
console.log(`   De      : ${FROM_EMAIL}`);
console.log(`   Para    : ${TO_EMAIL}`);
console.log(`   URL App : ${NEXTAUTH_URL}`);
console.log("");

const resend = new Resend(RESEND_API_KEY);

const fakeToken = "TOKEN_DE_TESTE_123abc";
const resetLink = `${NEXTAUTH_URL}/auth/reset-password?token=${fakeToken}`;

const { data, error } = await resend.emails.send({
  from: FROM_EMAIL,
  to: TO_EMAIL,
  subject: "[TESTE] Redefinição de senha — Convoca",
  html: `
<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8" /><title>Teste de E-mail</title></head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.08);">
        <tr>
          <td style="background:linear-gradient(135deg,#1a2e4a 0%,#16a34a 100%);padding:40px 48px;text-align:center;">
            <span style="font-size:48px;">⚽</span>
            <h1 style="margin:8px 0 0;color:#fff;font-size:28px;font-weight:700;">Convoca</h1>
            <p style="margin:6px 0 0;color:rgba(255,255,255,.8);font-size:14px;">Teste de envio de e-mail</p>
          </td>
        </tr>
        <tr>
          <td style="padding:48px;">
            <h2 style="margin:0 0 8px;color:#1a2e4a;font-size:22px;">✅ E-mail funcionando!</h2>
            <p style="margin:0 0 24px;color:#6b7280;font-size:15px;line-height:1.6;">
              Este é um e-mail de teste do Convoca. Se você está vendo isso, a integração com o Resend está funcionando corretamente.
            </p>
            <p style="margin:0 0 8px;color:#6b7280;font-size:13px;">Exemplo de link de redefinição que seria enviado:</p>
            <p style="word-break:break-all;margin:0 0 32px;">
              <a href="${resetLink}" style="color:#16a34a;font-size:13px;">${resetLink}</a>
            </p>
            <table cellpadding="0" cellspacing="0">
              <tr>
                <td style="background-color:#fefce8;border:1px solid #fbbf24;border-radius:8px;padding:16px 20px;">
                  <p style="margin:0;color:#92400e;font-size:13px;">
                    ⚠️ Este é apenas um e-mail de <strong>teste</strong>. O link acima contém um token fictício e não funciona.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="background:#f9fafb;border-top:1px solid #e5e7eb;padding:24px 48px;text-align:center;">
            <p style="margin:0;color:#9ca3af;font-size:12px;">© ${new Date().getFullYear()} Convoca</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
});

if (error) {
  console.error("❌ Falha ao enviar e-mail:");
  console.error(error);
  process.exit(1);
}

console.log("✅ E-mail enviado com sucesso!");
console.log(`   ID      : ${data.id}`);
console.log(`   Para    : ${TO_EMAIL}`);
console.log("\nVerifique sua caixa de entrada (e o spam) em luisfboff@hotmail.com");
