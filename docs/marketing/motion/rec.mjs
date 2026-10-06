/* Grava os clipes do app usados no motion (motion_convoca.html).

Cada clipe é um roteiro em clips/<nome>.mjs:
  export async function setup({ api })   -> opcional, roda FORA do vídeo (prepara dados via API)
                                             e devolve um objeto `data` para o roteiro
  export default async function ({ page, r, data, BASE }) -> o que aparece no vídeo

Saem clips/<nome>.webm e clips/<nome>.json ({ t0, events }); clips.js junta todos
(o motion abre via file://, sem fetch). `t0` = segundo do vídeo em que a ação começa;
cada evento tem o instante e a caixa do elemento na viewport (390x844), para o motion
desenhar o toque em cima. Um clique seguido de `done` marca espera (rede): o motion
acelera esse trecho.

Uso (app rodando em BASE, padrão http://localhost:3000):
  CONVOCA_EMAIL=... CONVOCA_PASSWORD=... node rec.mjs            # todos
  node rec.mjs sorteio ao-vivo                                    # só alguns
*/
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright-core";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const CLIPS = path.join(HERE, "clips");
const AUTH = path.join(HERE, ".auth", "state.json");
export const BASE = process.env.BASE || "http://localhost:3000";
const EDGE = process.env.EDGE || "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe";
export const VIEW = { width: 390, height: 844 };

async function login(browser) {
  if (fs.existsSync(AUTH)) return;
  const { CONVOCA_EMAIL: email, CONVOCA_PASSWORD: pass } = process.env;
  if (!email || !pass) throw new Error("defina CONVOCA_EMAIL e CONVOCA_PASSWORD (primeira vez)");
  const ctx = await browser.newContext(); const page = await ctx.newPage();
  await page.goto(BASE + "/auth/signin");
  await page.fill("#email", email); await page.fill("#password", pass);
  await page.click('button[type="submit"]');
  await page.waitForURL(u => !u.pathname.startsWith("/auth"), { timeout: 30000 });
  fs.mkdirSync(path.dirname(AUTH), { recursive: true });
  await ctx.storageState({ path: AUTH }); await ctx.close();
}

// Celular logado, sem banner de cookies nem tours guiados
export async function phone(browser, extra = {}) {
  const ctx = await browser.newContext({ viewport: VIEW, deviceScaleFactor: 2, isMobile: true, hasTouch: true,
    storageState: AUTH, locale: "pt-BR", timezoneId: "America/Sao_Paulo", ...extra });
  await ctx.addInitScript(() => {
    localStorage.setItem("convoca_consent_v1", JSON.stringify({ necessary: true, analytics: false, marketing: false,
      timestamp: new Date().toISOString(), version: "2026-07-21" }));
    for (const k of ["dashboard", "event", "group"]) localStorage.setItem(`convoca_${k}_tour_v1`, "1");
  });
  return ctx;
}

// fetch autenticado (mesmos cookies do app); lança erro se a resposta não for 2xx
function makeApi(ctx) {
  return async (method, url, body) => {
    const res = await ctx.request.fetch(BASE + url, { method, data: body });
    const text = await res.text();
    if (!res.ok()) throw new Error(`${method} ${url} -> ${res.status()} ${text.slice(0, 300)}`);
    try { return JSON.parse(text); } catch { return text; }
  };
}

export class Rec {
  // relógio do clipe: tempo desde a criação da página (= início do vídeo)
  constructor(page) { this.page = page; this.t_page = performance.now(); this.t0 = 0; this.events = []; }
  now() { return Math.round(performance.now() - this.t_page) / 1000; }
  start() { this.t0 = this.now(); }
  async mark(name, locator) {
    const box = locator ? await locator.boundingBox() : null;
    this.events.push({ name, t: this.now(),
      box: box && Object.fromEntries(Object.entries(box).map(([k, v]) => [k, Math.round(v * 10) / 10])) });
  }
  wait(s) { return this.page.waitForTimeout(s * 1000); }
  async tap(name, locator) {
    await locator.scrollIntoViewIfNeeded();
    await this.mark(name, locator);
    await locator.click();
  }
  async type(name, locator, text, delay = 70) {
    await this.mark(name, locator);
    await locator.click();
    await locator.pressSequentially(text, { delay });
  }
  // rolagem suave com easing (o gesto de dedo do vídeo); sel = contêiner rolável, padrão a página
  async scroll(dy, dur = 1.0, sel = null) {
    await this.page.evaluate(([dy, ms, sel]) => new Promise(done => {
      // sem sel: o maior contêiner que rola de fato (no app é um div overflow-auto, não o document)
      const el = sel ? document.querySelector(sel) : [...document.querySelectorAll("*")]
        .filter(e => e.scrollHeight > e.clientHeight + 20 && /auto|scroll/.test(getComputedStyle(e).overflowY))
        .sort((a, b) => b.clientHeight - a.clientHeight)[0] || document.scrollingElement;
      const y0 = el.scrollTop, t0 = performance.now();
      const step = (t) => {
        const k = Math.min(1, (t - t0) / ms), e = k < .5 ? 2 * k * k : 1 - (-2 * k + 2) ** 2 / 2;
        el.scrollTop = y0 + dy * e;
        k < 1 ? requestAnimationFrame(step) : done();
      };
      requestAnimationFrame(step);
    }), [dy, dur * 1000, sel]);
    await this.mark("scroll");
  }
}

function writeClipsJs() {
  const all = {};
  for (const f of fs.readdirSync(CLIPS).filter(f => f.endsWith(".json")).sort())
    all[f.replace(/\.json$/, "")] = JSON.parse(fs.readFileSync(path.join(CLIPS, f), "utf8"));
  fs.writeFileSync(path.join(HERE, "clips.js"), "window.CLIPS = " + JSON.stringify(all) + ";\n");
}

async function main() {
  const wanted = process.argv.slice(2).length ? process.argv.slice(2)
    : fs.readdirSync(CLIPS).filter(f => f.endsWith(".mjs")).map(f => f.replace(/\.mjs$/, ""));
  const tmp = path.join(HERE, "_rec", String(process.pid));
  const browser = await chromium.launch({ executablePath: EDGE });
  try {
    await login(browser);
    for (const name of wanted) {
      const mod = await import(`./clips/${name}.mjs`);
      console.log(`gravando ${name}...`);
      let data = {};
      if (mod.setup) {
        const sctx = await phone(browser);
        data = (await mod.setup({ api: makeApi(sctx), BASE })) ?? {};
        await sctx.close();
      }
      const ctx = await phone(browser, { recordVideo: { dir: tmp, size: VIEW } });
      const page = await ctx.newPage();
      page.on("pageerror", e => console.log("  pageerror:", String(e).slice(0, 400)));
      const r = new Rec(page);
      await mod.default({ page, r, data, BASE });
      await r.mark("end");
      const video = page.video();
      await ctx.close();
      fs.renameSync(await video.path(), path.join(CLIPS, `${name}.webm`));
      fs.writeFileSync(path.join(CLIPS, `${name}.json`), JSON.stringify({ t0: r.t0, events: r.events }, null, 1));
      console.log(`  ok: t0=${r.t0}s, fim=${r.events.at(-1).t}s`);
    }
  } finally {
    await browser.close();
    try { fs.rmSync(tmp, { recursive: true, force: true }); } catch {} // Windows pode segurar o .webm
    writeClipsJs();
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await main();
