import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Excluir conta - Convoca",
  description: "Solicite a exclusao da sua conta e dados do Convoca.",
};

const LEGAL_EMAIL = "juridico@uzzai.com.br";

export default function DeleteAccountPage() {
  const subject = encodeURIComponent(
    "Solicitacao de exclusao de conta - Convoca"
  );
  const body = encodeURIComponent(
    [
      "Ola, equipe Uzz.Ai.",
      "",
      "Solicito a exclusao da minha conta Convoca e dos dados pessoais associados, conforme previsto na LGPD (Lei n. 13.709/2018).",
      "",
      "Email cadastrado no Convoca:",
      "Nome completo:",
      "CPF (para validacao de identidade):",
      "Grupos relacionados, se houver:",
      "",
      "Confirmo que entendo que alguns dados podem ser mantidos conforme obrigacoes legais (retencao fiscal de 5 anos, logs de acesso por 6 meses conforme Marco Civil da Internet) e que os dados do grupo ficam disponiveis por 30 dias para exportacao antes da exclusao definitiva.",
    ].join("\n")
  );

  return (
    <main className="min-h-screen bg-slate-50 px-5 py-10 text-slate-900">
      <article className="mx-auto max-w-3xl rounded-lg border border-slate-200 bg-white p-6 shadow-sm md:p-10">
        <Link
          href="/"
          className="text-sm font-semibold text-green-700 hover:text-green-800"
        >
          Convoca
        </Link>

        <h1 className="mt-5 text-3xl font-bold tracking-normal">
          Excluir conta e dados
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Uzz.Ai Ltda &middot; CNPJ 64.025.866/0001-30
        </p>

        <section className="mt-8 space-y-4 leading-7 text-slate-700">
          <p>
            Voce pode excluir sua conta Convoca e os dados pessoais associados
            diretamente pelo app ou por e-mail, conforme previsto na LGPD (Lei
            n&ordm; 13.709/2018).
          </p>

          <h2 className="pt-4 text-xl font-semibold text-slate-900">
            Opcao 1 — Excluir diretamente no app (recomendado)
          </h2>
          <p>
            Dentro do app, acesse <strong>Perfil</strong> →{" "}
            <strong>Privacidade e conta</strong> →{" "}
            <strong>Excluir minha conta</strong>. A exclusao e imediata apos a
            confirmacao.
          </p>
          <div className="rounded-lg border border-green-200 bg-green-50 p-4">
            <p className="text-sm font-semibold text-green-800">
              A exclusao pelo app e instantanea. Seus dados pessoais sao
              removidos imediatamente.
            </p>
          </div>

          <h2 className="pt-4 text-xl font-semibold text-slate-900">
            Opcao 2 — Solicitar por e-mail
          </h2>
          <p>
            Caso prefira, envie um e-mail para{" "}
            <a
              className="font-semibold text-green-700"
              href={`mailto:${LEGAL_EMAIL}`}
            >
              {LEGAL_EMAIL}
            </a>{" "}
            usando o mesmo e-mail cadastrado no Convoca.
          </p>

          <a
            className="inline-flex h-11 items-center justify-center rounded-md bg-slate-600 px-5 text-sm font-semibold text-white hover:bg-slate-700"
            href={`mailto:${LEGAL_EMAIL}?subject=${subject}&body=${body}`}
          >
            Solicitar exclusao por e-mail
          </a>

          <h2 className="pt-4 text-xl font-semibold text-slate-900">
            Dados excluidos
          </h2>
          <p>
            Quando a solicitacao for validada, removeremos ou anonimizaremos
            dados pessoais da conta, incluindo: nome, e-mail, foto, tokens de
            notificacao push e demais dados vinculados diretamente ao usuario.
          </p>

          <h2 className="pt-4 text-xl font-semibold text-slate-900">
            Dados que podem ser mantidos
          </h2>
          <p>Conforme a legislacao vigente, podemos reter:</p>
          <ul className="list-disc space-y-2 pl-6">
            <li>Dados de conta: ate 5 anos apos o encerramento.</li>
            <li>
              Logs de acesso: 6 meses (Art. 15 do Marco Civil da Internet).
            </li>
            <li>
              Dados de pagamento: 5 anos (obrigacao fiscal — Lei n&ordm;
              9.430/1996).
            </li>
            <li>
              Dados do grupo e eventos: disponiveis para exportacao por 30 dias
              apos o encerramento, depois excluidos definitivamente.
            </li>
            <li>
              Historicos essenciais de grupos/eventos em que outros usuarios
              tambem participam (anonimizados quando possivel).
            </li>
          </ul>

          <h2 className="pt-4 text-xl font-semibold text-slate-900">Prazo</h2>
          <div className="rounded-lg border border-green-200 bg-green-50 p-4">
            <p className="text-sm font-semibold text-green-800">
              As solicitacoes serao analisadas e respondidas em ate 15 (quinze)
              dias uteis, conforme previsto no Art. 18 da LGPD.
            </p>
          </div>

          <h2 className="pt-4 text-xl font-semibold text-slate-900">
            Outros direitos
          </h2>
          <p>
            Para exercer outros direitos previstos na LGPD (acesso, correcao,
            portabilidade, etc.), acesse a pagina{" "}
            <Link className="font-semibold text-green-700" href="/lgpd">
              Direitos LGPD
            </Link>
            .
          </p>
        </section>

        <footer className="mt-10 border-t border-slate-200 pt-6 text-xs text-slate-400">
          <p>Uzz.Ai Ltda — CNPJ 64.025.866/0001-30</p>
          <p>
            Av. Julio de Castilhos, 1.989, Sala L, Centro — Caxias do Sul/RS —
            CEP 95.020-485
          </p>
        </footer>
      </article>
    </main>
  );
}
