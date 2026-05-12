import { SignJWT, jwtVerify } from "jose";

export interface AgentSessionPayload {
  userId: string;
  groupId: string;
  role: "admin" | "member";
}

function getSecret(): Uint8Array {
  const secret = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET não configurado");
  return new TextEncoder().encode(secret);
}

/** Assina um session token curto (HS256, expira em 10 minutos) */
export async function signAgentSessionToken(
  payload: AgentSessionPayload
): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("10m")
    .sign(getSecret());
}

/** Valida e decodifica o session token. Lança erro se inválido ou expirado. */
export async function verifyAgentSessionToken(
  token: string
): Promise<AgentSessionPayload> {
  const { payload } = await jwtVerify(token, getSecret(), {
    algorithms: ["HS256"],
  });

  const { userId, groupId, role } = payload as Record<string, unknown>;

  if (
    typeof userId !== "string" ||
    typeof groupId !== "string" ||
    (role !== "admin" && role !== "member")
  ) {
    throw new Error("Payload do session token inválido");
  }

  return { userId, groupId, role };
}
