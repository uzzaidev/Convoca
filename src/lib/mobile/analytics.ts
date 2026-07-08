/**
 * Firebase Analytics — módulo central do Convoca.
 *
 * Usa o Firebase JS SDK (web) que funciona tanto no browser quanto na
 * WebView do Capacitor (Strategy B). Lazy-init: só carrega o SDK quando
 * o primeiro evento é disparado.
 *
 * Env vars necessárias (NEXT_PUBLIC_ = expostas no cliente):
 *   NEXT_PUBLIC_FIREBASE_API_KEY
 *   NEXT_PUBLIC_FIREBASE_APP_ID
 *   NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
 *   NEXT_PUBLIC_FIREBASE_PROJECT_ID
 *
 * Para obter os valores: Firebase Console → Configurações do projeto → Seus apps → Web.
 * Nunca lança exceção — analytics nunca pode quebrar o fluxo do usuário.
 */

import type { Analytics } from "firebase/analytics";

let _analytics: Analytics | null = null;
let _initAttempted = false;

async function getAnalytics(): Promise<Analytics | null> {
  if (_initAttempted) return _analytics;
  _initAttempted = true;

  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  const appId = process.env.NEXT_PUBLIC_FIREBASE_APP_ID;
  const measurementId = process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID;
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

  if (!apiKey || !appId || !measurementId) return null;

  try {
    const { initializeApp, getApps, getApp } = await import("firebase/app");
    const { getAnalytics: fbGetAnalytics, isSupported } = await import("firebase/analytics");

    if (!(await isSupported())) return null;

    const app = getApps().length
      ? getApp()
      : initializeApp({ apiKey, appId, measurementId, projectId });

    _analytics = fbGetAnalytics(app);
  } catch {
    // Silently fail — analytics is non-critical
  }

  return _analytics;
}

async function track(
  name: string,
  params?: Record<string, string | number | boolean>
): Promise<void> {
  try {
    const analytics = await getAnalytics();
    if (!analytics) return;
    const { logEvent } = await import("firebase/analytics");
    logEvent(analytics, name, params);
  } catch {
    // Never throw from analytics
  }
}

async function setUserProp(key: string, value: string): Promise<void> {
  try {
    const analytics = await getAnalytics();
    if (!analytics) return;
    const { setUserProperties } = await import("firebase/analytics");
    setUserProperties(analytics, { [key]: value });
  } catch {
    // Never throw from analytics
  }
}

// ─── Inicialização ───────────────────────────────────────────────────────────

/** Inicializa o SDK de forma lazy. Chamar uma vez no mount do app. */
export async function initAnalytics(): Promise<void> {
  await getAnalytics();
}

// ─── Eventos ─────────────────────────────────────────────────────────────────

/** #sign_up_started — usuário abriu a tela de cadastro */
export async function trackSignUpStarted(): Promise<void> {
  await track("sign_up_started");
}

/**
 * #sign_up_completed — cadastro concluído com sucesso.
 * acquisitionSource: valor do utm_source capturado da URL no momento do cadastro.
 * Salvo como User Property para que TODOS os eventos futuros do usuário
 * carreguem a atribuição (ex: "folder_campanha_offline").
 */
export async function trackSignUpCompleted(params: {
  acquisitionSource?: string;
}): Promise<void> {
  await track("sign_up_completed");
  if (params.acquisitionSource) {
    await setUserProp("acquisition_source", params.acquisitionSource);
  }
}

/**
 * #pelada_created — grupo/pelada criado com sucesso.
 * Nota: match_format (futsal/society/campo) ainda não existe no schema.
 * Será adicionado quando o campo for criado no banco/formulário.
 */
export async function trackPeladaCreated(params: {
  maxPlayers: number;
  hasVenue: boolean;
  isRecurring: boolean;
  hasGoalkeeperSlots: boolean;
  privacy: "private" | "public";
}): Promise<void> {
  await track("pelada_created", {
    max_players: params.maxPlayers,
    has_venue: params.hasVenue,
    is_recurring: params.isRecurring,
    has_goalkeeper_slots: params.hasGoalkeeperSlots,
    private_match: params.privacy === "private",
  });
}

/** #player_invited — convite gerado para o grupo */
export async function trackPlayerInvited(params: {
  groupMemberCount: number;
}): Promise<void> {
  await track("player_invited", {
    group_member_count: params.groupMemberCount,
  });
}

/**
 * #match_confirmed — usuário confirmou presença (RSVP = yes).
 * hoursBeforeMatch: opcional, requer que o chamador calcule com base em starts_at.
 */
export async function trackMatchConfirmed(params: {
  isGoalkeeper: boolean;
  hoursBeforeMatch?: number;
}): Promise<void> {
  await track("match_confirmed", {
    is_goalkeeper: params.isGoalkeeper,
    ...(params.hoursBeforeMatch !== undefined && {
      hours_before_match: params.hoursBeforeMatch,
    }),
  });
}

/**
 * #trial_started — usuário iniciou checkout Stripe (todos têm trial).
 * Disparado antes do redirect para Stripe, não na confirmação do pagamento.
 * Para rastrear conversão real use o webhook do Stripe.
 */
export async function trackTrialStarted(params: {
  planName: string;
  trialDays: number;
}): Promise<void> {
  await track("trial_started", {
    plan_name: params.planName,
    trial_days: params.trialDays,
  });
}

/**
 * #subscription_started — usuário iniciou checkout de assinatura.
 * currency: dinâmico para suportar BRL/EUR/AUD conforme mercado.
 */
export async function trackSubscriptionStarted(params: {
  planName: string;
  isTrial: boolean;
  currency?: string;
}): Promise<void> {
  await track("subscription_started", {
    plan_name: params.planName,
    is_trial: params.isTrial,
    currency: params.currency ?? "BRL",
  });
}

/** #subscription_cancelled — usuário confirmou cancelamento da assinatura */
export async function trackSubscriptionCancelled(params: {
  planName: string;
}): Promise<void> {
  await track("subscription_cancelled", {
    plan_name: params.planName,
  });
}
