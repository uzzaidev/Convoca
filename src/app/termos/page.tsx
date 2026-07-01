import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Termos de Uso - Convoca",
  description: "Termos de uso do aplicativo Convoca, operado pela Uzz.Ai Ltda.",
};

const UPDATED_AT = "22 de junho de 2026";

export default function TermsPage() {
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
          Termos de Uso
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Ultima atualizacao: {UPDATED_AT}
        </p>
        <p className="mt-1 text-sm text-slate-500">
          Uzz.Ai Ltda &middot; CNPJ 64.025.866/0001-30
        </p>

        <section className="mt-8 space-y-4 leading-7 text-slate-700">
          <h2 className="pt-4 text-xl font-semibold text-slate-900">
            1. Identificacao
          </h2>
          <p>
            <strong>CONTRATADA:</strong> Uzz.Ai Ltda, inscrita no CNPJ sob o
            n&ordm; 64.025.866/0001-30, com sede na Av. Julio de Castilhos,
            1.989, Sala L, Centro, Caxias do Sul/RS, CEP 95.020-485. Contato:
            contato@uzzai.com.br &middot; juridico@uzzai.com.br
          </p>
          <p>
            <strong>CONTRATANTE:</strong> pessoa fisica ou juridica que realiza o
            cadastro, cria um Grupo no Convoca e aceita estes Termos, assumindo o
            papel de organizador responsavel pelo Grupo.
          </p>

          <h2 className="pt-4 text-xl font-semibold text-slate-900">
            2. Objeto
          </h2>
          <p>
            Estes Termos regulam o acesso e o uso da plataforma Convoca em regime
            de Software como Servico (SaaS). O Convoca oferece: criacao e gestao
            de grupos e eventos esportivos; sistema RSVP com lista de espera
            automatica; sorteio de times; registro de gols, assistencias e
            estatisticas; rankings e votacao de MVP; controle financeiro do grupo
            (cobrancas, despesas, mensalidades); notificacoes push e convites por
            link.
          </p>

          <h2 className="pt-4 text-xl font-semibold text-slate-900">
            3. Cadastro e conta
          </h2>
          <p>
            O acesso a plataforma exige a criacao de uma conta com informacoes
            verdadeiras, completas e atualizadas. O contratante e integralmente
            responsavel pela guarda e confidencialidade das credenciais de
            acesso. Toda atividade realizada sob a conta e de sua
            responsabilidade.
          </p>

          <h2 className="pt-4 text-xl font-semibold text-slate-900">
            4. Licenca de uso
          </h2>
          <p>
            A Uzz.Ai concede uma licenca de uso nao exclusiva, intransferivel,
            revogavel e limitada para acessar e utilizar a plataforma durante a
            vigencia do plano contratado. A licenca nao implica transferencia de
            propriedade, cessao ou acesso ao codigo-fonte, algoritmos ou modelos
            de IA. A plataforma e licenciada, nao vendida.
          </p>

          <h2 className="pt-4 text-xl font-semibold text-slate-900">
            5. Uso aceitavel e vedacoes
          </h2>
          <p>
            O contratante compromete-se a utilizar a plataforma exclusivamente
            para fins licitos. Sao expressamente vedados: criar grupos ou eventos
            com finalidade distinta da organizacao esportiva; inserir informacoes
            falsas; realizar engenharia reversa; revender ou sublicenciar o
            acesso; usar robos ou scrapers; inserir dados de membros sem
            consentimento ou base legal (LGPD).
          </p>

          <h2 className="pt-4 text-xl font-semibold text-slate-900">
            6. Responsabilidades sobre os membros
          </h2>
          <p>
            O contratante e responsavel pelo grupo e por todos os membros nele
            incluidos. Ao convidar um membro, declara ter obtido o consentimento
            para o compartilhamento de dados na plataforma. Eventuais conflitos
            entre contratante e membros sao de responsabilidade exclusiva das
            partes envolvidas.
          </p>

          <h2 className="pt-4 text-xl font-semibold text-slate-900">
            7. Propriedade intelectual
          </h2>
          <p>
            A plataforma, incluindo seu codigo-fonte, algoritmos, modelos de IA,
            interfaces, marcas e logotipos, e de propriedade exclusiva da Uzz.Ai
            ou de seus licenciadores. Os dados inseridos pelo contratante e pelos
            membros permanecem de propriedade de seus respectivos titulares.
          </p>

          <h2 className="pt-4 text-xl font-semibold text-slate-900">
            8. Protecao de dados pessoais
          </h2>
          <p>
            O tratamento de dados pessoais observa a Lei n&ordm; 13.709/2018
            (LGPD). A Uzz.Ai atua como Operadora dos dados dos membros,
            processando-os conforme as instrucoes do contratante. O contratante
            atua como Controlador dos dados dos membros de seu grupo. Informacoes
            completas estao na{" "}
            <Link
              className="font-semibold text-green-700"
              href="/privacidade"
            >
              Politica de Privacidade
            </Link>
            .
          </p>

          <h2 className="pt-4 text-xl font-semibold text-slate-900">
            9. Disponibilidade e suporte
          </h2>
          <p>
            A Uzz.Ai envida seus melhores esforcos para manter a plataforma
            disponivel. Manutencoes programadas serao comunicadas com antecedencia
            minima de 48 horas. A Uzz.Ai nao garante disponibilidade
            ininterrupta em razao de fatores fora de seu controle, incluindo
            falhas de infraestrutura de terceiros (Neon PostgreSQL, Vercel),
            casos fortuitos e forca maior.
          </p>

          <h2 className="pt-4 text-xl font-semibold text-slate-900">
            10. Suspensao e encerramento
          </h2>
          <p>
            O acesso pode ser suspenso apos 15 dias de inadimplencia (com
            notificacao de 48h). Em caso de violacao grave, a suspensao pode ser
            imediata. O contratante pode encerrar o contrato a qualquer momento.
            Apos o encerramento, os dados ficam disponiveis para exportacao por
            30 dias; apos esse prazo, sao permanentemente excluidos.
          </p>

          <h2 className="pt-4 text-xl font-semibold text-slate-900">
            11. Direito de arrependimento / Right of Withdrawal / Widerrufsrecht
          </h2>
          <p>
            <strong>Brasil:</strong> O contratante pessoa fisica tem direito de
            arrependimento nos termos do Art. 49 do Codigo de Defesa do
            Consumidor, podendo desistir da contratacao no prazo de{" "}
            <strong>7 dias corridos</strong> contados do aceite, sem custo ou
            penalidade.
          </p>
          <p className="mt-2">
            <strong>Uniao Europeia (incluindo Alemanha e Portugal):</strong>{" "}
            Consumidores na UE tem direito de rescisao no prazo de{" "}
            <strong>14 dias corridos</strong> a contar da celebracao do contrato,
            sem necessidade de justificativa, nos termos da Diretiva UE
            2011/83/UE (Consumer Rights Directive) e do{" "}
            <em>Burgerliches Gesetzbuch</em> §§ 355–356 (Alemanha). O direito
            de arrependimento pode ser extinto antes do prazo se o servico for
            totalmente prestado com consentimento expresso do consumidor.
          </p>
          <p className="mt-2">
            <strong>Australia:</strong> Consumidores australianos tem direitos
            garantidos pela Australian Consumer Law (Competition and Consumer
            Act 2010, Schedule 2), incluindo garantias de que o servico e
            prestado com cuidado e habilidade razoaveis.
          </p>
          <p className="mt-2">
            Para exercer o direito de arrependimento em qualquer jurisdicao,
            manifeste sua intencao por escrito em{" "}
            <a
              className="font-semibold text-green-700"
              href="mailto:contato@uzzai.com.br"
            >
              contato@uzzai.com.br
            </a>
            .
          </p>

          <h2 className="pt-4 text-xl font-semibold text-slate-900">
            12. Limitacao de responsabilidade
          </h2>
          <p>
            A Uzz.Ai nao responde por: danos indiretos, lucros cessantes ou
            perda de dados; conflitos entre contratante e membros sobre sorteios,
            pagamentos ou estatisticas; decisoes baseadas em dados ou rankings
            gerados pela plataforma; danos causados pelo uso inadequado da
            plataforma. A responsabilidade total da Uzz.Ai fica limitada ao valor
            efetivamente pago nos 12 meses anteriores ao evento.
          </p>

          <h2 className="pt-4 text-xl font-semibold text-slate-900">
            13. Alteracoes destes termos
          </h2>
          <p>
            A Uzz.Ai pode alterar estes termos a qualquer tempo. Alteracoes
            relevantes serao comunicadas com antecedencia minima de 15 dias. O
            uso continuado da plataforma implica aceitacao das alteracoes.
          </p>

          <h2 className="pt-4 text-xl font-semibold text-slate-900">
            14. Lei aplicavel e foro
          </h2>
          <p>
            <strong>Regra geral:</strong> Estes Termos sao regidos pelas leis
            da Republica Federativa do Brasil. Fica eleito o Foro da Comarca de
            Caxias do Sul/RS para dirimir quaisquer litigios.
          </p>
          <p className="mt-2">
            <strong>Consumidores na Uniao Europeia:</strong> Sem prejuizo da
            escolha de foro acima, consumidores na UE podem invocar as normas
            imperativas de protecao ao consumidor de seu pais de residencia,
            conforme Art. 6(2) do Regulamento Roma I (CE 593/2008). A plataforma
            de resolucao de litigios online da Comissao Europeia esta disponivel
            em{" "}
            <a
              className="font-semibold text-green-700"
              href="https://ec.europa.eu/consumers/odr"
              target="_blank"
              rel="noopener noreferrer"
            >
              ec.europa.eu/consumers/odr
            </a>
            .
          </p>
          <p className="mt-2">
            <strong>Consumidores na Australia:</strong> Nada nestes Termos
            exclui, restringe ou modifica direitos que nao podem ser excluidos
            sob a Australian Consumer Law.
          </p>

          <h2 className="pt-4 text-xl font-semibold text-slate-900">
            15. Contato
          </h2>
          <ul className="list-disc space-y-2 pl-6">
            <li>
              Geral:{" "}
              <a
                className="font-semibold text-green-700"
                href="mailto:contato@uzzai.com.br"
              >
                contato@uzzai.com.br
              </a>
            </li>
            <li>
              Juridico e protecao de dados:{" "}
              <a
                className="font-semibold text-green-700"
                href="mailto:juridico@uzzai.com.br"
              >
                juridico@uzzai.com.br
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
          </ul>
        </section>

        <footer className="mt-10 border-t border-slate-200 pt-6 text-xs text-slate-400">
          <p>Uzz.Ai Ltda — CNPJ 64.025.866/0001-30</p>
          <p>
            Av. Julio de Castilhos, 1.989, Sala L, Centro — Caxias do Sul/RS —
            CEP 95.020-485
          </p>
          <p>Versao 1.0 — {UPDATED_AT}</p>
        </footer>
      </article>
    </main>
  );
}
