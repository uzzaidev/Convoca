import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Suporte - Convoca",
  description: "Canais de suporte do Convoca, operado pela Uzz.Ai Ltda.",
};

export default function SupportPage() {
  return (
    <main className="min-h-screen bg-slate-50 px-5 py-10 text-slate-900">
      <article className="mx-auto max-w-3xl rounded-lg border border-slate-200 bg-white p-6 shadow-sm md:p-10">
        <Link
          href="/"
          className="text-sm font-semibold text-green-700 hover:text-green-800"
        >
          Convoca
        </Link>

        <h1 className="mt-5 text-3xl font-bold tracking-normal">Suporte</h1>
        <p className="mt-4 leading-7 text-slate-700">
          Precisa de ajuda com sua conta, grupo, evento, cobranca ou
          privacidade? Entre em contato pelos canais abaixo.
        </p>

        <div className="mt-8 space-y-4">
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-5">
            <p className="text-sm font-semibold text-slate-600">
              E-mail de suporte
            </p>
            <a
              className="mt-1 inline-flex font-semibold text-green-700"
              href="mailto:contato@uzzai.com.br"
            >
              contato@uzzai.com.br
            </a>
          </div>

          <div className="rounded-lg border border-slate-200 bg-slate-50 p-5">
            <p className="text-sm font-semibold text-slate-600">
              Juridico e protecao de dados
            </p>
            <a
              className="mt-1 inline-flex font-semibold text-green-700"
              href="mailto:juridico@uzzai.com.br"
            >
              juridico@uzzai.com.br
            </a>
          </div>

          <div className="rounded-lg border border-slate-200 bg-slate-50 p-5">
            <p className="text-sm font-semibold text-slate-600">WhatsApp</p>
            <a
              className="mt-1 inline-flex font-semibold text-green-700"
              href="https://wa.me/5554992841942"
            >
              +55 (54) 99284-1942
            </a>
          </div>
        </div>

        <nav className="mt-8 grid gap-3 sm:grid-cols-2">
          <Link
            className="rounded-lg border border-slate-200 p-4 font-semibold hover:border-green-600"
            href="/privacidade"
          >
            Politica de Privacidade
          </Link>
          <Link
            className="rounded-lg border border-slate-200 p-4 font-semibold hover:border-green-600"
            href="/termos"
          >
            Termos de Uso
          </Link>
          <Link
            className="rounded-lg border border-slate-200 p-4 font-semibold hover:border-green-600"
            href="/lgpd"
          >
            Direitos LGPD
          </Link>
          <Link
            className="rounded-lg border border-slate-200 p-4 font-semibold hover:border-green-600"
            href="/excluir-conta"
          >
            Excluir conta e dados
          </Link>
        </nav>

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
