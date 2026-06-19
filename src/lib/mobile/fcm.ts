import { importPKCS8, SignJWT } from "jose";
import { sql } from "@/db/client";

/**
 * Envio de push via FCM HTTP v1 usando a service account do Firebase.
 * Credencial vem de FIREBASE_SERVICE_ACCOUNT (JSON completo) no ambiente (Doppler prd).
 * Não usa firebase-admin — apenas jose (já é dependência) + fetch.
 */

type ServiceAccount = {
  client_email: string;
  private_key: string;
  project_id: string;
  token_uri?: string;
};

const FCM_SCOPE = "https://www.googleapis.com/auth/firebase.messaging";
const DEFAULT_TOKEN_URI = "https://oauth2.googleapis.com/token";

let cachedToken: { value: string; exp: number } | null = null;

function getServiceAccount(): ServiceAccount {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!raw) {
    throw new Error("FIREBASE_SERVICE_ACCOUNT não configurada");
  }
  return JSON.parse(raw) as ServiceAccount;
}

async function getAccessToken(sa: ServiceAccount): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  if (cachedToken && cachedToken.exp - 60 > now) {
    return cachedToken.value;
  }

  const tokenUri = sa.token_uri ?? DEFAULT_TOKEN_URI;
  const key = await importPKCS8(sa.private_key, "RS256");
  const assertion = await new SignJWT({ scope: FCM_SCOPE })
    .setProtectedHeader({ alg: "RS256", typ: "JWT" })
    .setIssuer(sa.client_email)
    .setSubject(sa.client_email)
    .setAudience(tokenUri)
    .setIssuedAt(now)
    .setExpirationTime(now + 3600)
    .sign(key);

  const res = await fetch(tokenUri, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }),
  });

  if (!res.ok) {
    throw new Error(`Falha ao obter access token FCM: ${res.status} ${await res.text()}`);
  }

  const json = (await res.json()) as { access_token: string; expires_in?: number };
  cachedToken = { value: json.access_token, exp: now + (json.expires_in ?? 3600) };
  return cachedToken.value;
}

export type PushMessage = {
  title: string;
  body: string;
  data?: Record<string, string>;
};

export type FcmSendResult = {
  token: string;
  ok: boolean;
  invalid?: boolean;
  error?: string;
};

/** Envia uma mensagem para uma lista de tokens FCM. */
export async function sendPushToTokens(
  tokens: string[],
  message: PushMessage
): Promise<FcmSendResult[]> {
  if (tokens.length === 0) return [];

  const sa = getServiceAccount();
  const projectId = process.env.FIREBASE_PROJECT_ID ?? sa.project_id;
  const accessToken = await getAccessToken(sa);
  const url = `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`;

  return Promise.all(
    tokens.map(async (token): Promise<FcmSendResult> => {
      try {
        const res = await fetch(url, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            message: {
              token,
              notification: { title: message.title, body: message.body },
              ...(message.data ? { data: message.data } : {}),
            },
          }),
        });

        if (res.ok) return { token, ok: true };

        const errText = await res.text();
        // Token inválido/expirado: 404 UNREGISTERED ou 400 INVALID_ARGUMENT
        const invalid = res.status === 404 || /UNREGISTERED|INVALID_ARGUMENT/.test(errText);
        return { token, ok: false, invalid, error: `${res.status} ${errText}` };
      } catch (error) {
        return {
          token,
          ok: false,
          error: error instanceof Error ? error.message : "Erro ao enviar push",
        };
      }
    })
  );
}

/**
 * Envia push para todos os devices de um usuário (tabela push_tokens) e
 * remove tokens inválidos automaticamente.
 */
export async function sendPushToUser(
  userId: string,
  message: PushMessage
): Promise<FcmSendResult[]> {
  const rows = await sql<{ token: string }[]>`
    SELECT token FROM push_tokens WHERE user_id = ${userId}
  `;
  const tokens = rows.map((row) => row.token);

  const results = await sendPushToTokens(tokens, message);

  const invalidTokens = results.filter((r) => r.invalid).map((r) => r.token);
  for (const token of invalidTokens) {
    await sql`DELETE FROM push_tokens WHERE token = ${token}`;
  }

  return results;
}
