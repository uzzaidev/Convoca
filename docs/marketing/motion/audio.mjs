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
// Locução (só no corte de 60 s): take escolhido de cada frase, na ordem das cenas + assinatura no logo.
const VOZ_DIR = path.join(HERE, "locucao", "spot60_felipe_ext_emo"); // frases estendidas
const VOZ = ["01_jogos_t1", "02_confirmar_t1", "03_sorteio_t2", "04_aovivo_t2", "05_ranking_t1", "06_ia_t2", "07_assinatura_t2"]; // takes com mais variação de entonação
const VOZ_LEAD = .15; // a fala começa logo depois do título aparecer
const VOZ_GAIN = 1.4; // volume da voz na mixagem
const MUS_GAIN = .4;  // volume da música

const browser = await chromium.launch({ executablePath: EDGE });
for (const cut of cuts) {
  const page = await browser.newPage();
  await page.goto(pathToFileURL(path.join(HERE, "motion_convoca.html")).href + `?render&cut=${cut}`);
  await page.waitForFunction("window.MOTION !== undefined");
  const M = await page.evaluate("({ total: MOTION.total, cues: MOTION.cues, music: MOTION.music, outro: MOTION.outro, scenes: MOTION.scenes })");
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

  // locução: cada take entra no início da sua cena (o último no logo); pula o silêncio inicial do arquivo
  const VL = new Float32Array(N), duck = new Float32Array(N);
  if (cut === "60" && fs.existsSync(VOZ_DIR)) {
    const starts = [...M.scenes, M.outro];
    VOZ.forEach((name, k) => {
      const file = [".wav", ".mp3"].map(e => path.join(VOZ_DIR, name + e)).find(f => fs.existsSync(f));
      const raw = execFileSync(ffmpeg, ["-v", "error", "-i", file,
        "-af", "silenceremove=start_periods=1:start_threshold=-40dB", "-f", "f32le", "-ac", "1", "-ar", String(SR), "-"]);
      const v = new Float32Array(raw.buffer, raw.byteOffset, raw.length / 4);
      const i0 = Math.round((starts[k] + VOZ_LEAD) * SR);
      for (let i = 0; i < v.length && i0 + i < N; i++) { VL[i0 + i] += v[i]; duck[i0 + i] = 1; }
    });
    // envelope do "ducking": abaixa a música enquanto tem voz (ataque 0.12 s, soltura 0.35 s)
    let env = 0;
    const att = 1 - Math.exp(-1 / (.12 * SR)), rel = 1 - Math.exp(-1 / (.35 * SR));
    for (let i = 0; i < N; i++) { env += (duck[i] - env) * (duck[i] > env ? att : rel); duck[i] = env; }
    console.log(`  locução: ${VOZ.length} frases`);
  }

  // mixagem: música com fade in curto e fade out no fim do vídeo; efeitos e voz por cima
  const fadeOut = Math.min(2.5, M.total - M.outro);
  const out = Buffer.alloc(44 + N * 4);
  for (let i = 0; i < N; i++) {
    const t = i / SR, g = Math.min(1, t / .15, (M.total - t) / fadeOut) * MUS_GAIN * (1 - .6 * duck[i]);
    for (const [ch, fx] of [[0, FL], [1, FR]]) {
      const v = Math.tanh((mus[2 * i + ch] ?? 0) * g + fx[i] * .8 + VL[i] * VOZ_GAIN);
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
