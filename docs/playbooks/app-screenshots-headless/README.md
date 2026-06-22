# Playbook — Screenshots de app para as lojas via **browser headless**

> **Objetivo:** logar no app e capturar screenshots em **tamanho de celular** (prontos para Google Play / App Store) **por linha de comando**, sem mexer no celular nem em emulador. Ideal para apps **web/Capacitor (Estratégia B)** onde o app = o site.
>
> Extraído do Convoca (2026-06). Funciona em qualquer site responsivo.

---

## 0. Ideia central

O app Capacitor (Estratégia B) carrega o **site ao vivo** numa WebView. Logo, "screenshot do app" = **screenshot do site em viewport de celular**. Usamos o **Chrome já instalado** dirigido pelo `puppeteer-core` (não baixa Chromium).

---

## 1. Pré-requisitos

```bash
# Chrome ou Edge instalado (descobrir o caminho)
#   Windows: C:/Program Files/Google/Chrome/Application/chrome.exe
#   macOS:   /Applications/Google Chrome.app/Contents/MacOS/Google Chrome
pnpm add -D puppeteer-core      # leve: usa o Chrome instalado, sem baixar browser
```

E uma **conta de teste** para logar. Crie uma dedicada (não exponha senha real) — ex.: via endpoint de signup:
```bash
curl -s -X POST "https://SEU_SITE/api/auth/signup" -H "Content-Type: application/json" \
  -d '{"name":"Demo","email":"demo@seusite.com","password":"SenhaDemo123"}'
```

---

## 2. Regras de tamanho das lojas (o gotcha nº 1)

