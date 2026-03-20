import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

import PptxGenJS from "pptxgenjs";
import QRCode from "qrcode";

const require = createRequire(import.meta.url);
const { imageSizingContain } = require("../pptxgenjs_helpers/image.js");
const {
  warnIfSlideHasOverlaps,
  warnIfSlideElementsOutOfBounds,
} = require("../pptxgenjs_helpers/layout.js");
const { safeOuterShadow } = require("../pptxgenjs_helpers/util.js");

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const workspaceDir = path.resolve(scriptDir, "..");
const presentationDir = path.resolve(workspaceDir, "..");
const extractedDir = path.resolve(presentationDir, "extracted-images");
const outputDir = path.resolve(presentationDir, "output");

fs.mkdirSync(outputDir, { recursive: true });

const pptx = new PptxGenJS();
pptx.layout = "LAYOUT_WIDE";
pptx.author = "OpenAI Codex";
pptx.company = "Convoca";
pptx.subject = "Apresentacao editavel do Convoca";
pptx.title = "Convoca";
pptx.lang = "pt-BR";
pptx.theme = {
  headFontFace: "Bahnschrift",
  bodyFontFace: "Segoe UI",
  lang: "pt-BR",
};

const HEAD_FONT = "Bahnschrift";
const BODY_FONT = "Segoe UI";

const COLORS = {
  paper: "F5F6F2",
  paperAlt: "EFF3F5",
  white: "FFFFFF",
  ink: "0F1720",
  body: "30404B",
  muted: "66747D",
  line: "D7DED8",
  green: "16A34A",
  greenDeep: "0F5F3F",
  greenSoft: "E7F5EC",
  greenGlow: "D8F1E4",
  navy: "1E3A5F",
  navyDeep: "102436",
  navySoft: "E6EEF8",
  darkBg: "101A25",
  darkPanel: "172635",
  darkPanelAlt: "1F3144",
  darkLine: "5A7388",
  gold: "D9B160",
  danger: "D66F73",
  dangerSoft: "F7E8E9",
  warning: "D8A84C",
  warningSoft: "FBF1D9",
  success: "3DB377",
  greenMoney: "DFF4E7",
  black: "000000",
};

const IMAGES = {
  dashboard: path.join(extractedDir, "obj-022-417x905.jpg"),
  confirmation: path.join(extractedDir, "obj-023-417x905.jpg"),
  history: path.join(extractedDir, "obj-024-367x796.jpg"),
  finance: path.join(extractedDir, "obj-030-422x913.jpg"),
  rankings: path.join(extractedDir, "obj-033-417x905.jpg"),
  charges: path.join(extractedDir, "obj-034-263x571.jpg"),
};

const qrPath = path.join(outputDir, "convoca-qr.png");
await QRCode.toFile(qrPath, "https://convoca.app", {
  width: 480,
  margin: 1,
  color: {
    dark: `#${COLORS.navy}`,
    light: "#FFFFFF",
  },
});

function finalizeSlide(slide, options = {}) {
  const shouldValidate =
    options.validate ?? process.env.STRICT_LAYOUT_CHECK === "1";
  if (!shouldValidate) {
    return;
  }
  if (!options.skipOverlapCheck) {
    warnIfSlideHasOverlaps(slide, pptx, {
      ignoreLines: true,
      ignoreDecorativeShapes: true,
    });
  }
  warnIfSlideElementsOutOfBounds(slide, pptx);
}

function addText(slide, text, options) {
  slide.addText(text, {
    margin: 0,
    fontFace: BODY_FONT,
    color: COLORS.body,
    ...options,
  });
}

function addPill(slide, x, y, text, options = {}) {
  const fill = options.fill ?? COLORS.greenSoft;
  const lineColor = options.lineColor ?? fill;
  const textColor = options.textColor ?? COLORS.greenDeep;
  const w = options.w ?? Math.max(1.55, text.length * 0.07 + 0.7);
  const h = options.h ?? 0.34;

  slide.addShape(pptx.ShapeType.roundRect, {
    x,
    y,
    w,
    h,
    rectRadius: 0.1,
    fill: { color: fill },
    line: { color: lineColor, transparency: 100 },
  });

  addText(slide, text, {
    x,
    y: y + 0.09,
    w,
    h: 0.14,
    fontFace: HEAD_FONT,
    fontSize: options.fontSize ?? 8.4,
    bold: true,
    color: textColor,
    align: "center",
  });
}

function addWordmark(slide, x, y, size = 38) {
  slide.addText(
    [
      { text: "CONVO", options: { color: COLORS.green } },
      { text: "CA", options: { color: COLORS.navy } },
    ],
    {
      x,
      y,
      w: Math.max(4.05, size * 0.105),
      h: 0.58,
      fontFace: HEAD_FONT,
      fontSize: size,
      bold: true,
      margin: 0,
    }
  );
}

function addFrame(slide, options = {}) {
  slide.addShape(pptx.ShapeType.rect, {
    x: 0.34,
    y: 0.3,
    w: 12.64,
    h: 6.92,
    fill: { color: COLORS.paper, transparency: 100 },
    line: {
      color: options.color ?? COLORS.line,
      transparency: options.transparency ?? 55,
      width: 1,
    },
  });
}

function addPitchLines(slide, options = {}) {
  const color = options.color ?? COLORS.line;
  const transparency = options.transparency ?? 72;
  const line = { color, transparency, width: 1 };

  slide.addShape(pptx.ShapeType.line, { x: 6.665, y: 0.3, w: 0, h: 6.92, line });
  slide.addShape(pptx.ShapeType.ellipse, {
    x: 5.46,
    y: 2.55,
    w: 2.4,
    h: 2.4,
    fill: { color: COLORS.paper, transparency: 100 },
    line,
  });
  slide.addShape(pptx.ShapeType.rect, {
    x: 0.34,
    y: 1.55,
    w: 2.0,
    h: 4.42,
    fill: { color: COLORS.paper, transparency: 100 },
    line,
  });
  slide.addShape(pptx.ShapeType.rect, {
    x: 10.99,
    y: 1.55,
    w: 2.0,
    h: 4.42,
    fill: { color: COLORS.paper, transparency: 100 },
    line,
  });
  slide.addShape(pptx.ShapeType.rect, {
    x: 0.34,
    y: 2.7,
    w: 0.66,
    h: 2.1,
    fill: { color: COLORS.paper, transparency: 100 },
    line,
  });
  slide.addShape(pptx.ShapeType.rect, {
    x: 12.33,
    y: 2.7,
    w: 0.66,
    h: 2.1,
    fill: { color: COLORS.paper, transparency: 100 },
    line,
  });
}

function addCornerGlow(slide, x, y, w, h, color, transparency) {
  slide.addShape(pptx.ShapeType.ellipse, {
    x,
    y,
    w,
    h,
    fill: { color, transparency },
    line: { color, transparency: 100 },
  });
}

