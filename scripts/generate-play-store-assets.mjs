import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import sharp from "sharp";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const screenshotsRoot = "C:/Users/pedro/convoca-screenshots";
const outDir = path.join(screenshotsRoot, "PLAY_STORE");

fs.mkdirSync(outDir, { recursive: true });

const iconPath = path.join(repoRoot, "assets/icon-512.png");
const iconBuf = fs.readFileSync(iconPath);

const svg = `<svg width="1024" height="500" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#071a0d"/>
      <stop offset="55%" stop-color="#0f2e18"/>
      <stop offset="100%" stop-color="#145c2e"/>
    </linearGradient>
    <pattern id="pitch" width="120" height="120" patternUnits="userSpaceOnUse">
      <rect width="120" height="120" fill="none"/>
      <path d="M10 10 H110 V110 H10 Z M60 10 V110 M10 60 H110 M60 35 A25 25 0 1 1 59.9 35" stroke="rgba(255,255,255,0.06)" stroke-width="2" fill="none"/>
    </pattern>
  </defs>
  <rect width="1024" height="500" fill="url(#bg)"/>
  <rect width="1024" height="500" fill="url(#pitch)" opacity="0.35"/>
  <circle cx="860" cy="120" r="180" fill="rgba(34,197,94,0.12)"/>
  <circle cx="920" cy="380" r="140" fill="rgba(34,197,94,0.08)"/>
  <text x="300" y="190" fill="#ffffff" font-family="Arial, Helvetica, sans-serif" font-size="72" font-weight="700">CONVOCA</text>
  <text x="300" y="255" fill="#86efac" font-family="Arial, Helvetica, sans-serif" font-size="34" font-weight="600">Organize sua pelada</text>
  <text x="300" y="320" fill="rgba(255,255,255,0.82)" font-family="Arial, Helvetica, sans-serif" font-size="26">Presencas, sorteio, rankings e cobrancas</text>
</svg>`;

const icon = await sharp(iconBuf).resize(220, 220).png().toBuffer();
const bg = await sharp(Buffer.from(svg)).png().toBuffer();
const featurePath = path.join(outDir, "feature-graphic-1024x500.png");

await sharp(bg)
  .composite([{ input: icon, left: 40, top: 140 }])
  .png({ compressionLevel: 9 })
  .toFile(featurePath);

const selected = [
  "01_hero.png",
  "02_recursos.png",
  "03_criar_evento.png",
  "04_sorteio_times.png",
  "05_rankings.png",
  "06_login.png",
];

for (const file of selected) {
  const src = path.join(screenshotsRoot, "SELECIONADAS", file);
  const dest = path.join(outDir, `phone-${file}`);
  fs.copyFileSync(src, dest);
}

fs.copyFileSync(iconPath, path.join(outDir, "app-icon-512x512.png"));

const report = [];
for (const file of fs.readdirSync(outDir).sort()) {
  const full = path.join(outDir, file);
  const meta = await sharp(full).metadata();
  const kb = Math.round(fs.statSync(full).size / 1024);
  report.push(`${file}: ${meta.width}x${meta.height}, ${kb} KB`);
}

console.log("PLAY_STORE assets ready:");
console.log(outDir);
report.forEach((line) => console.log(" -", line));
