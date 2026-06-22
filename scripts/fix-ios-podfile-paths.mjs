/**
 * Normaliza paths do Podfile gerado pelo `cap sync` (pnpm usa pastas .pnpm
 * com hash que mudam entre installs — quebra pod install no CI).
 * Converte para symlinks hoisted: ../../node_modules/@scope/package
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const podfilePath = join("ios", "App", "Podfile");
let content = readFileSync(podfilePath, "utf8");

const pnpmPath =
  /(\.\.\/\.\.\/node_modules\/\.pnpm\/[^'"]+\/node_modules\/([^'"]+))/g;

content = content.replace(pnpmPath, "../../node_modules/$2");

writeFileSync(podfilePath, content);
console.log("✅ Podfile iOS: paths normalizados para node_modules hoisted (pnpm CI)");
