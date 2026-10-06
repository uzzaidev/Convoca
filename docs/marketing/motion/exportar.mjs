/* Exporta motion_convoca.html para MP4, quadro a quadro.

Tocar ao vivo depende do navegador (3D + vídeo + GSAP pode engasgar). Aqui o Edge
headless abre a página com ?render, MOTION.renderAt(t) posiciona timeline e vídeos no
instante t, sai um print, e o ffmpeg (ffmpeg-static) monta o MP4. Liso em qualquer máquina.

Uso:
  node exportar.mjs --portrait --cut 30  # Reels 30 s -> convoca_30s_vertical.mp4 (cortes: 60, 30, 15)
  node exportar.mjs                      # horizontal 60 s -> convoca_60s_horizontal.mp4
  node exportar.mjs --fps 60
  node exportar.mjs --from 10 --to 18 --out _rec/trecho.mp4   # prévia de um trecho
  node exportar.mjs --stills 2,9.5,20    # só PNGs desses instantes em _rec/ (conferência)
  node exportar.mjs --portrait            # formato celular 1080x1920 -> motion_convoca_vertical.mp4
  node exportar.mjs --audio trilha.mp3 --aoffset 2.3   # mixa a trilha (pula 2.3 s do início dela)
*/
import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";
import { parseArgs } from "node:util";
import { chromium } from "playwright-core";
import ffmpeg from "ffmpeg-static";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const PAGE = path.join(HERE, "motion_convoca.html");
const EDGE = process.env.EDGE || "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe";
const { values: a } = parseArgs({ options: {
  fps: { type: "string", default: "30" }, out: { type: "string" }, portrait: { type: "boolean", default: false },
  audio: { type: "string" }, aoffset: { type: "string", default: "0" }, cut: { type: "string", default: "60" },
  from: { type: "string", default: "0" }, to: { type: "string" }, stills: { type: "string" } } });
const fps = Number(a.fps);
const SIZE = a.portrait ? { width: 1080, height: 1920 } : { width: 1920, height: 1080 };
// corte (60/30/15) define cenas e trecho da música; trilha_<corte>.wav (audio.mjs) entra automático
const out = a.out ?? path.join(HERE, `convoca_${a.cut}s_${a.portrait ? "vertical" : "horizontal"}.mp4`);
a.audio ??= fs.existsSync(path.join(HERE, `trilha_${a.cut}.wav`)) ? path.join(HERE, `trilha_${a.cut}.wav`) : undefined;

const browser = await chromium.launch({ executablePath: EDGE });
const page = await browser.newPage({ viewport: SIZE });
page.on("pageerror", e => console.log("pageerror:", e.message));
await page.goto(pathToFileURL(PAGE).href + `?render&cut=${a.cut}` + (a.portrait ? "&portrait" : ""));
await page.waitForFunction("window.MOTION !== undefined", null, { timeout: 60000 });
await page.evaluate("Promise.all([MOTION.ready, document.fonts.ready])");
const total = await page.evaluate("MOTION.total");

if (a.stills) {
  fs.mkdirSync(path.join(HERE, "_rec"), { recursive: true });
  for (const t of a.stills.split(",").map(Number)) {
    await page.evaluate(t => MOTION.renderAt(t), t);
    await page.screenshot({ path: path.join(HERE, "_rec", `still_${a.cut}${a.portrait ? "v" : ""}_${t}.png`) });
  }
  console.log(`total ${total.toFixed(1)} s; stills em _rec/`);
} else {
  const t0 = Number(a.from), t1 = Math.min(total, a.to ? Number(a.to) : total), n = Math.floor((t1 - t0) * fps);
  console.log(`${total.toFixed(1)} s no total; exportando ${t0}–${t1.toFixed(1)} s -> ${n} quadros a ${fps} fps`);
  // trilha: mesmo trecho da música que o trecho do vídeo, fade in 1 s / out 2 s, volume normalizado p/ redes
  const audio = a.audio ? ["-ss", String(Number(a.aoffset) + t0), "-i", a.audio, "-map", "0:v", "-map", "1:a",
    "-af", "loudnorm=I=-14:TP=-1", // fades já vêm da trilha_<corte>.wav
    "-ar", "48000", "-c:a", "aac", "-b:a", "192k", "-shortest"] : [];
  const ff = spawn(ffmpeg, ["-y", "-loglevel", "error", "-f", "image2pipe", "-framerate", String(fps), "-i", "-", ...audio,
    "-c:v", "libx264", "-preset", "slow", "-crf", "18", "-pix_fmt", "yuv420p", "-movflags", "+faststart", out],
    { stdio: ["pipe", "inherit", "inherit"] });
  const done = new Promise((res, rej) => ff.on("close", c => c ? rej(new Error("ffmpeg " + c)) : res()));
  const start = performance.now();
  for (let i = 0; i < n; i++) {
    await page.evaluate(t => MOTION.renderAt(t), t0 + i / fps);
    const jpg = await page.screenshot({ type: "jpeg", quality: 95 });
    if (!ff.stdin.write(jpg)) await new Promise(r => ff.stdin.once("drain", r));
    if (i % (fps * 5) === 0) console.log(`  ${i}/${n} quadros (${((performance.now() - start) / 1000).toFixed(0)} s)`);
  }
  ff.stdin.end(); await done;
  console.log("ok:", out);
}
await browser.close();
