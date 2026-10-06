// Sorteio: aba Times, sortear e confirmar
import { PD, matchReady } from "./_api.mjs";
export async function setup({ api }) { return matchReady(api, "confirmed"); }
export default async function ({ page, r, data, BASE }) {
  await page.goto(`${BASE}/groups/${PD}/events/${data.eventId}`);
  const tab = page.getByRole("tab").and(page.locator('[id$="trigger-teams"]'));
  await tab.waitFor({ timeout: 30000 });
  await r.wait(1); r.start(); await r.wait(.6);
  await r.tap("aba", tab); await r.wait(.9);
  const sort = page.getByRole("button", { name: "Sortear" }).first();
  await sort.waitFor(); await r.wait(.4);
  await r.tap("sortear", sort); await r.wait(.8);
  await r.tap("confirmar", page.getByRole("button", { name: "Confirmar Sorteio" }));
  await page.getByText("Time A").first().waitFor({ timeout: 20000 });
  await r.mark("done"); await r.wait(1);
  await r.scroll(420, 1.3); await r.wait(1);
  await r.scroll(420, 1.3); await r.wait(.8);
}
