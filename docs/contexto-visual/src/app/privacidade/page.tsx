import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Politica de Privacidade - Convoca",
  description:
    "Politica de privacidade e protecao de dados do Convoca, operado pela Uzz.Ai Ltda.",
};

const UPDATED_AT = "22 de junho de 2026";

export default function PrivacyPage() {
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
          Politica de Privacidade e Protecao de Dados
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Ultima atualizacao: {UPDATED_AT}
        </p>
        <p className="mt-1 text-sm text-slate-500">
          Uzz.Ai Ltda &middot; CNPJ 64.025.866/0001-30
        </p>

        <section className="mt-8 space-y-4 leading-7 text-slate-700">
          <h2 className="pt-4 text-xl font-semibold text-slate-900">
            1. Identificacao do Controlador
          </h2>
          <p>
            <strong>Uzz.Ai Ltda</strong>, inscrita no CNPJ sob o n&ordm;
            64.025.866/0001-30, com sede na Av. Julio de Castilhos, 1.989, Sala
            L, Centro, Caxias do Sul/RS, CEP 95.020-485, e a Controladora dos
            dados pessoais tratados no ambito do Convoca.
          </p>

          <h2 className="pt-4 text-xl font-semibold text-slate-900">
            2. Dados que coletamos
          </h2>
          <p>
            <strong>Dados fornecidos diretamente:</strong> nome completo,
            endereco de e-mail, numero de telefone, dados da empresa (razao
            social, CNPJ) para contratantes pessoa juridica e informacoes de
            pagamento (processadas por suboperadores — a Uzz.Ai nao armazena
            dados de cartao de credito).
          </p>
          <p>
            <strong>Dados coletados automaticamente:</strong> endereco IP, tipo e
            versao do navegador (user-agent), idioma do dispositivo, paginas
            acessadas e tempo de navegacao, logs de acesso e erros,
            identificadores de sessao.
          </p>
          <p>
            <strong>Dados especificos do Convoca:</strong> dados do organizador
            (nome, e-mail, telefone, dados de faturamento); dados dos membros
            (nome, posicao preferida, rating, historico de participacao em
            eventos); dados dos eventos (data, hora, local, valor por pessoa,
            lista de confirmados); estatisticas e rankings (gols, assistencias,
            MVPs, frequencia, pontuacao por temporada); metadados tecnicos (IP,
            user-agent, idioma, timestamps).
          </p>
          <p>
            A Uzz.Ai nao coleta dados pessoais sensiveis diretamente.
          </p>

          <h2 className="pt-4 text-xl font-semibold text-slate-900">
            3. Bases legais
          </h2>
          <p>
            O tratamento de dados pessoais pela Uzz.Ai fundamenta-se nas
            seguintes bases legais, aplicadas conforme a legislacao de cada
            jurisdicao:
          </p>
          <p className="font-medium">Brasil — LGPD (Lei n&ordm; 13.709/2018):</p>
          <ul className="list-disc space-y-2 pl-6">
            <li>
              <strong>Execucao de contrato</strong> (Art. 7&ordm;, V) — dados
              necessarios a prestacao dos servicos contratados.
            </li>
            <li>
              <strong>Legitimo interesse</strong> (Art. 7&ordm;, IX) —
              seguranca da plataforma, prevencao de fraudes, melhoria dos
              servicos.
            </li>
            <li>
              <strong>Consentimento</strong> (Art. 7&ordm;, I) — comunicacoes
              de marketing (opt-in).
            </li>
            <li>
              <strong>Cumprimento de obrigacao legal</strong> (Art. 7&ordm;, II)
              — obrigacoes fiscais, contabeis e regulatorias.
            </li>
          </ul>
          <p className="mt-3 font-medium">
            Uniao Europeia — GDPR (Regulamento UE 2016/679):
          </p>
          <ul className="list-disc space-y-2 pl-6">
            <li>
              <strong>Execucao de contrato</strong> (Art. 6(1)(b)) — tratamento
              necessario para prestar o servico.
            </li>
            <li>
              <strong>Interesses legitimos</strong> (Art. 6(1)(f)) — seguranca,
              prevencao de fraudes e melhoria do servico.
            </li>
            <li>
              <strong>Consentimento</strong> (Art. 6(1)(a)) — marketing (opt-in,
              revogavel a qualquer momento).
            </li>
            <li>
              <strong>Obrigacao legal</strong> (Art. 6(1)(c)) — cumprimento de
              obrigacoes legais aplicaveis.
            </li>
          </ul>
          <p className="mt-3 font-medium">
            Australia — Privacy Act 1988 (Australian Privacy Principles):
          </p>
          <ul className="list-disc space-y-2 pl-6">
            <li>
              A Uzz.Ai trata dados de usuarios australianos em conformidade com
              as 13 Australian Privacy Principles (APPs) do Privacy Act 1988.
              Usuarios australianos podem peticionar ao{" "}
              <a
                className="font-semibold text-green-700"
                href="https://www.oaic.gov.au"
                target="_blank"
                rel="noopener noreferrer"
              >
                Office of the Australian Information Commissioner (OAIC)
              </a>{" "}
              em caso de nao resolucao de reclamacao.
            </li>
          </ul>

          <h2 className="pt-4 text-xl font-semibold text-slate-900">
            4. Como usamos os dados
          </h2>
          <p>
            Usamos os dados para: criacao e gerenciamento de contas; execucao das
            funcionalidades do Convoca; processamento de pagamentos; suporte
            tecnico; notificacoes sobre o servico; prevencao de fraudes e acessos
            nao autorizados; analise de uso agregado e anonimizado para
            aprimoramento da plataforma.
          </p>
          <p>
            A Uzz.Ai nao utiliza dados pessoais dos titulares para treinamento de
            modelos de IA de terceiros sem autorizacao previa e expressa.
          </p>

          <h2 className="pt-4 text-xl font-semibold text-slate-900">
            5. Compartilhamento de dados
          </h2>
          <p>
            A Uzz.Ai <strong>nao vende, aluga nem comercializa</strong> dados
            pessoais. Os dados podem ser compartilhados com:
          </p>
          <ul className="list-disc space-y-2 pl-6">
            <li>
              <strong>Suboperadores contratados</strong> para execucao dos
              servicos (Neon Inc. — banco de dados PostgreSQL, AWS Sao Paulo;
              Vercel Inc. — hospedagem e CDN; Auth.js/NextAuth v5 —
              autenticacao).
            </li>
            <li>
              <strong>Autoridades publicas</strong> quando exigido por lei, ordem
              judicial ou regulamentacao aplicavel.
            </li>
            <li>
              <strong>Sucessores societarios</strong> em caso de fusao,
              aquisicao ou reestruturacao, mantidos os mesmos niveis de protecao.
            </li>
          </ul>
          <p>
            Transferencias internacionais de dados (para servidores fora do
            Brasil) sao realizadas com base nas salvaguardas adequadas previstas
            no Art. 33 da LGPD.
          </p>

          <h2 className="pt-4 text-xl font-semibold text-slate-900">
            6. Retencao de dados
          </h2>
          <ul className="list-disc space-y-2 pl-6">
            <li>Dados de conta (cadastro): 5 anos apos o encerramento.</li>
            <li>
              Logs de acesso: 6 meses (conforme Art. 15 do Marco Civil da
              Internet).
            </li>
            <li>
              Dados de pagamento: 5 anos (obrigacao fiscal — Lei n&ordm;
              9.430/1996).
            </li>
            <li>
              Dados do grupo e eventos: disponiveis para exportacao por 30 dias
              apos o encerramento da conta, depois excluidos.
            </li>
            <li>
              Dados de marketing (opt-in): ate revogacao do consentimento pelo
              titular.
            </li>
          </ul>

          <h2 className="pt-4 text-xl font-semibold text-slate-900">
            7. Seguranca dos dados
          </h2>
          <p>
            A Uzz.Ai adota medidas tecnicas e organizacionais para protecao dos
            dados pessoais, incluindo: criptografia em transito (TLS);
            criptografia em repouso (AES-256); controle de acesso baseado em
            funcoes (RBAC); backups periodicos com testes de restauracao;
            monitoramento de seguranca e alertas de anomalias. Nenhuma medida de
            seguranca e absolutamente infalivel.
          </p>

          <h2 className="pt-4 text-xl font-semibold text-slate-900">
            7b. Transferencias internacionais de dados
          </h2>
          <p>
            Os dados sao armazenados em servidores nos EUA (Neon Inc., Vercel
            Inc.). Para usuarios da Uniao Europeia, essas transferencias sao
            realizadas com base nas{" "}
            <strong>Clausulas Contratuais Padrao</strong> (Standard Contractual
            Clauses — SCC) adotadas pela Comissao Europeia, conforme Art. 46(2)
            do GDPR. Para usuarios australianos, aplicam-se os requisitos do
            APP 8 (cross-border disclosure).
          </p>

          <h2 className="pt-4 text-xl font-semibold text-slate-900">
            8. Direitos dos titulares (LGPD — Art. 18)
          </h2>
          <p>
            O titular dos dados pessoais pode, a qualquer momento, solicitar:
            confirmacao e acesso; correcao; anonimizacao, bloqueio ou eliminacao;
            portabilidade; eliminacao de dados tratados com base em
            consentimento; informacao sobre compartilhamento; revogacao do
            consentimento; revisao de decisoes automatizadas; e peticao a ANPD.
          </p>
          <p>
            <strong>Prazo de resposta:</strong> ate{" "}
            <strong>15 (quinze) dias uteis</strong> a contar do recebimento da
            solicitacao.
          </p>
          <p>
            Para exercer seus direitos, acesse{" "}
            <Link
              className="font-semibold text-green-700"
              href="/lgpd"
            >
              Direitos LGPD
            </Link>{" "}
            ou{" "}
            <Link
              className="font-semibold text-green-700"
              href="/excluir-conta"
            >
              Excluir conta e dados
            </Link>
            .
          </p>

          <h2 className="pt-4 text-xl font-semibold text-slate-900">
            8b. Direitos adicionais — usuarios da Uniao Europeia (GDPR)
          </h2>
          <p>
            Alem dos direitos previstos na LGPD, usuarios na Uniao Europeia tem
            os seguintes direitos sob o GDPR:
          </p>
          <ul className="list-disc space-y-2 pl-6">
            <li>
              <strong>Direito de oposicao</strong> (Art. 21) — opor-se ao
              tratamento baseado em interesses legitimos, incluindo criacao de
              perfis.
            </li>
            <li>
              <strong>Direito a restricao</strong> (Art. 18 GDPR) — solicitar a
              restricao do tratamento em determinadas circunstancias.
            </li>
            <li>
              <strong>Revisao de decisoes automatizadas</strong> (Art. 22) —
              nao ser submetido a decisoes baseadas exclusivamente em
              tratamento automatizado.
            </li>
            <li>
              <strong>Reclamacao a autoridade supervisora</strong> — usuarios
              na Alemanha podem reclamar ao{" "}
              <a
                className="font-semibold text-green-700"
                href="https://www.bfdi.bund.de"
                target="_blank"
                rel="noopener noreferrer"
              >
                BfDI (www.bfdi.bund.de)
              </a>
              ; em Portugal ao{" "}
              <a
                className="font-semibold text-green-700"
                href="https://www.cnpd.pt"
                target="_blank"
                rel="noopener noreferrer"
              >
                CNPD (www.cnpd.pt)
              </a>
              ; em outros paises da UE, a autoridade nacional competente.
            </li>
          </ul>
          <p className="mt-3">
            Tempo de resposta para solicitacoes GDPR: ate{" "}
            <strong>30 (trinta) dias corridos</strong>, prorrogavel por mais 60
            dias em casos complexos (com notificacao ao titular).
          </p>

          <h2 className="pt-4 text-xl font-semibold text-slate-900">
            8c. Direitos adicionais — usuarios australianos (Privacy Act 1988)
          </h2>
          <p>
            Usuarios australianos tem direito de: acessar os dados pessoais que
            mantemos; solicitar correcao de dados inexatos; reclamar sobre o
            tratamento de seus dados. Reclamacoes nao resolvidas podem ser
            encaminhadas ao{" "}
            <a
              className="font-semibold text-green-700"
              href="https://www.oaic.gov.au"
              target="_blank"
              rel="noopener noreferrer"
            >
              Office of the Australian Information Commissioner (OAIC)
            </a>
            .
          </p>

          <h2 className="pt-4 text-xl font-semibold text-slate-900">
            9. Permissoes do app
          </h2>
          <p>
            O app pode solicitar: notificacoes push para avisos de eventos e
            confirmacoes; camera para imagens de perfil, grupos ou eventos;
            biometria para acesso seguro quando habilitado no dispositivo.
          </p>

          <h2 className="pt-4 text-xl font-semibold text-slate-900">
            10. Menores de idade
          </h2>
          <p>
            O Convoca e destinado a pessoas com 18 anos ou mais. Caso o grupo
            inclua membros menores de 18 anos, o organizador e responsavel por
            obter o consentimento dos responsaveis legais antes de inclui-los na
            plataforma.
          </p>

          <h2 className="pt-4 text-xl font-semibold text-slate-900">
            11. Alteracoes desta politica
          </h2>
          <p>
            A Uzz.Ai pode atualizar esta politica a qualquer tempo. Alteracoes
            relevantes serao comunicadas por e-mail e/ou notificacao na
            plataforma com antecedencia minima de 15 dias antes da entrada em
            vigor.
          </p>

          <h2 className="pt-4 text-xl font-semibold text-slate-900">
            12. Contato
          </h2>
          <p>
            Para exercer seus direitos, esclarecer duvidas ou apresentar
            reclamacoes:
          </p>
          <ul className="list-disc space-y-2 pl-6">
            <li>
              E-mail:{" "}
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
            <li>
              Endereco: Av. Julio de Castilhos, 1.989, Sala L, Centro — Caxias
              do Sul/RS — CEP 95.020-485
            </li>
          </ul>
          <p className="pt-2">
            Caso nao obtenha resposta satisfatoria, o titular pode peticionar
            diretamente a ANPD em{" "}
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
          <p>Versao 1.0 — {UPDATED_AT}</p>
        </footer>
      </article>
    </main>
  );
}
