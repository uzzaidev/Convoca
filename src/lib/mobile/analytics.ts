/**
 * Firebase Analytics — módulo central do Convoca.
 *
 * Lazy-init: só carrega o SDK quando o primeiro evento é disparado.
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

  if (!apiKey || !appId) return null;

  try {
    const { initializeApp, getApps, getApp } = await import("firebase/app");
    const { getAnalytics: fbGetAnalytics, isSupported } = await import("firebase/analytics");

    if (!(await isSupported())) return null;

    const appConfig: Record<string, string> = { apiKey, appId };
    if (measurementId) appConfig.measurementId = measurementId;
    if (projectId) appConfig.projectId = projectId;

    const app = getApps().length ? getApp() : initializeApp(appConfig);
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

export async function initAnalytics(): Promise<void> {
  await getAnalytics();
}

// ─── Funil de cadastro (4 eventos separados por momento) ─────────────────────

/** Usuário abriu a tela de cadastro */
export async function trackSignUpPageViewed(): Promise<void> {
  await track("sign_up_page_viewed");
}

/** Usuário alterou o primeiro campo do formulário */
export async function trackSignUpFormStarted(): Promise<void> {
  await track("sign_up_form_started");
}

/** Usuário submeteu o formulário (antes do HTTP response) */
export async function trackSignUpSubmitted(): Promise<void> {
  await track("sign_up_submitted");
}

/**
 * Cadastro concluído — HTTP 200 recebido.
 * acquisitionSource: valor do utm_source da URL no momento do cadastro.
 * Salvo como User Property para que todos os eventos futuros carreguem a atribuição.
 */
export async function trackSignUpCompleted(params: {
  acquisitionSource?: string;
}): Promise<void> {
  await track("sign_up_completed");
  if (params.acquisitionSource) {
    await setUserProp("acquisition_source", params.acquisitionSource);
  }
}

/** Criação de conta falhou — HTTP 4xx/5xx recebido */
export async function trackSignUpFailed(params: { reason?: string }): Promise<void> {
  await track("sign_up_failed", {
    ...(params.reason && { reason: params.reason }),
  });
}

// ─── Grupo ───────────────────────────────────────────────────────────────────

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

/**
 * Convite gerado pelo admin.
 * invite_count: quantas vezes o admin gerou um convite nessa ação (normalmente 1).
 * Se quiser rastrear tamanho do grupo, passar group_member_count separadamente.
 */
export async function trackPlayerInvited(params: {
  groupMemberCount: number;
}): Promise<void> {
  await track("player_invited", {
    group_member_count: params.groupMemberCount,
  });
}

// ─── Convite (funil separado por momento) ────────────────────────────────────

/** Página de convite carregou — dispara antes de validar o código */
export async function trackInvitePageViewed(params: {
  inviteCodeLength: number;
}): Promise<void> {
  await track("invite_page_viewed", {
    invite_code_length: params.inviteCodeLength,
  });
}

/** Validação SQL do convite concluída */
export async function trackInviteValidationCompleted(params: {
  valid: boolean;
  invalidReason?: "expired" | "not_found" | "max_uses_reached" | "group_inactive";
}): Promise<void> {
  await track("invite_validation_completed", {
    valid: params.valid,
    ...(params.invalidReason && { invalid_reason: params.invalidReason }),
  });
}

/** Usuário entrou no grupo com sucesso via convite */
export async function trackInviteJoinCompleted(params: {
  hadCodePrefilled: boolean;
  source: "invite_page" | "join_form" | "agent";
}): Promise<void> {
  await track("invite_join_completed", {
    had_code_prefilled: params.hadCodePrefilled,
    source: params.source,
  });
}

// ─── Evento / RSVP ───────────────────────────────────────────────────────────

/**
 * RSVP atualizado pelo usuário.
 * rsvpStatus: "yes" | "no" | "waitlist"
 * source: de onde o RSVP veio
 */
export async function trackEventRsvpUpdated(params: {
  rsvpStatus: "yes" | "no" | "waitlist";
  isGoalkeeper: boolean;
  source?: "event_page" | "dashboard" | "agent";
  hoursBeforeEvent?: number;
}): Promise<void> {
  await track("event_rsvp_updated", {
    rsvp_status: params.rsvpStatus,
    is_goalkeeper: params.isGoalkeeper,
    ...(params.source && { source: params.source }),
    ...(params.hoursBeforeEvent !== undefined && { hours_before_event: params.hoursBeforeEvent }),
  });
}

// ─── Agente (funil de descoberta e uso) ──────────────────────────────────────

