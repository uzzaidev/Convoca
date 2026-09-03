/**
 * screenshots.mjs — Convoca full-app screenshot runner
 *
 * Uso:
 *   node screenshots.mjs              → viewport mobile padrão (auditoria/dev)
 *   node screenshots.mjs --play       → Google Play (412×732 @3x → 1236×2196)
 *   node screenshots.mjs --appstore   → App Store iPhone 6.9" (440×956 @3x → 1320×2868)
 *
 * Saída: C:/Users/pedro/app-screenshots/<modo>/
 */

import puppeteer from "puppeteer-core";
import { mkdirSync, writeFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

// ──────────────────────────────────────────────
// CONFIG
// ──────────────────────────────────────────────
const BASE   = "https://convoca.uzzai.com.br";
const EMAIL  = "demo.review@convoca.uzzai.com.br";
const PASS   = "ConvocaDemo2026";
const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const USER   = "pedro";

const mode = process.argv.includes("--appstore") ? "appstore"
           : process.argv.includes("--play")     ? "play"
           :                                       "mobile";

const VIEWPORT = {
  mobile:   { width: 390, height: 844, deviceScaleFactor: 2 },  // iPhone 14 CSS size
  play:     { width: 412, height: 732, deviceScaleFactor: 3 },  // 9:16 ratio 1.78 ✅
  appstore: { width: 440, height: 956, deviceScaleFactor: 3 },  // iPhone 6.9" 2.17 ✅
}[mode];

const OUT = `C:/Users/${USER}/app-screenshots/${mode}`;
mkdirSync(OUT, { recursive: true });

console.log(`\n🎬 Modo: ${mode} | Viewport: ${VIEWPORT.width}×${VIEWPORT.height} @${VIEWPORT.deviceScaleFactor}x`);
console.log(`📁 Saída: ${OUT}\n`);

// ──────────────────────────────────────────────
// HELPERS
// ──────────────────────────────────────────────
const settle  = (ms = 1800) => new Promise(r => setTimeout(r, ms));
let shotIndex = 1;

async function shot(page, label) {
  const n = String(shotIndex++).padStart(3, "0");
  const fname = `${n}-${label}.png`;
  await page.screenshot({ path: join(OUT, fname), fullPage: false });
  console.log(`  📸 ${fname}`);
  return fname;
}

async function shotFull(page, label) {
  const n = String(shotIndex++).padStart(3, "0");
  const fname = `${n}-${label}-full.png`;
  await page.screenshot({ path: join(OUT, fname), fullPage: true });
  console.log(`  📸 ${fname} (full page)`);
  return fname;
}

async function goto(page, path, label, waitMs = 2500) {
  console.log(`\n→ ${path}`);
  await page.goto(`${BASE}${path}`, { waitUntil: "networkidle2", timeout: 30000 });
  await settle(waitMs);
  if (label) await shot(page, label);
}

// Extrai hrefs de todos os links que começam com /groups ou /events
async function extractLinks(page, pattern) {
  return page.evaluate((p) => {
    return [...document.querySelectorAll("a[href]")]
      .map(a => a.getAttribute("href"))
      .filter(h => h && h.startsWith(p))
      .filter((v, i, a) => a.indexOf(v) === i); // unique
  }, pattern);
}

// ──────────────────────────────────────────────
// MAIN
// ──────────────────────────────────────────────
const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: "new",
  args: ["--no-sandbox", "--hide-scrollbars", "--disable-gpu", "--lang=pt-BR"],
});

const page = await browser.newPage();
await page.setViewport({ ...VIEWPORT, isMobile: true, hasTouch: true });
await page.setUserAgent(
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) " +
  "AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1"
);
// Português
await page.setExtraHTTPHeaders({ "Accept-Language": "pt-BR,pt;q=0.9" });

// ──────────────────────────────────────────────
// 1. TELAS PÚBLICAS
// ──────────────────────────────────────────────
console.log("\n── TELAS PÚBLICAS ──");
await goto(page, "/auth/signin",  "signin");
await goto(page, "/auth/signup",  "signup");
await goto(page, "/produto-convoca", "landing", 3000);
await shotFull(page, "landing");

// ──────────────────────────────────────────────
// 2. LOGIN
// ──────────────────────────────────────────────
console.log("\n── LOGIN ──");
await page.goto(`${BASE}/auth/signin`, { waitUntil: "networkidle2" });
await settle(1500);

await page.type('input[type="email"]',    EMAIL, { delay: 30 });
await page.type('input[type="password"]', PASS,  { delay: 30 });
await Promise.all([
  page.click('button[type="submit"]'),
  page.waitForNavigation({ waitUntil: "networkidle2", timeout: 20000 }).catch(() => {}),
]);
await settle(3000);

const urlAfterLogin = page.url();
console.log(`  URL pós-login: ${urlAfterLogin}`);
if (urlAfterLogin.includes("/auth/")) {
  console.error("  ❌ Login falhou — verifique email/senha");
  await browser.close();
  process.exit(1);
}
console.log("  ✅ Login ok");

// ──────────────────────────────────────────────
// 3. DASHBOARD
// ──────────────────────────────────────────────
console.log("\n── DASHBOARD ──");
await goto(page, "/dashboard", "dashboard");
await shotFull(page, "dashboard");

