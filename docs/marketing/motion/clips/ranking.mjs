// Ranking: abas da tabela de classificação
const PD = "aaaabbbb-cccc-dddd-eeee-111111111111";
export default async function ({ page, r, BASE }) {
  await page.goto(`${BASE}/groups/${PD}`);
  await page.getByText("Rankings").first().waitFor({ timeout: 30000 });
  await page.waitForLoadState("networkidle");
  const tab = (v) => page.getByRole("tab").and(page.locator(`[id$="trigger-${v}"]`));
  await r.wait(.6); r.start(); await r.wait(.5);
  const y = (await tab("geral").boundingBox()).y; await r.scroll(y - 130, 1.2); await r.wait(.9);
  await r.tap("art", tab("artilheiros")); await r.wait(1.3);
  await r.tap("gar", tab("garcons")); await r.wait(1.2);
  await r.tap("gol", tab("goleiros")); await r.wait(1.2);
  await r.tap("geral", tab("geral")); await r.wait(1.3);
}
