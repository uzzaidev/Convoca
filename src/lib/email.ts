import { Resend } from "resend";
import logger from "@/lib/logger";

const FROM_EMAIL =
  process.env.RESEND_FROM_EMAIL || "Convoca <no-reply@convoca.app>";

export async function sendPasswordResetEmail(
  to: string,
  resetLink: string,
  userName: string
): Promise<void> {
  if (!process.env.RESEND_API_KEY) {
    logger.warn(
      { to, resetLink },
      "RESEND_API_KEY não configurada — e-mail NÃO enviado"
    );
    return;
  }

  const resend = new Resend(process.env.RESEND_API_KEY);

  const { error } = await resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: "Redefinição de senha — Convoca",
    html: buildResetEmailHtml(userName, resetLink),
  });

  if (error) {
    logger.error({ error, to }, "Falha ao enviar e-mail de redefinição de senha");
    throw new Error("Falha ao enviar e-mail de redefinição de senha");
  }

  logger.info({ to }, "E-mail de redefinição de senha enviado com sucesso");
}

function buildResetEmailHtml(userName: string, resetLink: string): string {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Redefinição de senha — Convoca</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#1a2e4a 0%,#16a34a 100%);padding:40px 48px;text-align:center;">
              <table cellpadding="0" cellspacing="0" style="margin:0 auto 16px;">
                <tr>
                  <td style="background-color:rgba(255,255,255,0.15);border-radius:50%;width:64px;height:64px;text-align:center;vertical-align:middle;">
                    <span style="font-size:32px;line-height:64px;">⚽</span>
                  </td>
                </tr>
              </table>
              <h1 style="margin:0;color:#ffffff;font-size:28px;font-weight:700;letter-spacing:-0.5px;">Convoca</h1>
              <p style="margin:6px 0 0;color:rgba(255,255,255,0.8);font-size:14px;">Organize suas peladas de forma profissional</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:48px;">
              <h2 style="margin:0 0 8px;color:#1a2e4a;font-size:22px;font-weight:700;">Olá, ${escapeHtml(userName)}!</h2>
              <p style="margin:0 0 24px;color:#6b7280;font-size:15px;line-height:1.6;">
                Recebemos uma solicitação para redefinir a senha da sua conta Convoca.
                Clique no botão abaixo para criar uma nova senha.
              </p>

              <!-- Button -->
              <table cellpadding="0" cellspacing="0" style="margin:0 0 32px;">
                <tr>
                  <td style="background-color:#16a34a;border-radius:8px;">
                    <a href="${resetLink}"
                       style="display:inline-block;padding:14px 32px;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;letter-spacing:0.2px;">
                      Redefinir minha senha
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:0 0 8px;color:#6b7280;font-size:13px;line-height:1.6;">
                Se o botão não funcionar, copie e cole o link abaixo no seu navegador:
              </p>
              <p style="margin:0 0 32px;word-break:break-all;">
                <a href="${resetLink}" style="color:#16a34a;font-size:13px;text-decoration:underline;">${resetLink}</a>
              </p>

              <!-- Warning box -->
              <table cellpadding="0" cellspacing="0" width="100%" style="margin:0 0 24px;">
                <tr>
                  <td style="background-color:#fefce8;border:1px solid #fbbf24;border-radius:8px;padding:16px 20px;">
                    <p style="margin:0;color:#92400e;font-size:13px;line-height:1.6;">
                      ⚠️ <strong>Este link expira em 1 hora.</strong>
                      Se você não solicitou a redefinição de senha, ignore este e-mail — sua conta permanece segura.
                    </p>
                  </td>
                </tr>
              </table>

              <p style="margin:0;color:#9ca3af;font-size:13px;line-height:1.6;">
                Por segurança, nunca compartilhe este link com outras pessoas.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:#f9fafb;border-top:1px solid #e5e7eb;padding:24px 48px;text-align:center;">
              <p style="margin:0;color:#9ca3af;font-size:12px;line-height:1.6;">
                © ${new Date().getFullYear()} Convoca · Todos os direitos reservados
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