function addLightBackground(slide, options = {}) {
  slide.background = { color: options.color ?? COLORS.paper };
  addCornerGlow(slide, -0.7, -0.9, 2.7, 2.7, COLORS.greenGlow, 14);
  addCornerGlow(slide, 11.5, 5.25, 2.6, 2.6, COLORS.navySoft, 28);
  addFrame(slide);
  if (options.showPitch !== false) {
    addPitchLines(slide, { transparency: 80 });
  }

  const gridX = options.gridX ?? 11.0;
  const gridY = options.gridY ?? 0.82;
  for (let i = 0; i < 4; i += 1) {
    slide.addShape(pptx.ShapeType.line, {
      x: gridX + i * 0.23,
      y: gridY,
      w: 0,
      h: 0.78,
      line: { color: COLORS.line, transparency: 78, width: 0.8 },
    });
    slide.addShape(pptx.ShapeType.line, {
      x: gridX - 0.12,
      y: gridY + i * 0.19,
      w: 0.92,
      h: 0,
      line: { color: COLORS.line, transparency: 78, width: 0.8 },
    });
  }
}

function addDarkBackground(slide) {
  slide.background = { color: COLORS.darkBg };
  addCornerGlow(slide, -0.55, -0.75, 2.3, 2.3, COLORS.gold, 72);
  addCornerGlow(slide, 11.55, -0.75, 2.3, 2.3, COLORS.gold, 72);
  addCornerGlow(slide, 3.2, 5.75, 6.8, 1.35, COLORS.green, 80);

  slide.addShape(pptx.ShapeType.rect, {
    x: 0.34,
    y: 0.3,
    w: 12.64,
    h: 6.92,
    fill: { color: COLORS.darkBg, transparency: 100 },
    line: { color: COLORS.darkLine, transparency: 55, width: 1 },
  });

  addPitchLines(slide, { color: COLORS.darkLine, transparency: 74 });
}

function addTitleBlock(slide, { kicker, title, subtitle, x = 0.9, y = 0.72, w = 6.0, align = "left", dark = false, titleSize = 28 }) {
  if (kicker) {
    addPill(slide, x, y, kicker, {
      fill: dark ? COLORS.darkPanelAlt : COLORS.greenSoft,
      lineColor: dark ? COLORS.darkPanelAlt : COLORS.greenSoft,
      textColor: dark ? COLORS.white : COLORS.greenDeep,
      fontSize: 8.2,
      w: Math.max(1.45, kicker.length * 0.074 + 0.62),
    });
  }

  slide.addText(title, {
    x,
    y: y + 0.52,
    w,
    h: 1.18,
    fontFace: HEAD_FONT,
    fontSize: titleSize,
    bold: true,
    color: dark ? COLORS.white : COLORS.ink,
    align,
    margin: 0,
  });

  if (subtitle) {
    addText(slide, subtitle, {
      x,
      y: y + 1.58,
      w,
      h: 0.62,
      fontSize: 10.9,
      color: dark ? "DAE3EB" : COLORS.muted,
      align,
    });
  }
}

function addCard(slide, { x, y, w, h, fill = COLORS.white, lineColor = "D9E0E4", lineTransparency = 50, shadow = true }) {
  slide.addShape(pptx.ShapeType.roundRect, {
    x,
    y,
    w,
    h,
    rectRadius: 0.16,
    fill: { color: fill },
    line: { color: lineColor, transparency: lineTransparency, width: 1 },
    shadow: shadow ? safeOuterShadow("7B8790", 0.16, 45, 3, 1) : undefined,
  });
}

function addValueCard(slide, { x, y, w, h, label, body, accent }) {
  addCard(slide, { x, y, w, h, fill: COLORS.white });
  slide.addShape(pptx.ShapeType.rect, {
    x,
    y,
    w,
    h: 0.08,
    fill: { color: accent },
    line: { color: accent, transparency: 100 },
  });
  addText(slide, label, {
    x: x + 0.2,
    y: y + 0.2,
    w: w - 0.4,
    h: 0.18,
    fontFace: HEAD_FONT,
    fontSize: 9.2,
    bold: true,
    color: accent,
  });
  addText(slide, body, {
    x: x + 0.2,
    y: y + 0.48,
    w: w - 0.4,
    h: h - 0.68,
    fontSize: 8.9,
    color: COLORS.body,
  });
}

function addMiniStat(slide, { x, y, w, label, value, color, fill }) {
  addCard(slide, { x, y, w, h: 0.95, fill, lineColor: fill, lineTransparency: 100, shadow: true });
  addText(slide, value, {
    x: x + 0.18,
    y: y + 0.18,
    w: w - 0.36,
    h: 0.24,
    fontFace: HEAD_FONT,
    fontSize: 17,
    bold: true,
    color,
    align: "center",
  });
  addText(slide, label, {
    x: x + 0.18,
    y: y + 0.52,
    w: w - 0.36,
    h: 0.16,
    fontSize: 8.6,
    color: COLORS.body,
    align: "center",
  });
}

function addDeviceFrame(slide, { x, y, w, h, imagePath, label, labelY, shellColor = "0E141B" }) {
  slide.addShape(pptx.ShapeType.roundRect, {
    x,
    y,
    w,
    h,
    rectRadius: 0.28,
    fill: { color: shellColor },
    line: { color: shellColor, transparency: 100 },
    shadow: safeOuterShadow("243140", 0.3, 45, 4, 2),
  });

  slide.addShape(pptx.ShapeType.roundRect, {
    x: x + 0.11,
    y: y + 0.11,
    w: w - 0.22,
    h: h - 0.22,
    rectRadius: 0.22,
    fill: { color: COLORS.white },
    line: { color: COLORS.white, transparency: 100 },
  });

  slide.addShape(pptx.ShapeType.roundRect, {
    x: x + w / 2 - 0.38,
    y: y + 0.14,
    w: 0.76,
    h: 0.08,
    rectRadius: 0.04,
    fill: { color: COLORS.black },
    line: { color: COLORS.black, transparency: 100 },
  });

  slide.addImage({
    path: imagePath,
    ...imageSizingContain(imagePath, x + 0.16, y + 0.34, w - 0.32, h - 0.6),
  });

  slide.addShape(pptx.ShapeType.roundRect, {
    x: x + w / 2 - 0.3,
    y: y + h - 0.13,
    w: 0.6,
    h: 0.04,
    rectRadius: 0.02,
    fill: { color: "C9D2D9" },
    line: { color: "C9D2D9", transparency: 100 },
  });

  if (label) {
    addText(slide, label, {
      x,
      y: labelY ?? y + h + 0.12,
      w,
      h: 0.14,
      fontFace: HEAD_FONT,
      fontSize: 8.8,
      color: COLORS.muted,
      align: "center",
    });
  }
}

function addStatusRow(slide, { x, y, w, h, name, amount, status, accent, fill, textColor = COLORS.white }) {
  const compact = h <= 0.5;
  const badgeSize = compact ? 0.32 : 0.38;
  const badgeX = x + 0.16;
  const badgeY = y + (h - badgeSize) / 2;
  const textX = x + (compact ? 0.6 : 0.66);
  const textW = w - (compact ? 0.82 : 1.0);

  slide.addShape(pptx.ShapeType.roundRect, {
    x,
    y,
    w,
    h,
    rectRadius: 0.14,
    fill: { color: fill },
    line: { color: accent, transparency: 28, width: 1 },
  });

  slide.addShape(pptx.ShapeType.ellipse, {
    x: badgeX,
    y: badgeY,
    w: badgeSize,
    h: badgeSize,
    fill: { color: accent },
    line: { color: accent, transparency: 100 },
  });

  addText(slide, status, {
    x: badgeX,
    y: compact ? y + 0.155 : y + 0.26,
    w: badgeSize,
    h: 0.1,
    fontFace: HEAD_FONT,
    fontSize: compact ? 6.6 : 7.4,
    bold: true,
    color: fill,
    align: "center",
  });

  addText(slide, name, {
    x: textX,
    y: compact ? y + 0.06 : y + 0.13,
    w: textW,
    h: 0.14,
    fontFace: HEAD_FONT,
    fontSize: compact ? 9.0 : 9.6,
    bold: true,
    color: textColor,
  });

  addText(slide, amount, {
    x: textX,
    y: compact ? y + 0.21 : y + 0.33,
    w: textW,
    h: compact ? 0.1 : 0.12,
    fontSize: compact ? 7.4 : 8.3,
    color: textColor === COLORS.white ? "C9D7E0" : COLORS.body,
  });
}

