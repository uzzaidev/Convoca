import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Politica de Privacidade - Convoca",
  description: "Politica de privacidade do aplicativo Convoca.",
};

const UPDATED_AT = "10 de junho de 2026";

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-slate-50 px-5 py-10 text-slate-900">
      <article className="mx-auto max-w-3xl rounded-lg border border-slate-200 bg-white p-6 shadow-sm md:p-10">
        <Link href="/" className="text-sm font-semibold text-green-700 hover:text-green-800">
          Convoca
        </Link>

        <h1 className="mt-5 text-3xl font-bold tracking-normal">Politica de Privacidade</h1>
        <p className="mt-2 text-sm text-slate-500">Ultima atualizacao: {UPDATED_AT}</p>

        <section className="mt-8 space-y-4 leading-7 text-slate-700">
          <p>
            O Convoca ajuda grupos esportivos a organizar eventos, confirmar presencas, sortear
            times, registrar estatisticas e acompanhar pagamentos do grupo. Esta politica explica
            quais dados podem ser tratados para oferecer essas funcionalidades.
          </p>

          <h2 className="pt-4 text-xl font-semibold text-slate-900">Dados que coletamos</h2>
          <p>
            Podemos coletar dados de cadastro, como nome, email, senha criptografada e foto de
            perfil; dados de grupos e eventos, como presencas, times, gols, assistencias,
            avaliacoes e rankings; dados financeiros internos do grupo, como cobrancas e despesas;
            e dados tecnicos, como tokens de notificacao push, dispositivo, logs e informacoes de
            seguranca.
          </p>

          <h2 className="pt-4 text-xl font-semibold text-slate-900">Como usamos os dados</h2>
          <p>
            Usamos os dados para autenticar usuarios, operar grupos e eventos, enviar notificacoes,
            manter rankings e historicos, melhorar a experiencia do app, prevenir abuso e cumprir
            obrigacoes legais ou de seguranca.
          </p>

          <h2 className="pt-4 text-xl font-semibold text-slate-900">Permissoes do app</h2>
          <p>
            O app pode solicitar notificacoes para avisos de eventos e confirmacoes; camera e fotos
            para imagens de perfil, grupos ou eventos; e biometria para facilitar acesso seguro
            quando essa funcao estiver habilitada no dispositivo.
          </p>

          <h2 className="pt-4 text-xl font-semibold text-slate-900">Compartilhamento</h2>
          <p>
            Nao vendemos dados pessoais. Podemos compartilhar dados com provedores necessarios para
            operar o servico, como hospedagem, banco de dados, email, notificacoes, analytics,
            pagamentos e infraestrutura de seguranca, sempre conforme a finalidade do app.
          </p>

          <h2 className="pt-4 text-xl font-semibold text-slate-900">Retencao e seguranca</h2>
          <p>
            Mantemos os dados pelo tempo necessario para operar o Convoca, cumprir obrigacoes legais
            e preservar historicos dos grupos. Aplicamos medidas tecnicas e organizacionais para
            proteger as informacoes, mas nenhum sistema conectado a internet e absolutamente imune a
            riscos.
          </p>

          <h2 className="pt-4 text-xl font-semibold text-slate-900">Seus direitos</h2>
          <p>
            Voce pode solicitar acesso, correcao ou exclusao dos seus dados, observadas obrigacoes
            legais e necessidades legitimas de seguranca, auditoria e funcionamento dos grupos.
            Para iniciar uma solicitacao, acesse a pagina{" "}
            <Link className="font-semibold text-green-700" href="/lgpd">
              Direitos LGPD
            </Link>{" "}
            ou{" "}
            <Link className="font-semibold text-green-700" href="/excluir-conta">
              Excluir conta e dados
            </Link>
            .
          </p>

          <h2 className="pt-4 text-xl font-semibold text-slate-900">Contato</h2>
          <p>
            Para duvidas sobre privacidade, entre em contato pelo email{" "}
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
