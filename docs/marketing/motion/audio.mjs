/* Monta a trilha de cada corte: música (assets/musica-football.mp3, Pixabay — uso comercial livre)
   no trecho certo + efeitos discretos sincronizados com o motion (whoosh nas transições,
   toque suave só às vezes, impacto no logo).

Lê do motion_convoca.html (?render&cut=N) a duração, as deixas (MOTION.cues) e de que segundo da
música o corte começa (MOTION.music). Grava trilha_<corte>.wav (o HTML toca o mesmo arquivo na prévia).

Uso:
  node audio.mjs            # todos os cortes: 60, 30 e 15
  node audio.mjs 30         # só um
*/
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";
import { chromium } from "playwright-core";
import ffmpeg from "ffmpeg-static";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const EDGE = process.env.EDGE || "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe";
const MUSIC = path.join(HERE, "assets", "musica-football.mp3");
const SR = 44100;
const cuts = process.argv.slice(2).length ? process.argv.slice(2) : ["60", "30", "15"];

const browser = await chromium.launch({ executablePath: EDGE });
for (const cut of cuts) {
  const page = await browser.newPage();
  await page.goto(pathToFileURL(path.join(HERE, "motion_convoca.html")).href + `?render&cut=${cut}`);
  await page.waitForFunction("window.MOTION !== undefined");
  const M = await page.evaluate("({ total: MOTION.total, cues: MOTION.cues, music: MOTION.music, outro: MOTION.outro })");
  await page.close();

  const N = Math.ceil(M.total * SR);
  // música decodificada a partir do segundo M.music (estéreo intercalado, float)
  const raw = execFileSync(ffmpeg, ["-v", "error", "-ss", String(M.music), "-i", MUSIC, "-t", String(M.total),
    "-f", "f32le", "-ac", "2", "-ar", String(SR), "-"], { maxBuffer: 1 << 30 });
  const mus = new Float32Array(raw.buffer, raw.byteOffset, raw.length / 4);
  const FL = new Float32Array(N), FR = new Float32Array(N);

  let seed = 7;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647) * 2 - 1;
  const lpA = (fc) => 1 - Math.exp(-2 * Math.PI * fc / SR);
  const add = (t, dur, g, f) => {
    const i0 = Math.max(0, Math.round(t * SR)), i1 = Math.min(N, Math.round((t + dur) * SR));
    for (let i = i0; i < i1; i++) { const v = f((i - i0) / SR) * g; FL[i] += v; FR[i] += v; }
  };
  const noiseSweep = (t, d, g, lo, hi) => { let lp = 0;
    add(t, d, g, (x) => { const bell = Math.sin(Math.PI * x / d) ** 2; lp += lpA(lo + hi * bell) * (rnd() - lp); return lp * bell; }); };
  const FX = {
    tap: (t) => { let lp = 0; add(t, .07, .12, (x) => { const v = Math.sin(2 * Math.PI * 950 * x) * Math.exp(-x * 90); lp += lpA(2500) * (v - lp); return lp; }); },
    whoosh: (t) => noiseSweep(t - .22, .55, .22, 250, 3000),
    zoom: (t) => noiseSweep(t, .45, .1, 400, 2500),
    impact: (t) => {
      let ph = 0, lp = 0;
      add(t, .6, .7, (x) => { ph += 2 * Math.PI * (42 + 110 * Math.exp(-x * 25)) / SR; return Math.tanh(1.5 * Math.sin(ph) * Math.exp(-x * 5)); });
      add(t, 2, .25, (x) => { const n = rnd(); lp += lpA(4500) * (n - lp); return (n - lp) * Math.exp(-x * 2.6); });
    },
  };
  for (const c of M.cues) FX[c.type]?.(c.t);

  // mixagem: música com fade in curto e fade out no fim do vídeo; efeitos por cima
  const fadeOut = Math.min(2.5, M.total - M.outro);
  const out = Buffer.alloc(44 + N * 4);
  for (let i = 0; i < N; i++) {
    const t = i / SR, g = Math.min(1, t / .15, (M.total - t) / fadeOut) * .8;
    for (const [ch, fx] of [[0, FL], [1, FR]]) {
      const v = Math.tanh((mus[2 * i + ch] ?? 0) * g + fx[i] * .8);
      out.writeInt16LE(Math.round(v * .95 * 32767), 44 + (2 * i + ch) * 2);
    }
  }
  out.write("RIFF", 0); out.writeUInt32LE(36 + N * 4, 4); out.write("WAVEfmt ", 8);
  out.writeUInt32LE(16, 16); out.writeUInt16LE(1, 20); out.writeUInt16LE(2, 22); out.writeUInt32LE(SR, 24);
  out.writeUInt32LE(SR * 4, 28); out.writeUInt16LE(4, 32); out.writeUInt16LE(16, 34); out.write("data", 36); out.writeUInt32LE(N * 4, 40);
  fs.writeFileSync(path.join(HERE, `trilha_${cut}.wav`), out);
  console.log(`trilha_${cut}.wav: ${M.total.toFixed(1)} s, música a partir de ${M.music}s, ${M.cues.length} efeitos`);
}
await browser.close();