function addIssueCard(slide, { x, y, w, h, title, accent, subtitle }) {
  addCard(slide, { x, y, w, h, fill: COLORS.white });
  slide.addShape(pptx.ShapeType.rect, {
    x,
    y,
    w,
    h: 0.08,
    fill: { color: accent },
    line: { color: accent, transparency: 100 },
  });
  addText(slide, title, {
    x: x + 0.2,
    y: y + 0.2,
    w: w - 0.4,
    h: 0.24,
    fontFace: HEAD_FONT,
    fontSize: 11.6,
    bold: true,
    color: COLORS.ink,
  });
  if (subtitle) {
    addText(slide, subtitle, {
      x: x + 0.2,
      y: y + 0.52,
      w: w - 0.4,
      h: 0.28,
      fontSize: 8.6,
      color: COLORS.muted,
    });
  }
}

function addChatBubble(slide, { x, y, text, fill, w }) {
  slide.addShape(pptx.ShapeType.roundRect, {
    x,
    y,
    w,
    h: 0.34,
    rectRadius: 0.09,
    fill: { color: fill },
    line: { color: fill, transparency: 100 },
  });
  addText(slide, text, {
    x,
    y: y + 0.1,
    w,
    h: 0.12,
    fontFace: HEAD_FONT,
    fontSize: 8,
    bold: true,
    color: COLORS.ink,
    align: "center",
  });
}

function addModuleCard(slide, { x, y, w, h, index, title, description, accent }) {
  addCard(slide, { x, y, w, h, fill: COLORS.white });
  slide.addShape(pptx.ShapeType.rect, {
    x,
    y,
    w: 0.12,
    h,
    fill: { color: accent },
    line: { color: accent, transparency: 100 },
  });
  addPill(slide, x + 0.22, y + 0.17, index, {
    fill: accent === COLORS.green ? COLORS.greenSoft : COLORS.navySoft,
    lineColor: accent === COLORS.green ? COLORS.greenSoft : COLORS.navySoft,
    textColor: accent,
    w: 0.48,
    h: 0.24,
    fontSize: 6.8,
  });
  addText(slide, title, {
    x: x + 0.84,
    y: y + 0.18,
    w: w - 1.05,
    h: 0.22,
    fontFace: HEAD_FONT,
    fontSize: 13.4,
    bold: true,
    color: COLORS.ink,
  });
  addText(slide, description, {
    x: x + 0.84,
    y: y + 0.48,
    w: w - 1.05,
    h: h - 0.66,
    fontSize: 9.3,
    color: COLORS.body,
  });
}

function addImpactTable(slide, x, y) {
  addCard(slide, { x, y, w: 11.15, h: 4.95, fill: COLORS.white });

  slide.addShape(pptx.ShapeType.roundRect, {
    x: x + 0.18,
    y: y + 0.18,
    w: 5.28,
    h: 0.62,
    rectRadius: 0.08,
    fill: { color: "EEF0F1" },
    line: { color: "EEF0F1", transparency: 100 },
  });
  slide.addShape(pptx.ShapeType.roundRect, {
    x: x + 5.66,
    y: y + 0.18,
    w: 5.31,
    h: 0.62,
    rectRadius: 0.08,
    fill: { color: COLORS.greenDeep },
    line: { color: COLORS.greenDeep, transparency: 100 },
  });

  slide.addText("Pelada comum", {
    x: x + 0.18,
    y: y + 0.34,
    w: 5.28,
    h: 0.14,
    fontFace: HEAD_FONT,
    fontSize: 15,
    bold: true,
    color: COLORS.ink,
    align: "center",
    margin: 0,
  });
  slide.addText("Experiência Convoca", {
    x: x + 5.66,
    y: y + 0.34,
    w: 5.31,
    h: 0.14,
    fontFace: HEAD_FONT,
    fontSize: 15,
    bold: true,
    color: COLORS.white,
    align: "center",
    margin: 0,
  });

  const rows = [
    ["Horas perdidas no WhatsApp", "Automação e gestão em segundos"],
    ["Risco de calote e prejuízo", "Previsibilidade de caixa e pendências"],
    ["Jogos desequilibrados", "Times nivelados por dados e presença"],
    ["Conflitos por times e dinheiro", "Foco no jogo, não no retrabalho"],
  ];

  rows.forEach((row, index) => {
    const rowY = y + 0.95 + index * 0.93;
    slide.addShape(pptx.ShapeType.roundRect, {
      x: x + 0.18,
      y: rowY,
      w: 5.28,
      h: 0.78,
      rectRadius: 0.08,
      fill: { color: "F3F5F5" },
      line: { color: "E6EBEC", transparency: 100 },
    });
    slide.addShape(pptx.ShapeType.roundRect, {
      x: x + 5.66,
      y: rowY,
      w: 5.31,
      h: 0.78,
      rectRadius: 0.08,
      fill: { color: index % 2 === 0 ? "174D37" : "16533D" },
      line: { color: "174D37", transparency: 100 },
    });

    addText(slide, row[0], {
      x: x + 0.38,
      y: rowY + 0.21,
      w: 4.88,
      h: 0.18,
      fontFace: HEAD_FONT,
      fontSize: 13.2,
      color: COLORS.ink,
      align: "center",
    });
    addText(slide, row[1], {
      x: x + 5.9,
      y: rowY + 0.21,
      w: 4.84,
      h: 0.18,
      fontFace: HEAD_FONT,
      fontSize: 13.2,
      color: COLORS.white,
      align: "center",
    });
  });
}

function addAudienceBox(slide, { x, y, w, h, title, subtitle, accent }) {
  addCard(slide, { x, y, w, h, fill: COLORS.white });
  slide.addShape(pptx.ShapeType.rect, {
    x,
    y,
    w,
    h: 0.08,
    fill: { color: accent },
    line: { color: accent, transparency: 100 },
  });
  addText(slide, title, {
    x: x + 0.16,
    y: y + 0.18,
    w: w - 0.32,
    h: 0.16,
    fontFace: HEAD_FONT,
    fontSize: 11.5,
    bold: true,
    color: COLORS.ink,
    align: "center",
  });
  addText(slide, subtitle, {
    x: x + 0.16,
    y: y + 0.45,
    w: w - 0.32,
    h: 0.16,
    fontSize: 8.8,
    color: COLORS.muted,
    align: "center",
  });
}

