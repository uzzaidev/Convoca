import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Excluir conta - Convoca",
  description: "Solicite a exclusao da sua conta e dados do Convoca.",
};

const SUPPORT_EMAIL = "suporte@convoca.app";

export default function DeleteAccountPage() {
  const subject = encodeURIComponent("Solicitacao de exclusao de conta - Convoca");
  const body = encodeURIComponent(
    [
      "Ola, equipe Convoca.",
      "",
      "Solicito a exclusao da minha conta e dos dados pessoais associados, conforme aplicavel.",
      "",
      "Email cadastrado no Convoca:",
      "Nome completo:",
      "Grupos relacionados, se houver:",
      "",
      "Confirmo que entendo que alguns dados podem ser mantidos quando houver obrigacao legal, seguranca, prevencao de fraude, auditoria ou registros essenciais de grupos/eventos.",
    ].join("\n")
  );

  return (
    <main className="min-h-screen bg-slate-50 px-5 py-10 text-slate-900">
      <article className="mx-auto max-w-3xl rounded-lg border border-slate-200 bg-white p-6 shadow-sm md:p-10">
        <Link href="/" className="text-sm font-semibold text-green-700 hover:text-green-800">
          Convoca
        </Link>

        <h1 className="mt-5 text-3xl font-bold tracking-normal">Excluir conta e dados</h1>
        <p className="mt-2 text-sm text-slate-500">Ultima atualizacao: 10 de junho de 2026</p>

        <section className="mt-8 space-y-4 leading-7 text-slate-700">
          <p>
            Voce pode solicitar a exclusao da sua conta Convoca e dos dados pessoais associados. A
            solicitacao deve ser enviada pelo mesmo email usado no cadastro para que possamos validar
            a titularidade da conta.
          </p>

          <h2 className="pt-4 text-xl font-semibold text-slate-900">Como solicitar</h2>
          <p>
            Clique no botao abaixo para abrir um email pre-preenchido ou envie manualmente uma
            mensagem para{" "}
            <a className="font-semibold text-green-700" href={`mailto:${SUPPORT_EMAIL}`}>
              {SUPPORT_EMAIL}
            </a>
            .
          </p>

          <a
            className="inline-flex h-11 items-center justify-center rounded-md bg-green-700 px-5 text-sm font-semibold text-white hover:bg-green-800"
            href={`mailto:${SUPPORT_EMAIL}?subject=${subject}&body=${body}`}
          >
            Solicitar exclusao por email
          </a>

          <h2 className="pt-4 text-xl font-semibold text-slate-900">Dados excluidos</h2>
          <p>
            Quando a solicitacao for validada, removeremos ou anonimizaremos dados pessoais da conta,
            como nome, email, foto, tokens de notificacao e demais dados vinculados diretamente ao
            usuario, conforme aplicavel.
          </p>

          <h2 className="pt-4 text-xl font-semibold text-slate-900">Dados que podem ser mantidos</h2>
          <p>
            Podemos reter informacoes necessarias para obrigacoes legais, seguranca, prevencao de
            fraude, auditoria, registros financeiros e historicos essenciais dos grupos ou eventos em
            que outros usuarios tambem participam.
          </p>

          <h2 className="pt-4 text-xl font-semibold text-slate-900">Prazo</h2>
          <p>
            As solicitacoes serao analisadas e respondidas em prazo razoavel, conforme a legislacao
            aplicavel e a complexidade da verificacao de identidade e dos dados envolvidos.
          </p>
        </section>
      </article>
    </main>
  );
}
