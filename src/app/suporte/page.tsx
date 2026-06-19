import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Suporte - Convoca",
  description: "Canais de suporte do Convoca.",
};

const SUPPORT_EMAIL = "suporte@convoca.app";

export default function SupportPage() {
  return (
    <main className="min-h-screen bg-slate-50 px-5 py-10 text-slate-900">
      <article className="mx-auto max-w-3xl rounded-lg border border-slate-200 bg-white p-6 shadow-sm md:p-10">
        <Link href="/" className="text-sm font-semibold text-green-700 hover:text-green-800">
          Convoca
        </Link>

        <h1 className="mt-5 text-3xl font-bold tracking-normal">Suporte</h1>
        <p className="mt-4 leading-7 text-slate-700">
          Precisa de ajuda com sua conta, grupo, evento, cobranca ou privacidade? Entre em contato
          pelo canal abaixo.
        </p>

        <div className="mt-8 rounded-lg border border-slate-200 bg-slate-50 p-5">
          <p className="text-sm font-semibold text-slate-600">Email de suporte</p>
          <a className="mt-1 inline-flex font-semibold text-green-700" href={`mailto:${SUPPORT_EMAIL}`}>
            {SUPPORT_EMAIL}
          </a>
        </div>

        <nav className="mt-8 grid gap-3 sm:grid-cols-2">
          <Link className="rounded-lg border border-slate-200 p-4 font-semibold hover:border-green-600" href="/privacidade">
            Politica de Privacidade
          </Link>
          <Link className="rounded-lg border border-slate-200 p-4 font-semibold hover:border-green-600" href="/termos">
            Termos de Uso
          </Link>
          <Link className="rounded-lg border border-slate-200 p-4 font-semibold hover:border-green-600" href="/lgpd">
            Direitos LGPD
          </Link>
          <Link className="rounded-lg border border-slate-200 p-4 font-semibold hover:border-green-600" href="/excluir-conta">
            Excluir conta e dados
          </Link>
        </nav>
      </article>
    </main>
  );
}