function addDifferentialCard(slide, { x, y, w, h, index, title, description, accent }) {
  addCard(slide, { x, y, w, h, fill: COLORS.white });
  slide.addShape(pptx.ShapeType.rect, {
    x,
    y,
    w: 0.12,
    h,
    fill: { color: accent },
    line: { color: accent, transparency: 100 },
  });
  slide.addShape(pptx.ShapeType.ellipse, {
    x: x + 0.26,
    y: y + 0.32,
    w: 0.72,
    h: 0.72,
    fill: { color: accent === COLORS.green ? COLORS.greenSoft : COLORS.navySoft },
    line: { color: accent, transparency: 100 },
  });
  addText(slide, index, {
    x: x + 0.26,
    y: y + 0.55,
    w: 0.72,
    h: 0.12,
    fontFace: HEAD_FONT,
    fontSize: 10.2,
    bold: true,
    color: accent,
    align: "center",
  });
  addText(slide, title, {
    x: x + 1.18,
    y: y + 0.34,
    w: w - 1.42,
    h: 0.24,
    fontFace: HEAD_FONT,
    fontSize: 16,
    bold: true,
    color: COLORS.ink,
  });
  addText(slide, description, {
    x: x + 1.18,
    y: y + 0.78,
    w: w - 1.42,
    h: h - 0.98,
    fontSize: 10.8,
    color: COLORS.body,
  });
}

// Slide 1
{
  const slide = pptx.addSlide();
  addLightBackground(slide, { showPitch: false, gridX: 11.0, gridY: 0.86 });
  addPill(slide, 1.02, 0.8, "Apresentação comercial", {
    fill: COLORS.navySoft,
    lineColor: COLORS.navySoft,
    textColor: COLORS.navy,
    w: 2.04,
  });
  slide.addText(
    [
      { text: "CONVO", options: { color: COLORS.green } },
      { text: "CA", options: { color: COLORS.navy } },
    ],
    {
      x: 1.0,
      y: 1.34,
      w: 4.15,
      h: 0.48,
      fontFace: HEAD_FONT,
      fontSize: 37,
      bold: true,
      margin: 0,
    }
  );

  slide.addText("A plataforma que profissionaliza\na operação da sua pelada.", {
    x: 1.0,
    y: 2.3,
    w: 5.35,
    h: 1.08,
    fontFace: HEAD_FONT,
    fontSize: 23.2,
    bold: true,
    color: COLORS.ink,
    margin: 0,
  });

  addText(
    slide,
    "Organiza grupos, confirma presença, forma times, acompanha rankings e fecha o caixa do grupo com padrão real de produto.",
    {
      x: 1.02,
      y: 3.68,
      w: 4.92,
      h: 0.62,
      fontSize: 10.9,
      color: COLORS.body,
    }
  );

  addValueCard(slide, {
    x: 1.0,
    y: 5.02,
    w: 1.84,
    h: 1.1,
    label: "Presença",
    body: "Limite de vagas, espera automática e posição preferencial.",
    accent: COLORS.green,
  });
  addValueCard(slide, {
    x: 3.08,
    y: 5.02,
    w: 1.84,
    h: 1.1,
    label: "Times",
    body: "Menos discussão na montagem e mais clareza na escalação.",
    accent: COLORS.navy,
  });
  addValueCard(slide, {
    x: 5.16,
    y: 5.02,
    w: 1.84,
    h: 1.1,
    label: "Caixa",
    body: "Pendências, cobranças e total recebido no mesmo fluxo.",
    accent: COLORS.greenDeep,
  });

  addCard(slide, {
    x: 7.36,
    y: 0.98,
    w: 4.8,
    h: 5.88,
    fill: "FBFCFD",
    lineColor: "E5EAEE",
    shadow: false,
  });
  slide.addShape(pptx.ShapeType.rect, {
    x: 7.36,
    y: 0.98,
    w: 4.8,
    h: 0.07,
    fill: { color: COLORS.navySoft },
    line: { color: COLORS.navySoft, transparency: 100 },
  });

  addDeviceFrame(slide, {
    x: 8.52,
    y: 0.74,
    w: 2.58,
    h: 5.98,
    imagePath: IMAGES.dashboard,
  });

  addMiniStat(slide, {
    x: 7.52,
    y: 1.46,
    w: 1.48,
    label: "confirmados",
    value: "18/18",
    color: COLORS.greenDeep,
    fill: COLORS.greenSoft,
  });
  addMiniStat(slide, {
    x: 10.16,
    y: 4.86,
    w: 2.02,
    label: "recebidos",
    value: "R$ 1.105",
    color: COLORS.navy,
    fill: COLORS.navySoft,
  });

  addCard(slide, {
    x: 10.42,
    y: 1.86,
    w: 1.88,
    h: 2.0,
    fill: COLORS.white,
  });
  addText(slide, "Visão de grupo", {
    x: 10.56,
    y: 2.0,
    w: 1.58,
    h: 0.14,
    fontFace: HEAD_FONT,
    fontSize: 8.7,
    bold: true,
    color: COLORS.muted,
    align: "center",
  });
  slide.addImage({
    path: IMAGES.rankings,
    ...imageSizingContain(IMAGES.rankings, 10.58, 2.2, 1.38, 1.36),
  });

  finalizeSlide(slide);
}

