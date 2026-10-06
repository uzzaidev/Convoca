// Confirmar presença: Pedro escolhe a posição e confirma
import { PD, createEvent, confirmPlayers } from "./_api.mjs";
export async function setup({ api }) {
  const sp = new Date(Date.now() + 24 * 3600e3 - 3 * 3600e3).toISOString().slice(0, 10) + "T20:00";
  const eventId = await createEvent(api, { startsAt: sp });
  await confirmPlayers(api, eventId, 9, { includePedro: false });
  return { eventId };
}
export default async function ({ page, r, data, BASE }) {
  await page.goto(`${BASE}/groups/${PD}/events/${data.eventId}`);
  const btn = page.getByRole("button", { name: "Confirmar Presença" });
  await btn.waitFor({ timeout: 30000 });
  await page.getByText("Meio-campo").first().waitFor();
  await r.wait(.8); r.start(); await r.wait(.7);
  await r.tap("posicao", page.getByRole("button", { name: "Atacante" }).first()); await r.wait(1);
  await r.tap("confirmar", btn);
  await page.getByText("Jogadores Confirmados (10/14)").waitFor({ timeout: 40000 });
  await r.mark("done"); await r.wait(.8);
  const y = (await page.getByText("Jogadores Confirmados (10/14)").boundingBox()).y;
  await r.scroll(y - 120, 1.3); await r.wait(1.5);
}
