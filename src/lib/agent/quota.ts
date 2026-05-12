import { sql } from "@/db/client";
import logger from "@/lib/logger";

// Preços do gpt-5.4-nano (USD por 1M tokens) — Standard
// https://developers.openai.com/api/docs/pricing
const PRICING = {
  input_per_1m: 0.20,
  output_per_1m: 1.25,
  reasoning_per_1m: 1.25,
};

function currentYearMonth(): string {
  const now = new Date();
  const y = now.getUTCFullYear();
  const m = String(now.getUTCMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

async function getDefaultLimits(): Promise<{
  tokenLimit: number;
  requestLimit: number;
}> {
  const rows = await sql<{ key: string; value: string }[]>`
    SELECT key, value FROM agent_settings
    WHERE key IN ('default_monthly_token_limit', 'default_monthly_request_limit')
  `;
  const map = Object.fromEntries(rows.map((r) => [r.key, r.value]));
  return {
    tokenLimit: parseInt(map["default_monthly_token_limit"] ?? "10000000", 10),
    requestLimit: parseInt(map["default_monthly_request_limit"] ?? "2000", 10),
  };
}

/**
 * Checa se o usuário tem quota disponível e incrementa o contador de requests.
 * Deve ser chamada ANTES de chamar a OpenAI.
 * Lança erro com status 429 se quota esgotada.
 */
export async function checkAndReserveQuota(userId: string): Promise<void> {
  const yearMonth = currentYearMonth();

  // Busca quota do usuário (usa defaults se não existir)
  const [quota, defaults] = await Promise.all([
    sql<{ monthly_token_limit: number; monthly_request_limit: number }[]>`
      SELECT monthly_token_limit, monthly_request_limit
      FROM agent_quotas
      WHERE user_id = ${userId}
    `,
    getDefaultLimits(),
  ]);

  const tokenLimit = Number(quota[0]?.monthly_token_limit ?? defaults.tokenLimit);
  const requestLimit = Number(quota[0]?.monthly_request_limit ?? defaults.requestLimit);

  // Busca uso atual
  const usage = await sql<{
    requests: number;
    input_tokens: number;
    output_tokens: number;
    reasoning_tokens: number;
  }[]>`
    SELECT requests, input_tokens, output_tokens, reasoning_tokens
    FROM agent_usage
    WHERE user_id = ${userId} AND year_month = ${yearMonth}
  `;

  const currentRequests = Number(usage[0]?.requests ?? 0);
  const currentTokens =
    Number(usage[0]?.input_tokens ?? 0) +
    Number(usage[0]?.output_tokens ?? 0) +
    Number(usage[0]?.reasoning_tokens ?? 0);

  if (currentRequests >= requestLimit) {
    const err = new Error(
      `Limite mensal de ${requestLimit} requests atingido. Tente novamente no próximo mês.`
    );
    (err as NodeJS.ErrnoException).code = "QUOTA_EXCEEDED";
    throw err;
  }

  if (currentTokens >= tokenLimit) {
    const err = new Error(
      `Limite mensal de ${tokenLimit} tokens atingido. Tente novamente no próximo mês.`
    );
    (err as NodeJS.ErrnoException).code = "QUOTA_EXCEEDED";
    throw err;
  }

  // Incrementa requests de forma otimista
  await sql`
    INSERT INTO agent_usage (user_id, year_month, requests)
    VALUES (${userId}, ${yearMonth}, 1)
    ON CONFLICT (user_id, year_month)
    DO UPDATE SET requests = agent_usage.requests + 1
  `;
}

interface UsageRecord {
  input_tokens?: number;
  output_tokens?: number;
  reasoning_tokens?: number;
}

/**
 * Grava o uso real de tokens após a chamada à OpenAI.
 * Deve ser chamada no finally/ao terminar o stream.
 */
export async function recordUsage(
  userId: string,
  usage: UsageRecord
): Promise<void> {
  const yearMonth = currentYearMonth();
  const inputTokens = usage.input_tokens ?? 0;
  const outputTokens = usage.output_tokens ?? 0;
  const reasoningTokens = usage.reasoning_tokens ?? 0;

  const costCents = Math.round(
    ((inputTokens / 1_000_000) * PRICING.input_per_1m +
      (outputTokens / 1_000_000) * PRICING.output_per_1m +
      (reasoningTokens / 1_000_000) * PRICING.reasoning_per_1m) *
      100
  );

  try {
    await sql`
      INSERT INTO agent_usage (user_id, year_month, input_tokens, output_tokens, reasoning_tokens, cost_usd_cents)
      VALUES (${userId}, ${yearMonth}, ${inputTokens}, ${outputTokens}, ${reasoningTokens}, ${costCents})
      ON CONFLICT (user_id, year_month) DO UPDATE SET
        input_tokens = agent_usage.input_tokens + ${inputTokens},
        output_tokens = agent_usage.output_tokens + ${outputTokens},
        reasoning_tokens = agent_usage.reasoning_tokens + ${reasoningTokens},
        cost_usd_cents = agent_usage.cost_usd_cents + ${costCents}
    `;
  } catch (err) {
    logger.error({ err, userId }, "Falha ao gravar uso do agente");
  }
}

/** Retorna o uso e limites do usuário no mês corrente. */
export async function getUserQuotaStatus(userId: string): Promise<{
  requestsUsed: number;
  requestLimit: number;
  tokensUsed: number;
  tokenLimit: number;
}> {
  const yearMonth = currentYearMonth();
  const [quota, defaults, usage] = await Promise.all([
    sql<{ monthly_token_limit: number; monthly_request_limit: number }[]>`
      SELECT monthly_token_limit, monthly_request_limit
      FROM agent_quotas WHERE user_id = ${userId}
    `,
    getDefaultLimits(),
    sql<{
      requests: number;
      input_tokens: number;
      output_tokens: number;
      reasoning_tokens: number;
    }[]>`
      SELECT requests, input_tokens, output_tokens, reasoning_tokens
      FROM agent_usage WHERE user_id = ${userId} AND year_month = ${yearMonth}
    `,
  ]);

  return {
    requestsUsed: Number(usage[0]?.requests ?? 0),
    requestLimit: Number(quota[0]?.monthly_request_limit ?? defaults.requestLimit),
    tokensUsed:
      Number(usage[0]?.input_tokens ?? 0) +
      Number(usage[0]?.output_tokens ?? 0) +
      Number(usage[0]?.reasoning_tokens ?? 0),
    tokenLimit: Number(quota[0]?.monthly_token_limit ?? defaults.tokenLimit),
  };
}