// Slide 2
{
  const slide = pptx.addSlide();
  addLightBackground(slide, { showPitch: false, gridX: 5.8, gridY: 2.2 });
  addPill(slide, 0.96, 0.78, "Problema", {
    fill: COLORS.greenSoft,
    lineColor: COLORS.greenSoft,
    textColor: COLORS.greenDeep,
    w: 1.32,
  });
  slide.addText("A anatomia do caos", {
    x: 3.2,
    y: 1.46,
    w: 6.95,
    h: 0.44,
    fontFace: HEAD_FONT,
    fontSize: 26,
    bold: true,
    color: COLORS.ink,
    align: "center",
    margin: 0,
  });
  addText(slide, "Hoje, a maioria das peladas ainda sobrevive no improviso.", {
    x: 2.52,
    y: 2.1,
    w: 8.3,
    h: 0.18,
    fontSize: 10.9,
    color: COLORS.muted,
    align: "center",
  });

  addIssueCard(slide, {
    x: 0.9,
    y: 2.56,
    w: 3.18,
    h: 1.84,
    title: "Bagunça no WhatsApp",
    subtitle: "Convite, atraso, bola, PIX e escalação no mesmo lugar errado.",
    accent: COLORS.green,
  });
  addChatBubble(slide, { x: 1.12, y: 3.38, text: "Quem joga hoje?", fill: COLORS.greenSoft, w: 1.34 });
  addChatBubble(slide, { x: 2.48, y: 3.38, text: "Cadê o PIX?", fill: COLORS.navySoft, w: 1.08 });
  addChatBubble(slide, { x: 1.3, y: 3.74, text: "Vou atrasar", fill: COLORS.paperAlt, w: 1.05 });
  addChatBubble(slide, { x: 2.4, y: 3.74, text: "Cancelou?", fill: COLORS.dangerSoft, w: 1.02 });

  addIssueCard(slide, {
    x: 9.25,
    y: 2.56,
    w: 3.18,
    h: 1.84,
    title: "Planilhas desatualizadas",
    subtitle: "Status financeiro e presença dependem de alguém lembrar de atualizar.",
    accent: COLORS.navy,
  });
  for (let row = 0; row < 4; row += 1) {
    slide.addShape(pptx.ShapeType.rect, {
      x: 9.52,
      y: 3.4 + row * 0.18,
      w: 2.64,
      h: 0.11,
      fill: { color: row === 0 ? "E8EEF3" : "F2F4F6" },
      line: { color: "F2F4F6", transparency: 100 },
    });
  }
  slide.addShape(pptx.ShapeType.line, {
    x: 10.28,
    y: 3.38,
    w: 0,
    h: 0.62,
    line: { color: "D3DAE0", transparency: 0, width: 0.8 },
  });
  slide.addShape(pptx.ShapeType.line, {
    x: 11.03,
    y: 3.38,
    w: 0,
    h: 0.62,
    line: { color: "D3DAE0", transparency: 0, width: 0.8 },
  });
  slide.addShape(pptx.ShapeType.line, {
    x: 11.76,
    y: 3.38,
    w: 0,
    h: 0.62,
    line: { color: "D3DAE0", transparency: 0, width: 0.8 },
  });
  slide.addText("?", {
    x: 10.84,
    y: 3.58,
    w: 0.4,
    h: 0.4,
    fontFace: HEAD_FONT,
    fontSize: 27,
    bold: true,
    color: COLORS.ink,
    align: "center",
    margin: 0,
  });

  addCard(slide, {
    x: 4.56,
    y: 2.88,
    w: 4.2,
    h: 1.8,
    fill: COLORS.white,
  });
  slide.addShape(pptx.ShapeType.ellipse, {
    x: 6.12,
    y: 3.08,
    w: 1.0,
    h: 1.0,
    fill: { color: COLORS.greenSoft },
    line: { color: COLORS.green, transparency: 80, width: 1 },
  });
  addText(slide, "OP", {
    x: 6.12,
    y: 3.4,
    w: 1.0,
    h: 0.14,
    fontFace: HEAD_FONT,
    fontSize: 12,
    bold: true,
    color: COLORS.greenDeep,
    align: "center",
  });
  slide.addText("Operação improvisada", {
    x: 5.18,
    y: 4.16,
    w: 2.98,
    h: 0.18,
    fontFace: HEAD_FONT,
    fontSize: 15.8,
    bold: true,
    color: COLORS.ink,
    align: "center",
    margin: 0,
  });
  addText(slide, "Sem regra única, a resenha vira retrabalho, conflito e pouca previsibilidade.", {
    x: 5.02,
    y: 4.4,
    w: 3.28,
    h: 0.26,
    fontSize: 8.9,
    color: COLORS.body,
    align: "center",
  });

  addIssueCard(slide, {
    x: 0.9,
    y: 4.86,
    w: 3.18,
    h: 1.88,
    title: "Presença fora de controle",
    subtitle: "Check-in e lotação vivem espalhados entre mensagens e listas paralelas.",
    accent: COLORS.warning,
  });
  for (let col = 0; col < 4; col += 1) {
    for (let row = 0; row < 2; row += 1) {
      slide.addShape(pptx.ShapeType.roundRect, {
        x: 1.14 + col * 0.5,
        y: 5.82 + row * 0.34,
        w: 0.32,
        h: 0.22,
        rectRadius: 0.04,
        fill: {
          color: col === row ? COLORS.greenSoft : row === 1 && col === 2 ? COLORS.warningSoft : "EDF1F4",
        },
        line: { color: "D7DEE4", transparency: 20, width: 0.6 },
      });
    }
  }
  addPill(slide, 2.82, 5.82, "18 confirmados", {
    fill: COLORS.greenSoft,
    lineColor: COLORS.greenSoft,
    textColor: COLORS.greenDeep,
    w: 0.98,
    h: 0.25,
    fontSize: 6.9,
  });
  addPill(slide, 2.82, 6.14, "2 em espera", {
    fill: COLORS.warningSoft,
    lineColor: COLORS.warningSoft,
    textColor: COLORS.warning,
    w: 0.9,
    h: 0.25,
    fontSize: 6.9,
  });

  addIssueCard(slide, {
    x: 9.25,
    y: 4.86,
    w: 3.18,
    h: 1.88,
    title: "Caixa quebrado e calote",
    subtitle: "O grupo descobre tarde quem pagou, quem deve e quanto entrou.",
    accent: COLORS.danger,
  });
  addStatusRow(slide, {
    x: 9.54,
    y: 5.82,
    w: 2.62,
    h: 0.46,
    name: "João S.",
    amount: "R$ 25 pendente",
    status: "!",
    accent: COLORS.danger,
    fill: "F7EFF0",
    textColor: COLORS.ink,
  });
  addStatusRow(slide, {
    x: 9.54,
    y: 6.3,
    w: 2.62,
    h: 0.46,
    name: "Pedro J.",
    amount: "PIX sem baixa",
    status: "?",
    accent: COLORS.warning,
    fill: "FBF4E7",
    textColor: COLORS.ink,
  });

  addCard(slide, {
    x: 1.4,
    y: 6.98,
    w: 10.55,
    h: 0.42,
    fill: COLORS.white,
    lineColor: "D9E1E6",
    shadow: false,
  });
  addText(slide, "Sem padrão de operação, a pelada perde tempo, clareza e dinheiro.", {
    x: 1.65,
    y: 7.1,
    w: 10.05,
    h: 0.12,
    fontFace: HEAD_FONT,
    fontSize: 13,
    bold: true,
    color: COLORS.ink,
    align: "center",
  });

  finalizeSlide(slide);
}

// Slide 3
{
  const slide = pptx.addSlide();
  addLightBackground(slide, { showPitch: false, gridX: 11.0, gridY: 0.92 });
  addTitleBlock(slide, {
    kicker: "Produto",
    title: "Um sistema completo de gestão em um só lugar",
    subtitle: "Do grupo ao caixa, o Convoca centraliza a operação da pelada com experiência mobile-first.",
    x: 0.94,
    y: 0.76,
    w: 5.7,
    titleSize: 24,
  });

  addText(slide, "O fluxo do produto acompanha a jornada inteira do grupo:", {
    x: 0.98,
    y: 2.66,
    w: 4.2,
    h: 0.16,
    fontFace: HEAD_FONT,
    fontSize: 10.4,
    bold: true,
    color: COLORS.ink,
  });

  const bullets = [
    ["01", "Entrada e gestão do grupo", COLORS.green],
    ["02", "Presença com posição preferencial", COLORS.navy],
    ["03", "Histórico e resultado de jogo", COLORS.greenDeep],
    ["04", "Ranking e saúde financeira", COLORS.navy],
  ];

  bullets.forEach((bullet, index) => {
    const rowY = 3.0 + index * 0.74;
    addCard(slide, {
      x: 0.98,
      y: rowY,
      w: 5.02,
      h: 0.5,
      fill: COLORS.white,
      shadow: false,
    });
    addPill(slide, 1.16, rowY + 0.12, bullet[0], {
      fill: bullet[2] === COLORS.navy ? COLORS.navySoft : COLORS.greenSoft,
      lineColor: bullet[2] === COLORS.navy ? COLORS.navySoft : COLORS.greenSoft,
      textColor: bullet[2],
      w: 0.48,
      h: 0.24,
      fontSize: 6.8,
    });
    addText(slide, bullet[1], {
      x: 1.82,
      y: rowY + 0.15,
      w: 3.92,
      h: 0.12,
      fontFace: HEAD_FONT,
      fontSize: 9.6,
      bold: true,
      color: COLORS.ink,
    });
  });

  addCard(slide, {
    x: 6.78,
    y: 1.08,
    w: 5.0,
    h: 5.8,
    fill: "FBFCFD",
    lineColor: "E5EAEE",
    shadow: false,
  });

  addDeviceFrame(slide, {
    x: 7.42,
    y: 1.2,
    w: 2.08,
    h: 5.18,
    imagePath: IMAGES.dashboard,
    label: "Home",
  });
  addDeviceFrame(slide, {
    x: 9.8,
    y: 1.48,
    w: 1.94,
    h: 4.82,
    imagePath: IMAGES.confirmation,
    label: "Confirmação",
  });
  addCard(slide, {
    x: 6.52,
    y: 4.96,
    w: 1.48,
    h: 1.34,
    fill: COLORS.white,
  });
  addText(slide, "Histórico", {
    x: 6.68,
    y: 5.12,
    w: 1.16,
    h: 0.12,
    fontFace: HEAD_FONT,
    fontSize: 8.2,
    bold: true,
    color: COLORS.muted,
    align: "center",
  });
  slide.addImage({
    path: IMAGES.history,
    ...imageSizingContain(IMAGES.history, 6.7, 5.3, 1.12, 0.8),
  });

  finalizeSlide(slide);
}

