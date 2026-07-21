"use client";

/**
 * Banner de cookies — padrão análogo ao site oficial Uzz.Ai
 * (CookieConsent.tsx): localStorage + Aceitar / Rejeitar + Gerenciar.
 * Sem dependência de next-intl; copy em PT-BR.
 */
import { useEffect, useState } from "react";
import Link from "next/link";

type ConsentState = {
  necessary: true;
  analytics: boolean;
  marketing: boolean;
  timestamp: string;
  version: string;
};

const STORAGE_KEY = "convoca_consent_v1";
const POLICY_VERSION = "2026-07-21";

function readConsent(): ConsentState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as ConsentState) : null;
  } catch {
    return null;
  }
}

function writeConsent(consent: ConsentState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(consent));
  } catch {
    // ignore quota / private mode
  }
}

function updateGtagConsent(consent: ConsentState) {
  if (typeof window === "undefined") return;
  const gtag = (window as Window & { gtag?: (...args: unknown[]) => void }).gtag;
  if (typeof gtag !== "function") return;
  gtag("consent", "update", {
    analytics_storage: consent.analytics ? "granted" : "denied",
    ad_storage: consent.marketing ? "granted" : "denied",
    ad_user_data: consent.marketing ? "granted" : "denied",
    ad_personalization: consent.marketing ? "granted" : "denied",
  });
}

export function CookieConsentBanner() {
  const [visible, setVisible] = useState(false);
  const [hasConsent, setHasConsent] = useState(false);

  useEffect(() => {
    const existing = readConsent();
    if (!existing) {
      const gtag = (window as Window & { gtag?: (...args: unknown[]) => void }).gtag;
      if (typeof gtag === "function") {
        gtag("consent", "default", {
          analytics_storage: "denied",
          ad_storage: "denied",
          ad_user_data: "denied",
          ad_personalization: "denied",
        });
      }
      setVisible(true);
      setHasConsent(false);
    } else {
      setHasConsent(true);
      updateGtagConsent(existing);
    }
    (window as Window & { convocaShowConsent?: () => void }).convocaShowConsent = () =>
      setVisible(true);
  }, []);

  const acceptAll = () => {
    const consent: ConsentState = {
      necessary: true,
      analytics: true,
      marketing: true,
      timestamp: new Date().toISOString(),
      version: POLICY_VERSION,
    };
    writeConsent(consent);
    updateGtagConsent(consent);
    setVisible(false);
    setHasConsent(true);
  };

  const rejectAll = () => {
    const consent: ConsentState = {
      necessary: true,
      analytics: false,
      marketing: false,
      timestamp: new Date().toISOString(),
      version: POLICY_VERSION,
    };
    writeConsent(consent);
    updateGtagConsent(consent);
    setVisible(false);
    setHasConsent(true);
  };

  if (!visible && hasConsent) {
    return (
      <button
        type="button"
        onClick={() => setVisible(true)}
        className="fixed bottom-4 left-4 z-[9997] rounded-full border border-border bg-card/95 px-3 py-1.5 text-xs font-medium text-muted-foreground shadow-md backdrop-blur-md hover:bg-card hover:text-foreground"
        aria-label="Gerenciar cookies"
        title="Gerenciar cookies"
      >
        Gerenciar cookies
      </button>
    );
  }

  if (!visible) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-[9998] px-4 pb-4">
      <div className="mx-auto flex max-w-4xl flex-col gap-4 rounded-xl border border-border bg-card p-4 shadow-lg md:flex-row md:items-center md:justify-between md:p-5">
        <div className="text-sm text-foreground">
          <p className="mb-1 font-semibold">Usamos cookies para melhorar sua experiência</p>
          <p className="text-muted-foreground">
            Utilizamos cookies estritamente necessários e, com seu consentimento, cookies de
            análise e marketing. Você pode aceitar, rejeitar ou ajustar depois em &quot;Gerenciar
            cookies&quot;.{" "}
            <Link href="/privacidade" className="underline hover:text-pitch">
              Política de Privacidade
            </Link>
            .
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <button
            type="button"
            onClick={rejectAll}
            className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground transition hover:bg-secondary"
          >
            Rejeitar
          </button>
          <button
            type="button"
            onClick={acceptAll}
            className="rounded-lg bg-pitch px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
          >
            Aceitar todos
          </button>
        </div>
      </div>
    </div>
  );
}
