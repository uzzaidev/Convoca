import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Termos de Uso - Convoca",
  description: "Termos de uso do aplicativo Convoca.",
};

const UPDATED_AT = "10 de junho de 2026";

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-slate-50 px-5 py-10 text-slate-900">
      <article className="mx-auto max-w-3xl rounded-lg border border-slate-200 bg-white p-6 shadow-sm md:p-10">
        <Link href="/" className="text-sm font-semibold text-green-700 hover:text-green-800">
          Convoca
        </Link>

        <h1 className="mt-5 text-3xl font-bold tracking-normal">Termos de Uso</h1>
        <p className="mt-2 text-sm text-slate-500">Ultima atualizacao: {UPDATED_AT}</p>

        <section className="mt-8 space-y-4 leading-7 text-slate-700">
          <p>
            Estes termos regulam o uso do Convoca, uma plataforma para organizacao de grupos
            esportivos, eventos, confirmacoes de presenca, sorteio de times, estatisticas e gestao
            interna de cobrancas.
          </p>

          <h2 className="pt-4 text-xl font-semibold text-slate-900">Uso do servico</h2>
          <p>
            Voce deve usar o Convoca de forma licita, respeitando outros usuarios e as regras dos
            grupos dos quais participa. O administrador de cada grupo e responsavel pela gestao dos
            membros, eventos, configuracoes, cobrancas internas e informacoes publicadas no grupo.
          </p>

          <h2 className="pt-4 text-xl font-semibold text-slate-900">Conta e seguranca</h2>
          <p>
            Voce e responsavel por manter suas credenciais seguras e por atividades realizadas na
            sua conta. Informe qualquer uso nao autorizado assim que identificado.
          </p>

          <h2 className="pt-4 text-xl font-semibold text-slate-900">Conteudo dos grupos</h2>
          <p>
            Dados de eventos, presencas, estatisticas, rankings, fotos e cobrancas sao inseridos por
            usuarios e administradores. O Convoca pode remover conteudos ou restringir contas quando
            houver abuso, violacao destes termos ou risco de seguranca.
          </p>

          <h2 className="pt-4 text-xl font-semibold text-slate-900">Pagamentos e cobrancas</h2>
          <p>
            Funcionalidades de cobranca ajudam grupos a organizar valores, despesas e mensalidades.
            As relacoes financeiras entre membros e administradores sao de responsabilidade do
            proprio grupo, salvo quando houver contratacao direta de planos ou servicos do Convoca.
          </p>

          <h2 className="pt-4 text-xl font-semibold text-slate-900">Disponibilidade</h2>
          <p>
            Trabalhamos para manter o app disponivel, mas o servico pode ter interrupcoes por
            manutencao, atualizacoes, falhas de terceiros, indisponibilidade de rede ou eventos fora
            do nosso controle.
          </p>

          <h2 className="pt-4 text-xl font-semibold text-slate-900">Limitacao de responsabilidade</h2>
          <p>
            O Convoca e uma ferramenta de organizacao. Nao nos responsabilizamos por conflitos entre
            membros, acidentes, resultados esportivos, pagamentos combinados fora da plataforma ou
            decisoes tomadas pelos administradores dos grupos.
          </p>

          <h2 className="pt-4 text-xl font-semibold text-slate-900">Alteracoes</h2>
          <p>
            Estes termos podem ser atualizados para refletir mudancas no app, exigencias legais ou
            melhorias operacionais. A versao vigente sera publicada nesta pagina.
          </p>

          <h2 className="pt-4 text-xl font-semibold text-slate-900">Contato</h2>
          <p>
            Para duvidas sobre estes termos, entre em contato pelo email{" "}
            <a className="font-semibold text-green-700" href="mailto:suporte@convoca.app">
              suporte@convoca.app
            </a>
            .
          </p>
        </section>
      </article>
    </main>
  );
}