// Slide 4
{
  const slide = pptx.addSlide();
  addLightBackground(slide, { gridX: 10.84, gridY: 0.9, showPitch: false });
  addTitleBlock(slide, {
    kicker: "Módulos",
    title: "Componentes claros para uma operação completa",
    subtitle:
      "Cada módulo resolve um pedaço crítico da rotina e, junto, cria uma experiência de produto coesa para o grupo.",
    x: 0.94,
    y: 0.76,
    w: 6.2,
    titleSize: 24,
  });

  addModuleCard(slide, {
    x: 0.98,
    y: 2.22,
    w: 5.48,
    h: 0.92,
    index: "01",
    title: "Grupos e partidas",
    description: "Cadastro do grupo, jogo da semana, limites de vagas e configuração da operação.",
    accent: COLORS.green,
  });
  addModuleCard(slide, {
    x: 0.98,
    y: 3.34,
    w: 5.48,
    h: 0.92,
    index: "02",
    title: "Presença com intenção",
    description: "Confirmação, fila de espera e posição preferencial com menos ruído operacional.",
    accent: COLORS.navy,
  });
  addModuleCard(slide, {
    x: 0.98,
    y: 4.46,
    w: 5.48,
    h: 0.92,
    index: "03",
    title: "Histórico e rankings",
    description: "Resultados, desempenho e memória esportiva do grupo em uma linha do tempo confiável.",
    accent: COLORS.greenDeep,
  });
  addModuleCard(slide, {
    x: 0.98,
    y: 5.58,
    w: 5.48,
    h: 0.92,
    index: "04",
    title: "Financeiro e cobranças",
    description: "Controle de pendências, baixas e caixa sem depender de planilha paralela.",
    accent: COLORS.navy,
  });

  addCard(slide, {
    x: 6.92,
    y: 1.08,
    w: 5.38,
    h: 5.96,
    fill: "FBFCFD",
    lineColor: "E5EAEE",
    shadow: false,
  });

  addDeviceFrame(slide, {
    x: 7.32,
    y: 1.64,
    w: 1.78,
    h: 4.56,
    imagePath: IMAGES.confirmation,
    label: "Presença",
    labelY: 6.52,
  });
  addDeviceFrame(slide, {
    x: 9.38,
    y: 1.18,
    w: 2.12,
    h: 5.14,
    imagePath: IMAGES.dashboard,
    label: "Visão do grupo",
    labelY: 6.52,
  });
  addDeviceFrame(slide, {
    x: 11.34,
    y: 1.96,
    w: 1.06,
    h: 3.88,
    imagePath: IMAGES.finance,
    label: "Caixa",
    labelY: 6.52,
  });

  finalizeSlide(slide);
}

// Slide 5
{
  const slide = pptx.addSlide();
  addLightBackground(slide);
  addTitleBlock(slide, {
    kicker: "Valor",
    title: "O impacto imediato da profissionalização",
    subtitle:
      "O Convoca transforma uma pelada comum em uma operação previsível, competitiva e sem atrito.",
    x: 1.08,
    y: 0.76,
    w: 10.9,
    align: "center",
    titleSize: 26,
  });

  addImpactTable(slide, 1.08, 2.24);

  addCard(slide, {
    x: 1.52,
    y: 7.02,
    w: 10.5,
    h: 0.36,
    fill: COLORS.white,
    shadow: false,
  });
  addText(slide, "Transforma um jogo entre amigos em uma experiência organizada e competitiva.", {
    x: 1.74,
    y: 7.14,
    w: 10.06,
    h: 0.12,
    fontFace: HEAD_FONT,
    fontSize: 12.1,
    bold: true,
    color: COLORS.ink,
    align: "center",
  });

  finalizeSlide(slide);
}

