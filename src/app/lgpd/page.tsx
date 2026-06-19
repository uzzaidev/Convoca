import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "LGPD - Convoca",
  description: "Direitos de privacidade e protecao de dados no Convoca.",
};

const SUPPORT_EMAIL = "suporte@convoca.app";

export default function LgpdPage() {
  return (
    <main className="min-h-screen bg-slate-50 px-5 py-10 text-slate-900">
      <article className="mx-auto max-w-3xl rounded-lg border border-slate-200 bg-white p-6 shadow-sm md:p-10">
        <Link href="/" className="text-sm font-semibold text-green-700 hover:text-green-800">
          Convoca
        </Link>

        <h1 className="mt-5 text-3xl font-bold tracking-normal">Direitos LGPD</h1>
        <p className="mt-2 text-sm text-slate-500">Ultima atualizacao: 10 de junho de 2026</p>

        <section className="mt-8 space-y-4 leading-7 text-slate-700">
          <p>
            Esta pagina centraliza solicitacoes relacionadas a Lei Geral de Protecao de Dados
            Pessoais (LGPD). Voce pode solicitar informacoes sobre seus dados, correcao,
            portabilidade, revogacao de consentimento, oposicao ao tratamento ou exclusao, conforme
            aplicavel.
          </p>

          <h2 className="pt-4 text-xl font-semibold text-slate-900">Como solicitar</h2>
          <p>
            Envie um email para{" "}
            <a className="font-semibold text-green-700" href={`mailto:${SUPPORT_EMAIL}`}>
              {SUPPORT_EMAIL}
            </a>{" "}
            usando o mesmo email cadastrado no Convoca. Inclua o tipo de solicitacao e, se possivel,
            o nome do grupo relacionado.
          </p>

          <h2 className="pt-4 text-xl font-semibold text-slate-900">Solicitacoes comuns</h2>
          <ul className="list-disc space-y-2 pl-6">
            <li>Confirmar se tratamos dados pessoais seus.</li>
            <li>Acessar uma copia dos dados associados a sua conta.</li>
            <li>Corrigir dados incorretos ou desatualizados.</li>
            <li>Solicitar exclusao da conta e dados associados.</li>
            <li>Solicitar informacoes sobre compartilhamento com provedores.</li>
          </ul>

          <h2 className="pt-4 text-xl font-semibold text-slate-900">Retencao</h2>
          <p>
            Algumas informacoes podem ser mantidas por prazo adicional quando houver obrigacao legal,
            necessidade de seguranca, prevencao de fraude, auditoria ou preservacao de registros
            essenciais de grupos e eventos.
          </p>

          <h2 className="pt-4 text-xl font-semibold text-slate-900">Exclusao de conta</h2>
          <p>
            Para excluir sua conta, acesse a pagina{" "}
            <Link className="font-semibold text-green-700" href="/excluir-conta">
              Excluir conta e dados
            </Link>
            .
          </p>
        </section>
      </article>
    </main>
  );
}
