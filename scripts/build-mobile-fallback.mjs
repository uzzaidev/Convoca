import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

const outDir = join(process.cwd(), "out");

const html = `<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
    <meta name="theme-color" content="#16a34a" />
    <title>Convoca</title>
    <style>
      :root {
        color-scheme: light;
        font-family: Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        background: #f7faf8;
        color: #0f172a;
      }
      body {
        min-height: 100vh;
        margin: 0;
        display: grid;
        place-items: center;
        padding: 24px;
      }
      main {
        width: min(420px, 100%);
        border: 1px solid #d7e4dc;
        border-radius: 8px;
        background: #ffffff;
        padding: 28px;
        box-shadow: 0 18px 40px rgba(15, 23, 42, 0.08);
      }
      h1 {
        margin: 0 0 8px;
        font-size: 28px;
        line-height: 1.15;
      }
      p {
        margin: 0;
        color: #475569;
        line-height: 1.5;
      }
      a {
        display: inline-flex;
        margin-top: 22px;
        color: #0f7a3f;
        font-weight: 700;
        text-decoration: none;
      }
    </style>
  </head>
  <body>
    <main>
      <h1>Convoca</h1>
      <p>Conecte-se a internet para carregar o app.</p>
      <a href="https://convoca.uzzai.com.br">Abrir Convoca</a>
    </main>
  </body>
</html>
`;

await mkdir(outDir, { recursive: true });
await writeFile(join(outDir, "index.html"), html, "utf8");

console.log("Mobile fallback generated at out/index.html");