// Slide 6
{
  const slide = pptx.addSlide();
  addDarkBackground(slide);
  addTitleBlock(slide, {
    kicker: "Financeiro",
    title: "Organização financeira sem atrito",
    subtitle:
      "Saiba quem pagou, quem deve e quanto o grupo já recebeu com uma visão única de caixa.",
    x: 0.9,
    y: 0.7,
    w: 11.55,
    align: "center",
    dark: true,
    titleSize: 27,
  });

  addCard(slide, {
    x: 0.96,
    y: 2.18,
    w: 2.78,
    h: 4.18,
    fill: COLORS.darkPanel,
    lineColor: COLORS.darkPanel,
  });
  addText(slide, "Pendentes", {
    x: 1.18,
    y: 2.4,
    w: 2.3,
    h: 0.16,
    fontFace: HEAD_FONT,
    fontSize: 15,
    bold: true,
    color: COLORS.white,
    align: "center",
  });
  addStatusRow(slide, {
    x: 1.18,
    y: 2.98,
    w: 2.34,
    h: 0.74,
    name: "João S.",
    amount: "Mensalidade em aberto",
    status: "X",
    accent: COLORS.danger,
    fill: COLORS.darkPanelAlt,
  });
  addStatusRow(slide, {
    x: 1.18,
    y: 3.82,
    w: 2.34,
    h: 0.74,
    name: "Pedro J.",
    amount: "Diária pendente",
    status: "X",
    accent: COLORS.danger,
    fill: COLORS.darkPanelAlt,
  });
  addStatusRow(slide, {
    x: 1.18,
    y: 4.66,
    w: 2.34,
    h: 0.74,
    name: "Lucas M.",
    amount: "PIX sem baixa",
    status: "!",
    accent: COLORS.warning,
    fill: COLORS.darkPanelAlt,
  });

  addCard(slide, {
    x: 4.38,
    y: 2.34,
    w: 4.6,
    h: 2.42,
    fill: COLORS.darkPanelAlt,
    lineColor: COLORS.darkPanelAlt,
    shadow: false,
  });
  slide.addShape(pptx.ShapeType.roundRect, {
    x: 4.56,
    y: 2.5,
    w: 4.6,
    h: 2.42,
    rectRadius: 0.16,
    fill: { color: COLORS.green, transparency: 80 },
    line: { color: COLORS.green, transparency: 100 },
  });
  addCard(slide, {
    x: 4.16,
    y: 2.62,
    w: 4.6,
    h: 2.42,
    fill: COLORS.darkPanelAlt,
    lineColor: COLORS.green,
  });
  addText(slide, "Carteira unificada", {
    x: 4.5,
    y: 2.96,
    w: 3.92,
    h: 0.16,
    fontFace: HEAD_FONT,
    fontSize: 14.4,
    bold: true,
    color: "D7E7DB",
    align: "center",
  });
  slide.addText("R$ 1.250,00", {
    x: 4.45,
    y: 3.3,
    w: 4.0,
    h: 0.52,
    fontFace: HEAD_FONT,
    fontSize: 27,
    bold: true,
    color: COLORS.white,
    align: "center",
    margin: 0,
  });
  slide.addShape(pptx.ShapeType.roundRect, {
    x: 5.0,
    y: 4.12,
    w: 2.9,
    h: 0.52,
    rectRadius: 0.14,
    fill: { color: COLORS.green },
    line: { color: COLORS.green, transparency: 100 },
    shadow: safeOuterShadow("0B6837", 0.18, 45, 3, 1),
  });
  addText(slide, "Cobrar pendências", {
    x: 5.0,
    y: 4.28,
    w: 2.9,
    h: 0.14,
    fontFace: HEAD_FONT,
    fontSize: 10.6,
    bold: true,
    color: COLORS.white,
    align: "center",
  });

  addCard(slide, {
    x: 9.58,
    y: 2.18,
    w: 2.78,
    h: 4.18,
    fill: COLORS.darkPanel,
    lineColor: COLORS.darkPanel,
  });
  addText(slide, "Pagos", {
    x: 9.82,
    y: 2.4,
    w: 2.3,
    h: 0.16,
    fontFace: HEAD_FONT,
    fontSize: 15,
    bold: true,
    color: COLORS.white,
    align: "center",
  });
  addStatusRow(slide, {
    x: 9.86,
    y: 2.98,
    w: 2.34,
    h: 0.74,
    name: "Ricardo A.",
    amount: "Mensalidade paga",
    status: "OK",
    accent: COLORS.success,
    fill: COLORS.darkPanelAlt,
  });
  addStatusRow(slide, {
    x: 9.86,
    y: 3.82,
    w: 2.34,
    h: 0.74,
    name: "Mateus L.",
    amount: "Diária quitada",
    status: "OK",
    accent: COLORS.success,
    fill: COLORS.darkPanelAlt,
  });
  addStatusRow(slide, {
    x: 9.86,
    y: 4.66,
    w: 2.34,
    h: 0.74,
    name: "Carlos R.",
    amount: "Baixa confirmada",
    status: "OK",
    accent: COLORS.success,
    fill: COLORS.darkPanelAlt,
  });

  addText(slide, "Fim das discussões. Controle absoluto de fluxo de caixa e pendências do grupo.", {
    x: 2.05,
    y: 6.86,
    w: 9.2,
    h: 0.14,
    fontFace: HEAD_FONT,
    fontSize: 12.6,
    bold: true,
    color: COLORS.white,
    align: "center",
  });

  finalizeSlide(slide);
}

// Slide 7
{
  const slide = pptx.addSlide();
  addLightBackground(slide);
  addTitleBlock(slide, {
    kicker: "Expansão",
    title: "Um ecossistema para todos os níveis do jogo",
    subtitle:
      "A mesma base de produto atende organizadores independentes e camadas maiores de operação esportiva.",
    x: 1.15,
    y: 0.76,
    w: 10.8,
    align: "center",
    titleSize: 24,
  });

  slide.addShape(pptx.ShapeType.ellipse, {
    x: 5.46,
    y: 3.1,
    w: 2.5,
    h: 2.5,
    fill: { color: COLORS.greenGlow },
    line: { color: COLORS.green, transparency: 92 },
  });
  slide.addShape(pptx.ShapeType.ellipse, {
    x: 5.7,
    y: 3.34,
    w: 2.02,
    h: 2.02,
    fill: { color: COLORS.greenDeep },
    line: { color: COLORS.greenDeep, transparency: 100 },
    shadow: safeOuterShadow("295B45", 0.22, 45, 3, 1),
  });
  slide.addText("CONVOCA", {
    x: 5.95,
    y: 4.06,
    w: 1.52,
    h: 0.2,
    fontFace: HEAD_FONT,
    fontSize: 16.5,
    bold: true,
    color: COLORS.white,
    align: "center",
    margin: 0,
  });

  const line = { color: COLORS.greenDeep, width: 2.2 };
  // Intencional: as linhas convergem para o nodo central do ecossistema.
  slide.addShape(pptx.ShapeType.line, { x: 6.7, y: 3.1, w: 0, h: -0.68, line });
  slide.addShape(pptx.ShapeType.line, { x: 5.52, y: 4.22, w: -1.06, h: -0.36, line });
  slide.addShape(pptx.ShapeType.line, { x: 7.86, y: 4.22, w: 1.02, h: -0.36, line });
  slide.addShape(pptx.ShapeType.line, { x: 5.96, y: 5.14, w: -0.98, h: 0.88, line });
  slide.addShape(pptx.ShapeType.line, { x: 7.34, y: 5.14, w: 1.16, h: 0.88, line });

  addAudienceBox(slide, {
    x: 4.22,
    y: 1.7,
    w: 4.88,
    h: 0.92,
    title: "Organizadores independentes",
    subtitle: "O power-user clássico",
    accent: COLORS.green,
  });
  addAudienceBox(slide, {
    x: 1.02,
    y: 3.46,
    w: 3.12,
    h: 0.92,
    title: "Arenas e quadras",
    subtitle: "Parceiros de infraestrutura",
    accent: COLORS.navy,
  });
  addAudienceBox(slide, {
    x: 9.2,
    y: 3.46,
    w: 3.12,
    h: 0.92,
    title: "Grupos society",
    subtitle: "Ligas amadoras",
    accent: COLORS.greenDeep,
  });
  addAudienceBox(slide, {
    x: 1.86,
    y: 5.88,
    w: 3.08,
    h: 0.92,
    title: "Empresas e RH",
    subtitle: "Integração corporativa",
    accent: COLORS.navy,
  });
  addAudienceBox(slide, {
    x: 8.38,
    y: 5.88,
    w: 3.08,
    h: 0.92,
    title: "Condomínios",
    subtitle: "Gestão de áreas de lazer",
    accent: COLORS.green,
  });

  finalizeSlide(slide, { skipOverlapCheck: true });
}