| Loja | Regra |
|------|-------|
| **Google Play** | min 320px, max 3840px, **maior lado ≤ 2× o menor** (ratio ≤ 2:1) |
| **App Store** | tamanhos exatos por device (obrigatório o maior — iPhone 6.9") |

### Google Play — viewport recomendado

⚠️ **Erro clássico:** viewport `412×915` @ dsf 3 = `1236×2745` → ratio **2.22** → **a Play rejeita** (passou de 2:1).
✅ **Use 9:16:** viewport `412×732` @ dsf 3 = `1236×2196` → ratio **1.78** → aceito.

### App Store — tamanhos obrigatórios (iPhone)

A Apple exige ao menos o tamanho do **maior device** (iPhone 6.9"). Os outros são opcionais.

| Device | Tamanho obrigatório | Viewport CSS → dsf | Ratio |
|---|---|---|---|
| **iPhone 6.9"** ← **obrigatório** | **1320 × 2868 px** | 440 × 956 @ dsf3 | 2.17 |
| iPhone 6.7" (opcional) | 1290 × 2796 px | 430 × 932 @ dsf3 | 2.17 |
| iPad Pro 13" (opcional) | 2064 × 2752 px | 1024 × 1366 @ dsf2 | 1.33 |

> ⚠️ O ratio 2.17 que a **Apple exige** é o mesmo que a **Play rejeita**. Você precisa de dois conjuntos de screenshots separados ou crop/resize após captura.

> **Layout mobile:** use **largura CSS pequena** (≈390–440) + **deviceScaleFactor 2–3** para alta resolução. Se usar largura 1080 CSS, o site renderiza **layout desktop**.

---

## 3. Script de captura (login + percorrer + screenshot)

> O script suporta dois modos: `--play` (Google Play, 1236×2196) e `--appstore` (App Store, 1320×2868).
> Padrão é `--play`.

`screenshots.mjs`:
```js
import puppeteer from "puppeteer-core";
import { mkdirSync } from "node:fs";

// Modo: --play (Google Play 9:16) ou --appstore (iPhone 6.9")
const mode = process.argv.includes("--appstore") ? "appstore" : "play";

const OUT = mode === "appstore"
  ? "C:/Users/SEU_USER/app-screenshots/appstore"
  : "C:/Users/SEU_USER/app-screenshots/play";
const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const BASE = "https://SEU_SITE";

// Google Play: 412×732 @ dsf3 → 1236×2196 (ratio 1.78 ✅)
// App Store:   440×956 @ dsf3 → 1320×2868 (ratio 2.17 ✅ Apple)
const VW  = mode === "appstore" ? 440 : 412;
const VH  = mode === "appstore" ? 956 : 732;
const DSF = 3;

console.log(`Modo: ${mode} | Viewport: ${VW}×${VH} @${DSF}x → ${VW*DSF}×${VH*DSF}px`);
mkdirSync(OUT, { recursive: true });

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: "new",
  args: ["--no-sandbox", "--hide-scrollbars", "--disable-gpu"],
});
const page = await browser.newPage();
await page.setViewport({ width: VW, height: VH, deviceScaleFactor: DSF, isMobile: true, hasTouch: true });
await page.setUserAgent("Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Mobile Safari/537.36");

const settle = (ms = 1500) => new Promise((r) => setTimeout(r, ms));
const shot = async (n) => { await page.screenshot({ path: `${OUT}/${n}.png` }); console.log("shot:", n); };

// 1) tela de login (costuma ser bonita -> vira screenshot)
await page.goto(`${BASE}/auth/signin`, { waitUntil: "networkidle2", timeout: 60000 });
await settle(1500);
await shot("01-login");

// 2) LOGAR (ajuste os seletores ao seu form)
await page.type('input[type="email"]', "demo@seusite.com", { delay: 20 });
await page.type('input[type="password"]', "SenhaDemo123", { delay: 20 });
await Promise.all([
  page.click('button[type="submit"]'),
  page.waitForNavigation({ waitUntil: "networkidle2", timeout: 30000 }).catch(() => {}),
]);
await settle(3000);
console.log("URL pós-login:", page.url());   // confirme que logou

// 3) percorrer páginas e capturar (autenticado!)
const PAGES = ["/dashboard", "/produto-convoca", "/groups", "/profile"]; // ajuste
let i = 2;
for (const path of PAGES) {
  await page.goto(`${BASE}${path}`, { waitUntil: "networkidle2", timeout: 60000 });
  await settle(2500);
  const total = await page.evaluate(() => document.body.scrollHeight);
  const step = Math.round(VH * 0.82);
  for (let y = 0; y < total; y += step) {
    await page.evaluate((yy) => window.scrollTo(0, yy), y);
    await settle(1500);
    await shot(String(i++).padStart(2, "0"));
    if (i > 30) break;
  }
}
await browser.close();
console.log("DONE ->", OUT);
```
Rodar: `node screenshots.mjs`

---

## 4. Validar as dimensões (sem libs extras)

PNG guarda largura/altura nos bytes 16–23:
```bash
node -e "const fs=require('fs');const d='C:/Users/SEU_USER/app-screenshots';
for(const f of fs.readdirSync(d).filter(x=>x.endsWith('.png'))){
  const b=fs.readFileSync(d+'/'+f);const w=b.readUInt32BE(16),h=b.readUInt32BE(20);
  console.log(f,w+'x'+h,'ratio',(h/w).toFixed(2));}"
```
Confirme `ratio <= 2.00` para a Play.

---

## 5. Contact sheet para curar (ver tudo numa imagem só)

Telas grandes (>2000px) não dá pra revisar de uma vez. Monte um grid de miniaturas:
```js
// contact.mjs — gera _CONTACT_SHEET.png (<2000px) com todas numeradas
import puppeteer from "puppeteer-core";
import { readdirSync, writeFileSync } from "node:fs";
const OUT="C:/Users/SEU_USER/app-screenshots", CHROME="C:/Program Files/Google/Chrome/Application/chrome.exe";
const imgs=readdirSync(OUT).filter(f=>f.endsWith(".png")&&!f.startsWith("_")).sort();
const html=`<body style="margin:0;background:#1a1a1a;display:grid;grid-template-columns:repeat(4,1fr);gap:3px">`+
 imgs.map(f=>`<div style="position:relative"><img src="file:///${OUT}/${f}" style="width:100%;display:block"><span style="position:absolute;top:3px;left:3px;background:#000;color:#3f3;font:bold 22px monospace;padding:2px 7px">${f.replace('.png','')}</span></div>`).join("")+`</body>`;
writeFileSync(OUT+"/_contact.html",html);
const b=await puppeteer.launch({executablePath:CHROME,headless:"new",args:["--no-sandbox"]});
const p=await b.newPage(); await p.setViewport({width:920,height:1700,deviceScaleFactor:1});
await p.goto("file:///"+OUT+"/_contact.html",{waitUntil:"networkidle2"});
await new Promise(r=>setTimeout(r,1500));
await p.screenshot({path:OUT+"/_CONTACT_SHEET.png",fullPage:true}); await b.close();
```
Abra `_CONTACT_SHEET.png`, escolha as 4–6 melhores e copie para uma pasta `SELECIONADAS/`.

---

## 6. Gotchas (resumo)

| Sintoma | Causa | Solução |
|---------|-------|---------|
| Play rejeita screenshot | ratio > 2:1 | usar 9:16 (412×732 @ dsf3) |
| Site renderiza layout desktop | largura CSS grande | largura ≈412 + deviceScaleFactor 3 |
| Página "pública" cai no login | middleware protege a rota | **capturar logado** (cookie de sessão) ou liberar a rota |
| Login não acontece | seletor errado | ajustar `input[type=email/password]`, `button[type=submit]`; logar `page.url()` |
| Telas com conteúdo cortado | animação/lazy load | aumentar `settle()` antes do shot |
| Não consigo ver as imagens (muito altas) | >2000px | gerar **contact sheet** (§5) |
| Imagem com fundo transparente | página sem bg | a maioria tem bg sólido; se precisar, achatar p/ JPG |

---

## 7. TL;DR

```
Google Play:
1. pnpm add -D puppeteer-core  (usa Chrome instalado)
2. criar conta demo (signup)
3. viewport 412×732 @ dsf3 (9:16, ratio 1.78 ✅ Play) + UA mobile
4. goto /signin → shot → preencher form → submit → esperar navegação
5. goto cada página autenticada → scroll em passos → shot
6. node screenshots.mjs --play
7. validar ratio ≤ 2.0 ; montar contact sheet ; curar 4-8

App Store (iPhone 6.9" obrigatório):
1. mesma conta demo, mesmo script
2. node screenshots.mjs --appstore  (viewport 440×956 @ dsf3 → 1320×2868)
3. curar 4-10 screenshots (App Store aceita até 10 por device)
4. NÃO misturar com screenshots da Play — ratio diferente
```

> **Dica:** a tela de **login** e páginas de **marketing/feature** (se houver) costumam render os melhores screenshots e não dependem de dados populados. Para telas internas ricas, **popular a conta demo** antes.
>
> **Convoca:** conta demo disponível em `demo.review@convoca.uzzai.com.br` / `ConvocaDemo2026`.
