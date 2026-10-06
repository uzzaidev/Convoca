// Craque: Pedro vota pela UI
import { PD, createEvent, confirmPlayers, drawTeams, startMatch, addGoal, finishMatch, members } from "./_api.mjs";
export async function setup({ api }) {
  const d = new Date(Date.now() + 3600e3);
  const eventId = await createEvent(api, { startsAt: new Date(d.getTime() - 3 * 3600e3).toISOString().slice(0, 16) });
  await confirmPlayers(api, eventId, 14);
  const teams = await drawTeams(api, eventId);
  await startMatch(api, eventId);
  const all = teams.flatMap(t => t.members.map(x => ({ ...x, team: t })));
  const pedro = all.find(x => x.userName.startsWith("Pedro Costa"));
  const mate = all.find(x => x.team === pedro.team && x !== pedro);
  await addGoal(api, eventId, { userId: pedro.userId, teamId: pedro.team.id });
  await addGoal(api, eventId, { userId: mate.userId, teamId: mate.team.id });
  await finishMatch(api, eventId);
  console.log("  evento craque:", eventId);
  return { eventId, vote: mate.userName };
}
export default async function ({ page, r, data, BASE }) {
  await page.goto(`${BASE}/groups/${PD}/events/${data.eventId}`);
  const tab = page.locator('[id$="trigger-ratings"]');
  await tab.waitFor({ timeout: 30000 });
  await r.wait(1);
  r.start(); await r.wait(.6);
  await r.tap("aba", tab);
  await page.getByText("Craque da Partida").first().waitFor({ timeout: 30000 });
  await r.wait(.9);
  await r.tap("voto", page.getByText(data.vote, { exact: true }).first());
  await r.wait(.8);
  await r.tap("salvar", page.getByRole("button", { name: "Salvar Voto" }));
  await page.getByText("Seu voto").first().waitFor({ timeout: 30000 });
  await r.mark("done"); await r.wait(1.8);
}
