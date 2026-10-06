// IA: pergunta sobre os gols do Pedro no último jogo
import { PD, matchReady } from "./_api.mjs";
export async function setup({ api }) {
  // "último jogo" = o mais recente que já aconteceu: grava às 11:00 de hoje (passado), não às 20:00
  const today = new Date(Date.now() - 3 * 3600e3).toISOString().slice(0, 10);
  const m = await matchReady(api, "finished", { startsAt: `${today}T11:00` });
  console.log("  evento ia:", m.eventId);
  return { eventId: m.eventId };
}
export default async function ({ page, r, BASE }) {
  await page.goto(`${BASE}/groups/${PD}/chat`);
  await page.getByText("Como posso te ajudar hoje?").waitFor({ timeout: 30000 });
  await r.wait(.8);
  r.start(); await r.wait(.6);
  const input = page.getByPlaceholder("Digite sua mensagem...");
  await r.type("pergunta", input, "Quantos gols eu marquei no último jogo?", 55);
  await r.wait(.7);
  await r.tap("enviar", page.getByRole("button", { name: "Enviar" }));
  await page.getByRole("button", { name: "Parar" }).waitFor({ timeout: 15000 }).catch(() => {});
  await page.getByRole("button", { name: "Enviar" }).waitFor({ timeout: 90000 });
  await r.mark("done"); await r.wait(.3);
  await r.mark("zoom", page.getByText(/marcou/).last()); // motion aproxima a resposta
  await r.wait(2.4);
  console.log("  resposta:", (await page.locator("div.overflow-y-auto").first().innerText()).replace(/\n+/g, " | "));
}
