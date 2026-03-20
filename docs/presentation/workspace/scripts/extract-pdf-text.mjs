import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const workspaceDir = path.resolve(scriptDir, "..");
const pdfPath = path.resolve(workspaceDir, "..", "..", "Apresentação Convoca.pdf");
const outputDir = path.resolve(workspaceDir, "output");

fs.mkdirSync(outputDir, { recursive: true });

const pdfData = new Uint8Array(fs.readFileSync(pdfPath));
const pdf = await getDocument({
  data: pdfData,
  disableFontFace: true,
  isEvalSupported: false,
  useSystemFonts: true,
}).promise;

const pages = [];

for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
  const page = await pdf.getPage(pageNumber);
  const viewport = page.getViewport({ scale: 1 });
  const textContent = await page.getTextContent();

  const items = textContent.items
    .map((item) => {
      if (!("str" in item)) {
        return null;
      }

      return {
        text: item.str,
        x: Number(item.transform?.[4] || 0),
        y: Number(item.transform?.[5] || 0),
        width: Number(item.width || 0),
        height: Number(item.height || 0),
        fontName: item.fontName || null,
      };
    })
    .filter(Boolean);

  pages.push({
    pageNumber,
    width: viewport.width,
    height: viewport.height,
    text: items.map((item) => item.text).join(" ").replace(/\s+/g, " ").trim(),
    items,
  });
}

fs.writeFileSync(path.join(outputDir, "pdf-text.json"), JSON.stringify({ numPages: pdf.numPages, pages }, null, 2));

for (const page of pages) {
  const lines = [`Page ${page.pageNumber}`, page.text, "", "Items:"];
  for (const item of page.items) {
    lines.push(`${item.x.toFixed(1)}\t${item.y.toFixed(1)}\t${item.width.toFixed(1)}\t${item.height.toFixed(1)}\t${item.text}`);
  }
  fs.writeFileSync(path.join(outputDir, `page-${String(page.pageNumber).padStart(2, "0")}.txt`), lines.join("\n"));
}

console.log(`Extracted text from ${pdf.numPages} pages to ${outputDir}`);
