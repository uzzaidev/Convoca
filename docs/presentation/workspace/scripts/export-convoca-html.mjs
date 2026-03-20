import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const workspaceDir = path.resolve(scriptDir, "..");
const presentationDir = path.resolve(workspaceDir, "..");
const htmlDir = path.resolve(presentationDir, "html");
const htmlPath = path.resolve(htmlDir, "index.html");
const renderedDir = path.resolve(htmlDir, "rendered");
const outputDir = path.resolve(presentationDir, "output");
const pdfPath = path.resolve(outputDir, "convoca-apresentacao-html.pdf");
const edgeProfilesRoot = path.resolve(workspaceDir, ".edge-headless-profiles");

const slideIds = Array.from({ length: 10 }, (_, index) => `slide-${index + 1}`);

fs.mkdirSync(renderedDir, { recursive: true });
fs.mkdirSync(outputDir, { recursive: true });
fs.mkdirSync(edgeProfilesRoot, { recursive: true });

const edgeProfileDir = fs.mkdtempSync(path.join(edgeProfilesRoot, "run-"));

const edgeCandidates = [
  process.env.PRESENTATION_EDGE_PATH,
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
].filter(Boolean);

const edgePath = edgeCandidates.find((candidate) => fs.existsSync(candidate));

if (!edgePath) {
  throw new Error("Microsoft Edge not found. Set PRESENTATION_EDGE_PATH if needed.");
}

const fileUrl = pathToFileURL(htmlPath).href;

async function runEdge(args) {
  const baseArgs = [
    `--user-data-dir=${edgeProfileDir}`,
    "--no-first-run",
    "--disable-crash-reporter",
    "--disable-breakpad",
    "--disable-gpu",
    "--disable-extensions",
  ];

  await new Promise((resolve, reject) => {
    const child = spawn(edgePath, [...baseArgs, ...args], {
      stdio: "inherit",
      windowsHide: true,
    });

    child.on("error", reject);
    child.on("exit", (code) => {
      if (code === 0) {
        resolve();
        return;
      }
      reject(new Error(`Edge exited with code ${code}`));
    });
  });
}

async function exportPdf() {
  if (fs.existsSync(pdfPath)) {
    fs.rmSync(pdfPath, { force: true });
  }

  await runEdge([
    "--headless",
    "--allow-file-access-from-files",
    "--no-pdf-header-footer",
    `--print-to-pdf=${pdfPath}`,
    fileUrl,
  ]);
}

async function exportSlides() {
  for (const entry of fs.readdirSync(renderedDir)) {
    if (entry.toLowerCase().endsWith(".png")) {
      fs.rmSync(path.join(renderedDir, entry), { force: true });
    }
  }

  for (const slideId of slideIds) {
    const outputPath = path.join(renderedDir, `${slideId}.png`);

    await runEdge([
      "--headless",
      "--hide-scrollbars",
      "--allow-file-access-from-files",
      "--run-all-compositor-stages-before-draw",
      "--virtual-time-budget=2500",
      "--window-size=1280,720",
      `--screenshot=${outputPath}`,
      `${fileUrl}#${slideId}`,
    ]);
  }
}

try {
  await exportPdf();
  await exportSlides();

  console.log(`HTML deck exported to: ${pdfPath}`);
  console.log(`Slide renders exported to: ${renderedDir}`);
} finally {
  fs.rmSync(edgeProfileDir, { recursive: true, force: true });
}
