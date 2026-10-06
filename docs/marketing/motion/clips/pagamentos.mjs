// Pagamentos: resumo e filtro de status
const PD = "aaaabbbb-cccc-dddd-eeee-111111111111";
export default async function ({ page, r, BASE }) {
  await page.goto(`${BASE}/groups/${PD}/payments`);
  await page.getByText("Total Pendente").waitFor({ timeout: 30000 });
  await page.waitForLoadState("networkidle");
  await r.wait(.6); r.start(); await r.wait(1.2);
  await r.scroll(300, 1.2); await r.wait(.9);
  await r.tap("filtro", page.getByRole("combobox").filter({ hasText: "Todos os status" }));
  await r.wait(.9);
  await r.tap("opcao", page.getByRole("option", { name: "Pendente" }));
  await r.wait(1.4);
  await r.scroll(200, 1.0); await r.wait(.8);
}
