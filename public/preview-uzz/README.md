# Convoca × sistema visual UzzAI — preview estático

## Como abrir

No Preview Vercel da branch `feat/ui-rebrand-uzz`: abra `/preview-uzz/`.

1. Extraia o ZIP (local).
2. Abra `index.html` no navegador.
3. Clique no ícone ↗ de qualquer golden para abrir a tela em tamanho real.
4. Para evitar restrições de arquivos locais, também pode usar a extensão **Live Server** no VS Code.

## Conteúdo

- `index.html`: deck visual com os 12 celulares.
- `tokens.css`: tokens, shells, padrões, componentes e responsividade.
- `app.js`: ícones e microinterações demonstrativas.
- `golden/`: 12 páginas HTML independentes.
- `assets/`: ícone e splash originais do Convoca.

## Decisões de rebranding aplicadas

- App dark UzzAI + verde de campo Convoca.
- Poppins para hierarquia e Exo 2 para labels operacionais.
- Marketing, Auth e App usam molduras diferentes.
- Bottom tab bar com hub central “Convocar”.
- Home resolve a próxima ação, não exibe analytics genérico.
- Cards apenas quando existe interação, estado ou decisão.
- Empty/error/success possuem CTA de continuidade do ciclo.
- O motivo do campo aparece como textura e geometria, não como decoração em todas as telas.

## Limite do artefato

É um preview visual navegável. Não possui autenticação, persistência, backend, pagamento nem integração com o app real.