// Slide 8
{
  const slide = pptx.addSlide();
  addLightBackground(slide, { gridX: 10.85, gridY: 0.95 });
  addTitleBlock(slide, {
    kicker: "Diferenciais",
    title: "Os nossos diferenciais injustos",
    subtitle:
      "Não é só uma planilha bonita. É uma camada de produto que reduz atrito, memória operacional e conflito.",
    x: 0.9,
    y: 0.76,
    w: 11.2,
    align: "center",
    titleSize: 27,
  });

  addDifferentialCard(slide, {
    x: 0.92,
    y: 2.2,
    w: 5.7,
    h: 1.82,
    index: "01",
    title: "Profissionalização real",
    description:
      "Eleva a percepção do grupo com experiência de produto, não de improviso operacional.",
    accent: COLORS.green,
  });
  addDifferentialCard(slide, {
    x: 6.76,
    y: 2.2,
    w: 5.65,
    h: 1.82,
    index: "02",
    title: "Zero conflito desnecessário",
    description:
      "Regras visíveis para presença, times e pagamentos tiram a discussão do campo errado.",
    accent: COLORS.navy,
  });
  addDifferentialCard(slide, {
    x: 0.92,
    y: 4.34,
    w: 5.7,
    h: 1.82,
    index: "03",
    title: "Economia máxima de tempo",
    description:
      "O organizador volta a focar em jogar, não em perseguir mensagens e repassar planilha.",
    accent: COLORS.greenDeep,
  });
  addDifferentialCard(slide, {
    x: 6.76,
    y: 4.34,
    w: 5.65,
    h: 1.82,
    index: "04",
    title: "Memória esportiva e financeira",
    description:
      "Tudo fica registrado: participação, desempenho, rankings, cobranças e histórico do grupo.",
    accent: COLORS.navy,
  });

  finalizeSlide(slide);
}

// Slide 9
{
  const slide = pptx.addSlide();
  addLightBackground(slide, { showPitch: false, gridX: 11.02, gridY: 0.9 });
  addTitleBlock(slide, {
    kicker: "Produto em ação",
    title: "Tela inicial, presença, rankings e financeiro em uma experiência móvel consistente",
    subtitle:
      "Os prints do produto entram no deck dentro de moldura nativa de dispositivo para manter leitura boa também no PDF.",
    x: 0.9,
    y: 0.76,
    w: 11.4,
    align: "center",
    titleSize: 22,
  });

  addCard(slide, {
    x: 0.86,
    y: 2.16,
    w: 11.62,
    h: 4.94,
    fill: "FBFCFD",
    lineColor: "E5EAEE",
    shadow: false,
  });

  const phones = [
    { label: "Dashboard", imagePath: IMAGES.dashboard, x: 1.08 },
    { label: "Presença", imagePath: IMAGES.confirmation, x: 3.37 },
    { label: "Rankings", imagePath: IMAGES.rankings, x: 5.74 },
    { label: "Financeiro", imagePath: IMAGES.finance, x: 8.2 },
    { label: "Cobranças", imagePath: IMAGES.charges, x: 10.49 },
  ];

  phones.forEach((phone) => {
    addDeviceFrame(slide, {
      x: phone.x,
      y: 2.28,
      w: 1.72,
      h: 4.5,
      imagePath: phone.imagePath,
      label: phone.label,
      labelY: 6.92,
    });
  });

  finalizeSlide(slide);
}

// Slide 10
{
  const slide = pptx.addSlide();
  slide.background = { color: COLORS.paperAlt };
  addCornerGlow(slide, -0.7, 4.65, 3.4, 3.4, COLORS.greenGlow, 22);
  addCornerGlow(slide, 10.95, -0.8, 3.0, 3.0, COLORS.navySoft, 22);
  addFrame(slide, { color: COLORS.line, transparency: 65 });

  addText(slide, "www.uzzai.com.br", {
    x: 10.36,
    y: 0.62,
    w: 1.96,
    h: 0.12,
    fontFace: HEAD_FONT,
    fontSize: 8.8,
    bold: true,
    color: COLORS.muted,
    align: "right",
  });

  addWordmark(slide, 0.92, 1.34, 42);
  slide.addText("A estrutura profissional\nque sua pelada merece.", {
    x: 0.96,
    y: 3.08,
    w: 6.18,
    h: 1.08,
    fontFace: HEAD_FONT,
    fontSize: 28,
    bold: true,
    color: COLORS.ink,
    margin: 0,
  });
  slide.addText("Vamos escalar juntos?", {
    x: 0.98,
    y: 5.72,
    w: 4.1,
    h: 0.34,
    fontFace: HEAD_FONT,
    fontSize: 24,
    bold: true,
    color: COLORS.navyDeep,
    margin: 0,
  });

  addCard(slide, {
    x: 8.6,
    y: 0.94,
    w: 4.18,
    h: 5.98,
    fill: COLORS.navyDeep,
    lineColor: COLORS.navyDeep,
  });
  slide.addText("Pronto para entrar em campo?", {
    x: 8.98,
    y: 1.28,
    w: 3.42,
    h: 0.64,
    fontFace: HEAD_FONT,
    fontSize: 20,
    bold: true,
    color: COLORS.white,
    margin: 0,
  });

  addPill(slide, 9.02, 2.5, "WEB", {
    fill: COLORS.darkPanelAlt,
    lineColor: COLORS.darkPanelAlt,
    textColor: COLORS.white,
    w: 0.56,
    h: 0.26,
    fontSize: 6.8,
  });
  addText(slide, "convoca.app", {
    x: 9.78,
    y: 2.56,
    w: 2.0,
    h: 0.14,
    fontFace: HEAD_FONT,
    fontSize: 11.2,
    bold: true,
    color: COLORS.white,
  });

  addPill(slide, 9.02, 3.04, "MAIL", {
    fill: COLORS.darkPanelAlt,
    lineColor: COLORS.darkPanelAlt,
    textColor: COLORS.white,
    w: 0.7,
    h: 0.26,
    fontSize: 6.8,
  });
  addText(slide, "ola@convoca.app", {
    x: 9.78,
    y: 3.1,
    w: 2.25,
    h: 0.14,
    fontFace: HEAD_FONT,
    fontSize: 11.2,
    bold: true,
    color: COLORS.white,
  });

  addPill(slide, 9.02, 3.58, "CALL", {
    fill: COLORS.darkPanelAlt,
    lineColor: COLORS.darkPanelAlt,
    textColor: COLORS.white,
    w: 0.72,
    h: 0.26,
    fontSize: 6.8,
  });
  addText(slide, "(11) 99999-0000", {
    x: 9.78,
    y: 3.64,
    w: 2.2,
    h: 0.14,
    fontFace: HEAD_FONT,
    fontSize: 11.2,
    bold: true,
    color: COLORS.white,
  });

  addCard(slide, {
    x: 8.98,
    y: 4.78,
    w: 1.7,
    h: 1.7,
    fill: COLORS.white,
    lineColor: COLORS.white,
    shadow: false,
  });
  slide.addImage({
    path: qrPath,
    ...imageSizingContain(qrPath, 9.06, 4.86, 1.54, 1.54),
  });
  addText(slide, "Escaneie para\ntestar agora", {
    x: 10.88,
    y: 5.12,
    w: 1.36,
    h: 0.45,
    fontFace: HEAD_FONT,
    fontSize: 11.2,
    bold: true,
    color: COLORS.white,
    align: "left",
  });

  finalizeSlide(slide);
}

const outputPptxPath = path.join(outputDir, "convoca-apresentacao-editavel.pptx");
await pptx.writeFile({ fileName: outputPptxPath });
console.log(`Deck gerado em: ${outputPptxPath}`);
