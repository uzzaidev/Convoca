// Ao vivo: registra um gol do Pedro pela UI
import { PD, matchReady } from "./_api.mjs";
export async function setup({ api }) {
  const m = await matchReady(api, "live");
  const pedro = m.teams.flatMap(t => t.members.map(x => ({ ...x, team: t }))).find(x => x.userName.startsWith("Pedro Costa"));
  console.log("  evento ao-vivo:", m.eventId);
  return { eventId: m.eventId, teamName: pedro.team.name };
}
export default async function ({ page, r, data, BASE }) {
  await page.goto(`${BASE}/groups/${PD}/events/${data.eventId}`);
  const tab = page.locator('[id$="trigger-match"]');
  await tab.waitFor({ timeout: 30000 });
  await page.waitForLoadState("domcontentloaded");
  await r.wait(1);
  r.start(); await r.wait(.6);
  await r.tap("aba", tab);
  await page.getByText("Adicionar Ação").waitFor({ timeout: 30000 });
  await r.wait(.8);
  await page.getByRole("combobox").first().click(); await r.wait(.4);
  await page.getByRole("option", { name: data.teamName, exact: true }).click(); await r.wait(.5);
  await page.getByRole("combobox").nth(1).click(); await r.wait(.4);
  await r.tap("jogador", page.getByRole("option", { name: /Pedro Costa/ }));
  await r.wait(.7);
  await r.tap("gol", page.getByRole("button", { name: /^Gol$/ }));
  await page.getByText("Gol registrado!").first().waitFor({ timeout: 30000 });
  await r.mark("done"); await r.wait(1.8);
  await r.scroll(-400, .8); await r.wait(1.2);
}