/** FloatingAgentBubble ficou visível na tela */
export async function trackAgentEntrypointViewed(params: {
  groupRole: "admin" | "member";
}): Promise<void> {
  await track("agent_entrypoint_viewed", { group_role: params.groupRole });
}

/** Usuário abriu o painel do agente */
export async function trackAgentOpened(params: {
  groupRole: "admin" | "member";
}): Promise<void> {
  await track("agent_opened", { group_role: params.groupRole });
}

/** Usuário enviou uma mensagem ao agente */
export async function trackAgentMessageSent(params: {
  groupRole: "admin" | "member";
}): Promise<void> {
  await track("agent_message_sent", { group_role: params.groupRole });
}

/** Agente propôs uma ação (tool call) esperando confirmação */
export async function trackAgentToolProposed(params: {
  toolName: string;
  groupRole: "admin" | "member";
}): Promise<void> {
  await track("agent_tool_proposed", {
    tool_name: params.toolName,
    group_role: params.groupRole,
  });
}

/** Usuário confirmou a ação proposta pelo agente */
export async function trackAgentToolConfirmed(params: {
  toolName: string;
  groupRole: "admin" | "member";
}): Promise<void> {
  await track("agent_tool_confirmed", {
    tool_name: params.toolName,
    group_role: params.groupRole,
  });
}

/** Ação do agente executada com sucesso */
export async function trackAgentToolCompleted(params: {
  toolName: string;
  groupRole: "admin" | "member";
}): Promise<void> {
  await track("agent_tool_completed", {
    tool_name: params.toolName,
    group_role: params.groupRole,
  });
}

/** Ação do agente falhou */
export async function trackAgentToolFailed(params: {
  toolName: string;
  groupRole: "admin" | "member";
  reason?: string;
}): Promise<void> {
  await track("agent_tool_failed", {
    tool_name: params.toolName,
    group_role: params.groupRole,
    ...(params.reason && { reason: params.reason }),
  });
}

// ─── Assinatura ───────────────────────────────────────────────────────────────

/** Checkout iniciado — dispara antes do redirect para Stripe */
export async function trackSubscriptionCheckoutStarted(params: {
  planName: string;
  trialDays: number;
}): Promise<void> {
  await track("subscription_checkout_started", {
    plan_name: params.planName,
    trial_days: params.trialDays,
  });
}

/** Checkout concluído — dispara via webhook Stripe ou redirect de retorno */
export async function trackSubscriptionCheckoutCompleted(params: {
  planName: string;
  isTrial: boolean;
}): Promise<void> {
  await track("subscription_checkout_completed", {
    plan_name: params.planName,
    is_trial: params.isTrial,
  });
}

/** Checkout falhou */
export async function trackSubscriptionCheckoutFailed(params: {
  planName: string;
  failureReason?: string;
}): Promise<void> {
  await track("subscription_checkout_failed", {
    plan_name: params.planName,
    ...(params.failureReason && { failure_reason: params.failureReason }),
  });
}

/** Usuário confirmou cancelamento da assinatura */
export async function trackSubscriptionCancelled(params: {
  planName: string;
}): Promise<void> {
  await track("subscription_cancelled", {
    plan_name: params.planName,
  });
}

// ─── Aliases para compatibilidade (deprecated) ────────────────────────────────

/** @deprecated Use trackSignUpPageViewed */
export const trackSignUpStarted = trackSignUpPageViewed;

/** @deprecated Use trackSubscriptionCheckoutStarted */
export async function trackTrialStarted(params: {
  planName: string;
  trialDays: number;
}): Promise<void> {
  await trackSubscriptionCheckoutStarted(params);
}

/** @deprecated Use trackSubscriptionCheckoutStarted */
export async function trackSubscriptionStarted(params: {
  planName: string;
  isTrial: boolean;
  currency?: string;
}): Promise<void> {
  await track("subscription_checkout_started", {
    plan_name: params.planName,
    is_trial: params.isTrial,
    currency: params.currency ?? "BRL",
  });
}

/** @deprecated Use trackMatchConfirmed — replaced by trackEventRsvpUpdated */
export async function trackMatchConfirmed(params: {
  isGoalkeeper: boolean;
  hoursBeforeMatch?: number;
}): Promise<void> {
  await trackEventRsvpUpdated({
    rsvpStatus: "yes",
    isGoalkeeper: params.isGoalkeeper,
    source: "event_page",
    ...(params.hoursBeforeMatch !== undefined && { hoursBeforeEvent: params.hoursBeforeMatch }),
  });
}
