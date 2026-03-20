import fs from "node:fs";
import path from "node:path";

const pdfPath = path.resolve("docs/Apresentação Convoca.pdf");
const outputDir = path.resolve("docs/presentation/extracted-images");

fs.mkdirSync(outputDir, { recursive: true });

const pdfBuffer = fs.readFileSync(pdfPath);
const pdfText = pdfBuffer.toString("latin1");

const objectRegex = /(\d+)\s+(\d+)\s+obj([\s\S]*?)endobj/g;
const extracted = [];

let match;
while ((match = objectRegex.exec(pdfText))) {
  const objectNumber = Number(match[1]);
  const body = match[3];

  if (!/\/Subtype\s*\/Image\b/.test(body) || !/\/Filter\s*\/DCTDecode\b/.test(body)) {
    continue;
  }

  const streamIndex = body.indexOf("stream");
  if (streamIndex === -1) {
    continue;
  }

  const header = body.slice(0, streamIndex);
  const width = Number((header.match(/\/Width\s+(\d+)/) || [])[1] || 0);
  const height = Number((header.match(/\/Height\s+(\d+)/) || [])[1] || 0);

  const absoluteStreamIndex = match.index + match[0].indexOf("stream");
  let dataStart = absoluteStreamIndex + "stream".length;

  if (pdfBuffer[dataStart] === 0x0d && pdfBuffer[dataStart + 1] === 0x0a) {
    dataStart += 2;
  } else if (pdfBuffer[dataStart] === 0x0a || pdfBuffer[dataStart] === 0x0d) {
    dataStart += 1;
  }

  const endMarker = Buffer.from("endstream", "latin1");
  const dataEnd = pdfBuffer.indexOf(endMarker, dataStart);
  if (dataEnd === -1) {
    continue;
  }

  let imageBuffer = pdfBuffer.subarray(dataStart, dataEnd);
  while (
    imageBuffer.length > 0 &&
    (imageBuffer[imageBuffer.length - 1] === 0x0a || imageBuffer[imageBuffer.length - 1] === 0x0d)
  ) {
    imageBuffer = imageBuffer.subarray(0, imageBuffer.length - 1);
  }

  const fileName = `obj-${String(objectNumber).padStart(3, "0")}-${width}x${height}.jpg`;
  fs.writeFileSync(path.join(outputDir, fileName), imageBuffer);

  extracted.push({
    objectNumber,
    width,
    height,
    fileName,
  });
}

fs.writeFileSync(
  path.join(outputDir, "manifest.json"),
  JSON.stringify(
    {
      pdfPath,
      extractedCount: extracted.length,
      images: extracted,
    },
    null,
    2
  )
);

console.log(`Extracted ${extracted.length} JPEG images to ${outputDir}`);
