import {
  ANDROID_PLAY_STORE_URL,
  IOS_APP_STORE_URL,
} from "@/lib/mobile/store-urls";

/**
 * Badges oficiais estilo App Store / Google Play (fundo preto).
 * Usados no hero da landing — clique abre a loja correspondente.
 */
export function StoreDownloadCards({
  className = "",
  layout = "row",
}: {
  className?: string;
  /** row = lado a lado no desktop; stack = um embaixo do outro */
  layout?: "row" | "stack";
}) {
  const grid =
    layout === "stack"
      ? "flex flex-col gap-3"
      : "flex flex-col gap-3 sm:flex-row sm:justify-center";

  return (
    <div id="baixar" className={`scroll-mt-24 ${grid} ${className}`}>
      <a
        href={IOS_APP_STORE_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex h-[56px] w-full max-w-[200px] items-center gap-3 rounded-xl bg-black px-4 text-white shadow-lg transition hover:scale-[1.03] hover:bg-black/90 sm:w-[200px]"
        aria-label="Baixar na App Store"
      >
        <AppleLogo />
        <span className="flex flex-col items-start leading-none">
          <span className="text-[10px] font-medium tracking-wide opacity-90">
            Download on the
          </span>
          <span className="mt-0.5 text-[18px] font-semibold tracking-tight">
            App Store
          </span>
        </span>
      </a>

      <a
        href={ANDROID_PLAY_STORE_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex h-[56px] w-full max-w-[200px] items-center gap-3 rounded-xl bg-black px-4 text-white shadow-lg transition hover:scale-[1.03] hover:bg-black/90 sm:w-[200px]"
        aria-label="Baixar no Google Play"
      >
        <GooglePlayLogo />
        <span className="flex flex-col items-start leading-none">
          <span className="text-[10px] font-medium tracking-wide opacity-90">
            GET IT ON
          </span>
          <span className="mt-0.5 text-[18px] font-semibold tracking-tight">
            Google Play
          </span>
        </span>
      </a>
    </div>
  );
}

function AppleLogo() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
    </svg>
  );
}

/** Triângulo colorido estilo Google Play */
function GooglePlayLogo() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#EA4335"
        d="M3.6 2.2c-.4.2-.6.6-.6 1.1v17.4c0 .5.2.9.6 1.1l9.2-9.8L3.6 2.2z"
      />
      <path
        fill="#FBBC04"
        d="M16.1 14.7l-3.3-3.5 3.3-3.5 3.9 2.2c1 .6 1 1.5 0 2.1l-3.9 2.7z"
      />
      <path
        fill="#4285F4"
        d="M16.1 14.7L12.8 11.2 3.6 20.8c.5.3 1.1.3 1.7 0l10.8-6.1z"
      />
      <path
        fill="#34A853"
        d="M16.1 7.7L5.3 1.6C4.7 1.3 4.1 1.3 3.6 1.6l9.2 9.6 3.3-3.5z"
      />
    </svg>
  );
}
