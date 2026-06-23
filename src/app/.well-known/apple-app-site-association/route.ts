/**
 * Apple-App-Site-Association (AASA) — Universal Links iOS
 *
 * A Apple faz GET nessa URL ao instalar/atualizar o app.
 * Sem esse arquivo, links https://convoca.uzzai.com.br/* abrem no Safari
 * em vez de abrir direto no app Convoca.
 *
 * Requisitos da Apple:
 *  - Content-Type: application/json  (não application/pkcs7-mime)
 *  - Sem redirect (200 puro)
 *  - Acessível sem autenticação — ver proxy.ts (/.well-known é público)
 *
 * Documentação: https://developer.apple.com/documentation/xcode/supporting-associated-domains
 */
export async function GET() {
  const aasa = {
    applinks: {
      // Team ID + Bundle ID
      details: [
        {
          appIDs: ["2YRXNXGL8K.com.uzzai.convoca"],
          components: [
            {
              // Links de grupos (ex: convite, detalhe)
              "/": "/groups/*",
              comment: "Abre grupos no app Convoca",
            },
            {
              // Links de eventos
              "/": "/events/*",
              comment: "Abre eventos no app Convoca",
            },
            {
              // Dashboard e demais rotas autenticadas
              "/": "/dashboard*",
              comment: "Abre dashboard no app Convoca",
            },
            {
              // Fallback: qualquer outra rota
              "/": "/*",
              comment: "Fallback para demais rotas do Convoca",
            },
          ],
        },
      ],
    },
  };

  return new Response(JSON.stringify(aasa, null, 2), {
    status: 200,
    headers: {
      // Apple exige application/json nesse endpoint
      "Content-Type": "application/json",
      // Cache de 1 hora — Apple faz re-fetch periodicamente
      "Cache-Control": "public, max-age=3600",
    },
  });
}
