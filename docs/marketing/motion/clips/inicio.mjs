// 01 — Dashboard: abre o app, rola até os grupos e entra na Pelada do Parque
const PD = "aaaabbbb-cccc-dddd-eeee-111111111111"; // Pelada do Parque (grupo de teste do Pedro)
export default async function ({ page, r, BASE }) {
  await page.goto(BASE + "/dashboard");
  await page.waitForLoadState("networkidle");
  await r.wait(.8); r.start(); await r.wait(.6);
  await r.scroll(520, 1.4); await r.wait(.7);
  await r.scroll(520, 1.2); await r.wait(.5);
  await r.tap("grupo", page.locator(`a[href="/groups/${PD}"]`).filter({ hasText: "membros" }).first());
  await page.getByText("Minhas Estatísticas").waitFor({ timeout: 30000 }); // passa do skeleton
  await r.mark("done"); await r.wait(1.4);
}