// Extrair IDs de grupos disponíveis
const groupLinks = await extractLinks(page, "/groups/");
const groupIds = [...new Set(
  groupLinks
    .map(l => l.match(/^\/groups\/([a-f0-9-]{36})/)?.[1])
    .filter(Boolean)
)];
console.log(`  Grupos encontrados: ${groupIds.length}`);

// ──────────────────────────────────────────────
// 4. PROFILE / SETTINGS
// ──────────────────────────────────────────────
console.log("\n── PERFIL & CONFIGURAÇÕES ──");
await goto(page, "/profile",  "profile");
await goto(page, "/settings", "settings");

// ──────────────────────────────────────────────
// 5. GRUPOS
// ──────────────────────────────────────────────
const allEventIds = [];

for (const [gi, groupId] of groupIds.entries()) {
  console.log(`\n── GRUPO ${gi + 1}/${groupIds.length} (${groupId.slice(0, 8)}…) ──`);
  const gPrefix = `grupo${gi + 1}`;

  // Página principal do grupo
  await goto(page, `/groups/${groupId}`, `${gPrefix}-home`);
  await shotFull(page, `${gPrefix}-home`);

  // Extrair event IDs desta página
  const evLinks = await extractLinks(page, "/events/");
  const evIds = [...new Set(
    evLinks
      .map(l => l.match(/^\/events\/([a-f0-9-]{36})/)?.[1])
      .filter(Boolean)
  )];
  evIds.forEach(id => { if (!allEventIds.includes(id)) allEventIds.push(id); });
  console.log(`    Eventos encontrados: ${evIds.length}`);

  // Aba de configurações
  await goto(page, `/groups/${groupId}/settings`, `${gPrefix}-settings`);
  await shotFull(page, `${gPrefix}-settings`);

  // Aba de pagamentos
  await goto(page, `/groups/${groupId}/payments`, `${gPrefix}-payments`);

  // Aba de eventos
  await goto(page, `/groups/${groupId}/events`, `${gPrefix}-events`).catch(() => {});

  // Campeonatos
  await goto(page, `/groups/${groupId}/championships`, `${gPrefix}-championships`).catch(() => {});

  // Chat do agente (mobile)
  await goto(page, `/groups/${groupId}/chat`, `${gPrefix}-agent-chat`);

  // Criar evento (formulário)
  await goto(page, `/groups/${groupId}/events/new`, `${gPrefix}-new-event`).catch(() => {});
}

// ──────────────────────────────────────────────
// 6. EVENTOS
// ──────────────────────────────────────────────
if (allEventIds.length === 0) {
  // Tentar /events via API para descobrir IDs
  const res = await page.evaluate(async (base) => {
    const r = await fetch(`${base}/api/events`);
    if (!r.ok) return [];
    const data = await r.json();
    return (data.events || []).map(e => e.id);
  }, BASE);
  res.forEach(id => { if (!allEventIds.includes(id)) allEventIds.push(id); });
}

const eventsToVisit = allEventIds.slice(0, 6); // máx 6 eventos para não demorar demais
console.log(`\n── EVENTOS (${eventsToVisit.length}) ──`);

for (const [ei, eventId] of eventsToVisit.entries()) {
  const ePrefix = `evento${ei + 1}`;
  await goto(page, `/events/${eventId}`, `${ePrefix}-home`);
  await shotFull(page, `${ePrefix}-home`);
}

// ──────────────────────────────────────────────
// 7. TELAS AUXILIARES
// ──────────────────────────────────────────────
console.log("\n── TELAS AUXILIARES ──");
await goto(page, "/groups/join",  "join-group");
await goto(page, "/groups/new",   "new-group");
await goto(page, "/privacidade",  "privacidade").catch(() => {});
await goto(page, "/termos",       "termos").catch(() => {});

// ──────────────────────────────────────────────
// 8. CONTACT SHEET
// ──────────────────────────────────────────────
console.log("\n── GERANDO CONTACT SHEET ──");
const imgs = readdirSync(OUT)
  .filter(f => f.endsWith(".png") && !f.startsWith("_"))
  .sort();

const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8">
<style>
  body { margin:0; background:#111; display:grid; grid-template-columns:repeat(4,1fr); gap:4px; }
  .wrap { position:relative; }
  img { width:100%; display:block; }
  span { position:absolute; top:4px; left:4px; background:#000c; color:#4eff91;
         font:bold 14px monospace; padding:2px 6px; border-radius:3px; }
</style></head><body>
${imgs.map(f => `<div class="wrap"><img src="${f}"><span>${f.replace(".png","")}</span></div>`).join("")}
</body></html>`;

writeFileSync(join(OUT, "_contact.html"), html);

// Renderizar contact sheet como PNG
const contactPage = await browser.newPage();
await contactPage.setViewport({ width: 1200, height: 800, deviceScaleFactor: 1 });
await contactPage.goto(`file:///${OUT.replace(/\\/g,"/")}/_contact.html`, { waitUntil: "networkidle2" });
await settle(2000);
await contactPage.screenshot({ path: join(OUT, "_CONTACT_SHEET.png"), fullPage: true });
console.log(`  📋 _CONTACT_SHEET.png`);

await browser.close();

console.log(`\n✅ DONE — ${imgs.length} screenshots em: ${OUT}`);
console.log(`   Abra: ${OUT}/_CONTACT_SHEET.png`);
