import type { ReactNode } from "react";
import {
  ANDROID_PLAY_STORE_URL,
  IOS_APP_STORE_URL,
} from "@/lib/mobile/store-urls";

/**
 * Dois cards de download — App Store + Google Play.
 * Padrão visual alinhado aos botões de /invite (ícone + loja + CTA).
 */
export function StoreDownloadCards({
  className = "",
}: {
  className?: string;
}) {
  return (
    <div className={`grid gap-4 sm:grid-cols-2 ${className}`}>
      <StoreCard
        href={IOS_APP_STORE_URL}
        store="App Store"
        label="Disponível na"
        cta="Baixar para iPhone"
        icon={<AppleIcon />}
      />
      <StoreCard
        href={ANDROID_PLAY_STORE_URL}
        store="Google Play"
        label="Disponível no"
        cta="Baixar para Android"
        icon={<AndroidIcon />}
      />
    </div>
  );
}

function StoreCard({
  href,
  store,
  label,
  cta,
  icon,
}: {
  href: string;
  store: string;
  label: string;
  cta: string;
  icon: ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex items-center gap-4 rounded-2xl border border-border bg-card p-5 shadow-warm-md transition-transform hover:scale-[1.01] hover:border-pitch/40"
    >
      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-foreground text-background">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-semibold uppercase tracking-eyebrow text-muted-foreground">
          {label}
        </p>
        <p className="font-display text-xl tracking-display leading-none text-foreground">
          {store}
        </p>
        <p className="mt-1.5 text-sm font-semibold text-pitch group-hover:underline">{cta}</p>
      </div>
    </a>
  );
}

function AppleIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
    </svg>
  );
}

function AndroidIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M17.6 9.48l1.84-3.18c.16-.31.04-.69-.26-.85a.637.637 0 0 0-.83.22l-1.88 3.24a11.43 11.43 0 0 0-8.94 0L5.65 5.67a.643.643 0 0 0-.87-.2c-.31.16-.43.54-.26.85l1.84 3.18C4.12 11.22 2.5 13.88 2.5 17h19c0-3.12-1.62-5.78-3.9-7.52zM7 14.25a1.25 1.25 0 1 1 0-2.5 1.25 1.25 0 0 1 0 2.5zm10 0a1.25 1.25 0 1 1 0-2.5 1.25 1.25 0 0 1 0 2.5z" />
    </svg>
  );
}
