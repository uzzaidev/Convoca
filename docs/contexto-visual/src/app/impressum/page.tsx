import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Impressum - Convoca",
  description: "Anbieterkennzeichnung gemäß § 5 TMG — Convoca, betrieben von Uzz.Ai Ltda.",
};

export default function ImpressumPage() {
  return (
    <main className="min-h-screen bg-slate-50 px-5 py-10 text-slate-900">
      <article className="mx-auto max-w-3xl rounded-lg border border-slate-200 bg-white p-6 shadow-sm md:p-10">
        <Link
          href="/"
          className="text-sm font-semibold text-green-700 hover:text-green-800"
        >
          Convoca
        </Link>

        <h1 className="mt-5 text-3xl font-bold tracking-normal">Impressum</h1>
        <p className="mt-2 text-sm text-slate-500">
          Anbieterkennzeichnung gemäß § 5 TMG (Telemediengesetz)
        </p>

        <section className="mt-8 space-y-6 leading-7 text-slate-700">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">
              Unternehmensangaben / Company Information
            </h2>
            <div className="mt-3 space-y-1">
              <p><strong>Uzz.Ai Ltda</strong></p>
              <p>Av. Julio de Castilhos, 1.989, Sala L</p>
              <p>Centro, Caxias do Sul / RS</p>
              <p>CEP 95.020-485, Brasilien / Brazil</p>
              <p className="mt-2">
                CNPJ (Unternehmensregisternummer / Company Registration No.):{" "}
                <strong>64.025.866/0001-30</strong>
              </p>
            </div>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-slate-900">
              Vertretungsberechtigte Person / Legal Representative
            </h2>
            <p className="mt-3">Pedro Vitor Pagliarin</p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-slate-900">
              Kontakt / Contact
            </h2>
            <ul className="mt-3 space-y-2">
              <li>
                E-Mail (Allgemein / General):{" "}
                <a
                  className="font-semibold text-green-700"
                  href="mailto:contato@uzzai.com.br"
                >
                  contato@uzzai.com.br
                </a>
              </li>
              <li>
                E-Mail (Recht / Legal &amp; Datenschutz / Privacy):{" "}
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
          </div>

          <div>
            <h2 className="text-xl font-semibold text-slate-900">
              Datenschutzbeauftragter / Data Protection
            </h2>
            <p className="mt-3">
              Für Datenschutzanfragen von Nutzern in der Europäischen Union
              wenden Sie sich bitte an:{" "}
              <a
                className="font-semibold text-green-700"
                href="mailto:juridico@uzzai.com.br"
              >
                juridico@uzzai.com.br
              </a>
              . Antwortzeit: bis zu 15 Werktage.
            </p>
            <p className="mt-2">
              For data protection requests from European Union users, please
              contact:{" "}
              <a
                className="font-semibold text-green-700"
                href="mailto:juridico@uzzai.com.br"
              >
                juridico@uzzai.com.br
              </a>
              . Response time: up to 15 business days.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-slate-900">
              Hinweis / Notice
            </h2>
            <p className="mt-3">
              Der Convoca-Dienst wird von einem brasilianischen Unternehmen
              betrieben. Für Nutzer in der Europäischen Union gilt die
              Datenschutz-Grundverordnung (DSGVO / GDPR). Weitere Informationen
              finden Sie in unserer{" "}
              <Link className="font-semibold text-green-700" href="/privacidade">
                Datenschutzerklärung (Privacy Policy)
              </Link>{" "}
              und den{" "}
              <Link className="font-semibold text-green-700" href="/termos">
                Nutzungsbedingungen (Terms of Use)
              </Link>
              .
            </p>
            <p className="mt-3">
              The Convoca service is operated by a Brazilian company. For users
              in the European Union, the General Data Protection Regulation
              (GDPR) applies. See our{" "}
              <Link className="font-semibold text-green-700" href="/privacidade">
                Privacy Policy
              </Link>{" "}
              and{" "}
              <Link className="font-semibold text-green-700" href="/termos">
                Terms of Use
              </Link>{" "}
              for details.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-slate-900">
              Aufsichtsbehörde / Supervisory Authority (EU)
            </h2>
            <p className="mt-3">
              EU-Nutzer können sich bei Datenschutzbeschwerden an die zuständige
              nationale Aufsichtsbehörde wenden. In Deutschland:{" "}
              <a
                className="font-semibold text-green-700"
                href="https://www.bfdi.bund.de"
                target="_blank"
                rel="noopener noreferrer"
              >
                Bundesbeauftragter für den Datenschutz (BfDI) — www.bfdi.bund.de
              </a>
              .
            </p>
            <p className="mt-2">
              EU users may lodge complaints with their national data protection
              supervisory authority. In Germany:{" "}
              <a
                className="font-semibold text-green-700"
                href="https://www.bfdi.bund.de"
                target="_blank"
                rel="noopener noreferrer"
              >
                BfDI — www.bfdi.bund.de
              </a>
              .
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-slate-900">
              Streitschlichtung / Dispute Resolution
            </h2>
            <p className="mt-3">
              Die Europäische Kommission stellt eine Plattform zur
              Online-Streitbeilegung (OS) bereit:{" "}
              <a
                className="font-semibold text-green-700"
                href="https://ec.europa.eu/consumers/odr"
                target="_blank"
                rel="noopener noreferrer"
              >
                https://ec.europa.eu/consumers/odr
              </a>
              . Wir sind nicht verpflichtet und nicht bereit, an einem
              Streitbeilegungsverfahren vor einer
              Verbraucherschlichtungsstelle teilzunehmen.
            </p>
          </div>
        </section>

        <footer className="mt-10 border-t border-slate-200 pt-6 text-xs text-slate-400">
          <p>Uzz.Ai Ltda — CNPJ 64.025.866/0001-30</p>
          <p>
            Av. Julio de Castilhos, 1.989, Sala L, Centro — Caxias do Sul/RS —
            CEP 95.020-485 — Brasil
          </p>
        </footer>
      </article>
    </main>
  );
}
