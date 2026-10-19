/* Gera a locução do corte de 60 s no ElevenLabs (voz Felipe Leão, modelo v3 — bem mais expressivo que o v2).
   Tags em inglês entre colchetes ([excited], [curious], [laughs]...) dirigem a emoção no v3; exclamações ajudam.
   2 takes por frase em locucao/spot60_v2/<arquivo>_t1|t2.mp3; depois aponte VOZ_DIR/VOZ no audio.mjs.

Uso (PowerShell):  $env:ELEVENLABS_API_KEY = "..." ; node locucao.mjs
*/
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(HERE, "locucao", "spot60_v2");
const KEY = process.env.ELEVENLABS_API_KEY;
if (!KEY) throw new Error("defina ELEVENLABS_API_KEY");
const VOICE = "ZgmYvdcrNoefQ4HErYZN"; // Felipe Leão
const MODEL = "eleven_v3";

const FRASES = [
  ["01_jogos", "[excited] Seus jogos, sua galera... tudo organizado num lugar só!"],
  ["02_confirmar", "[curious] Chegou o convite? [excited] Confirmou presença, tá dentro do jogo!"],
  ["03_sorteio", "[excited] Sorteio de times equilibrados, num toque só! [laughs] Acabou a discussão."],
  ["04_aovivo", "[sports commentator, excited] Gol! Assistência! Placar! Tudo registrado em tempo real!"],
  ["05_ranking", "[confident] Um ranking justo, com os números de todo mundo. Ninguém contesta!"],
  ["06_ia", "[curious] Ficou na dúvida? [excited] Pergunta pra IA... ela responde na hora!"],
  ["07_assinatura", "[warm, confident] Convoca. Do convite ao ranking."],
];
// v3: stability 0 = "Creative" (mais emoção), .5 = "Natural"; gera um de cada para escolher
const TAKES = { t1: { stability: 0, similarity_boost: .8 }, t2: { stability: .5, similarity_boost: .8 } };

fs.mkdirSync(OUT, { recursive: true });
for (const [file, text] of FRASES) for (const [take, voice_settings] of Object.entries(TAKES)) {
  const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${VOICE}?output_format=mp3_44100_192`, {
    method: "POST", headers: { "xi-api-key": KEY, "Content-Type": "application/json" },
    body: JSON.stringify({ text, model_id: MODEL, voice_settings }),
  });
  if (!res.ok) throw new Error(`${file}_${take}: ${res.status} ${(await res.text()).slice(0, 300)}`);
  fs.writeFileSync(path.join(OUT, `${file}_${take}.mp3`), Buffer.from(await res.arrayBuffer()));
  console.log("ok", `${file}_${take}.mp3`);
}
