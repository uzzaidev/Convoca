import { redirect } from "next/navigation";
import { requireSystemAdmin } from "@/lib/auth-helpers";
import { sql } from "@/db/client";

type QuotaRow = {
  id: string;
  name: string;
  email: string;
  monthly_token_limit: number;
  monthly_request_limit: number;
  requests_used: number;
  tokens_used: number;
  cost_usd_cents: number;
};

export default async function AdminAgentPage() {
  let adminUser;
  try {
    adminUser = await requireSystemAdmin();
  } catch {
    redirect("/dashboard");
  }

  const currentMonth = new Date()
    .toISOString()
    .slice(0, 7)
    .replace("-", "");

  const rows = await sql<QuotaRow[]>`
    SELECT
      u.id,
      u.name,
      u.email,
      COALESCE(q.monthly_token_limit, 200000) AS monthly_token_limit,
      COALESCE(q.monthly_request_limit, 200) AS monthly_request_limit,
      COALESCE(au.requests, 0) AS requests_used,
      COALESCE(au.input_tokens + au.output_tokens + au.reasoning_tokens, 0) AS tokens_used,
      COALESCE(au.cost_usd_cents, 0) AS cost_usd_cents
    FROM users u
    LEFT JOIN agent_quotas q ON q.user_id = u.id
    LEFT JOIN agent_usage au ON au.user_id = u.id AND au.year_month = ${currentMonth}
    ORDER BY COALESCE(au.requests, 0) DESC
    LIMIT 200
  `;

  const settings = await sql`
    SELECT key, value FROM agent_settings ORDER BY key
  `;

  return (
    <div className="min-h-screen bg-background">
      <main className="max-w-5xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Agente de IA — Administração</h1>

        {/* Configurações */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold mb-3">Configurações</h2>
          <div className="rounded-lg border bg-card p-4">
            <pre className="text-xs overflow-x-auto">
              {JSON.stringify(
                settings.reduce(
                  (acc, r) => ({ ...acc, [r.key as string]: r.value }),
                  {}
                ),
                null,
                2
              )}
            </pre>
          </div>
        </section>

        {/* Uso por usuário */}
        <section>
          <h2 className="text-lg font-semibold mb-3">Uso este mês</h2>
          <div className="rounded-lg border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted">
                <tr>
                  <th className="px-3 py-2 text-left">Usuário</th>
                  <th className="px-3 py-2 text-right">Req</th>
                  <th className="px-3 py-2 text-right">Limite Req</th>
                  <th className="px-3 py-2 text-right">Tokens</th>
                  <th className="px-3 py-2 text-right">Limite Tokens</th>
                  <th className="px-3 py-2 text-right">Custo (¢)</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id} className="border-t">
                    <td className="px-3 py-2">
                      <div className="font-medium">{row.name}</div>
                      <div className="text-muted-foreground text-xs">{row.email}</div>
                    </td>
                    <td className="px-3 py-2 text-right">{row.requests_used}</td>
                    <td className="px-3 py-2 text-right">{row.monthly_request_limit}</td>
                    <td className="px-3 py-2 text-right">
                      {Number(row.tokens_used).toLocaleString("pt-BR")}
                    </td>
                    <td className="px-3 py-2 text-right">
                      {Number(row.monthly_token_limit).toLocaleString("pt-BR")}
                    </td>
                    <td className="px-3 py-2 text-right">{row.cost_usd_cents}</td>
                  </tr>
                ))}
                {rows.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-3 py-6 text-center text-muted-foreground"
                    >
                      Nenhum uso registrado este mês
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}
