import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "LGPD - Convoca",
  description:
    "Direitos de privacidade e protecao de dados no Convoca — Lei n. 13.709/2018.",
};

export default function LgpdPage() {
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
          Direitos LGPD
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Lei Geral de Protecao de Dados Pessoais — Lei n&ordm; 13.709/2018
        </p>

        <section className="mt-8 space-y-4 leading-7 text-slate-700">
          <p>
            A LGPD garante a voce, como titular de dados pessoais, os seguintes
            direitos (Art. 18). Voce pode exerce-los a qualquer momento
            mediante solicitacao a{" "}
            <a
              className="font-semibold text-green-700"
              href="mailto:juridico@uzzai.com.br"
            >
              juridico@uzzai.com.br
            </a>
            .
          </p>

          <h2 className="pt-4 text-xl font-semibold text-slate-900">
            Seus direitos como titular
          </h2>
          <ol className="list-decimal space-y-3 pl-6">
            <li>
              <strong>Confirmacao de tratamento</strong> — confirmar se a Uzz.Ai
              trata seus dados pessoais.
            </li>
            <li>
              <strong>Acesso aos dados</strong> — obter uma copia dos dados
              pessoais que tratamos sobre voce.
            </li>
            <li>
              <strong>Correcao</strong> — solicitar a correcao de dados
              incompletos, inexatos ou desatualizados.
            </li>
            <li>
              <strong>Anonimizacao, bloqueio ou eliminacao</strong> — para dados
              desnecessarios, excessivos ou tratados em desconformidade com a
              LGPD.
            </li>
            <li>
              <strong>Portabilidade</strong> — receber os dados em formato
              estruturado e interoperavel.
            </li>
            <li>
              <strong>Eliminacao por consentimento</strong> — solicitar a
              exclusao dos dados tratados com base no seu consentimento.
            </li>
            <li>
              <strong>Informacao sobre compartilhamento</strong> — saber com
              quais entidades os dados sao compartilhados.
            </li>
            <li>
              <strong>Recusa ao consentimento</strong> — ser informado sobre a
              possibilidade de nao fornecer consentimento e as consequencias.
            </li>
            <li>
              <strong>Revogacao do consentimento</strong> — retirar o
              consentimento dado anteriormente, a qualquer momento.
            </li>
            <li>
              <strong>Peticao a ANPD</strong> — peticionar em relacao aos seus
              dados perante a Autoridade Nacional de Protecao de Dados.
            </li>
          </ol>

          <h2 className="pt-4 text-xl font-semibold text-slate-900">
            Como solicitar
          </h2>
          <p>
            Envie um e-mail para{" "}
            <a
              className="font-semibold text-green-700"
              href="mailto:juridico@uzzai.com.br"
            >
              juridico@uzzai.com.br
            </a>{" "}
            usando o mesmo e-mail cadastrado no Convoca. Inclua: seu nome
            completo, CPF (para validacao de identidade), o tipo de solicitacao
            e, se possivel, o nome do grupo relacionado.
          </p>

          <div className="rounded-lg border border-green-200 bg-green-50 p-4">
            <p className="text-sm font-semibold text-green-800">
              Prazo de resposta: ate 15 (quinze) dias uteis, conforme previsto no
              Art. 18 da LGPD.
            </p>
          </div>

          <h2 className="pt-4 text-xl font-semibold text-slate-900">
            Retencao de dados
          </h2>
          <p>Algumas informacoes podem ser mantidas apos a exclusao da conta:</p>
          <ul className="list-disc space-y-2 pl-6">
            <li>Dados de conta: 5 anos apos o encerramento.</li>
            <li>
              Logs de acesso: 6 meses (Art. 15, Marco Civil da Internet).
            </li>
            <li>Dados de pagamento: 5 anos (obrigacao fiscal).</li>
            <li>
              Dados do grupo e eventos: disponiveis por 30 dias para exportacao,
              depois excluidos.
            </li>
          </ul>

          <h2 className="pt-4 text-xl font-semibold text-slate-900">
            Exclusao de conta
          </h2>
          <p>
            Para excluir sua conta e dados pessoais, acesse a pagina{" "}
            <Link
              className="font-semibold text-green-700"
              href="/excluir-conta"
            >
              Excluir conta e dados
            </Link>
            .
          </p>

          <h2 className="pt-4 text-xl font-semibold text-slate-900">
            Canais de contato
          </h2>
          <ul className="list-disc space-y-2 pl-6">
            <li>
              Juridico e privacidade:{" "}
              <a
                className="font-semibold text-green-700"
                href="mailto:juridico@uzzai.com.br"
              >
                juridico@uzzai.com.br
              </a>
            </li>
            <li>
              Contato geral:{" "}
              <a
                className="font-semibold text-green-700"
                href="mailto:contato@uzzai.com.br"
              >
                contato@uzzai.com.br
              </a>
            </li>
            <li>
              WhatsApp:{" "}
              <a
                className="font-semibold text-green-700"
                href="https://wa.me/5554992841942"
              >
                +55 (54) 99284-1942
              </a>
            </li>
            <li>
              Endereco: Av. Julio de Castilhos, 1.989, Sala L, Centro — Caxias
              do Sul/RS — CEP 95.020-485
            </li>
          </ul>
          <p className="pt-2">
            Caso nao obtenha resposta satisfatoria, peticione diretamente a ANPD
            em{" "}
            <a
              className="font-semibold text-green-700"
              href="https://www.gov.br/anpd"
              target="_blank"
              rel="noopener noreferrer"
            >
              www.gov.br/anpd
            </a>
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
