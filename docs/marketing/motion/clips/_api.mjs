/* Helpers para os clipes colocarem uma pelada em qualquer estado do ciclo via API (sem UI).
Todos recebem `api(method, url, body)` (o do setup({ api }) do rec.mjs) como 1º argumento.
Só mexem no grupo de teste "Pelada do Parque" (PD). Pedro (logado) é admin.

  members(api)                                     -> [{ id, userId, name, role, is_goalkeeper, ... }] (Pedro incluso)
  createEvent(api, { startsAt, maxPlayers=14, maxGoalkeepers=2 }) -> eventId
  confirmPlayers(api, eventId, n, { includePedro=true }) -> ids confirmados (admin-rsvp; 2 goleiros + linha)
  drawTeams(api, eventId)                          -> teams [{ id, name, members:[{ userId, userName }] }]
  startMatch(api, eventId)                         PATCH status "live"
  addGoal(api, eventId, { userId, teamId, assistUserId })
  finishMatch(api, eventId)                        PATCH status "finished"
  vote(api, eventId, userId)                       voto MVP (Pedro vota em userId; não pode ser ele mesmo)
  deleteEvent(api, eventId)                        DELETE = status "canceled" (some das listas)
  matchReady(api, state)                           state: created|confirmed|drawn|live|finished
                                                   -> { eventId, teams, members }

FUSO: o servidor grava `startsAt` como instante ISO (Z). O form do app faz new Date("2026-10-06T20:00").toISOString()
no fuso do navegador, então 20:00 em São Paulo = "2026-10-06T23:00:00.000Z" (-03:00, sem horário de verão).
Aqui `startsAt` aceita "YYYY-MM-DDTHH:mm" = horário de parede de São Paulo (convertido p/ -03:00), ou ISO com Z/offset, ou Date.

Regras: sorteio NÃO exige check-in (só >=4 confirmados "yes"; 2º sorteio em <5s dá 409). Evento "finished" não sorteia.
Confirmar além de max_players/max_goalkeepers vai para a lista de espera (waitlist_enabled=true por padrão). */
export const PD = "aaaabbbb-cccc-dddd-eeee-111111111111";
const POS = ["defender", "midfielder", "forward", "midfielder", "defender", "forward"];

const toIso = (s) => s instanceof Date ? s.toISOString()
  : /Z$|[+-]\d\d:?\d\d$/.test(s) ? new Date(s).toISOString()
  // starts_at é TIMESTAMP sem fuso e o servidor (UTC, como na Vercel) mostra o valor cru:
  // para a tela exibir 20:00, grava-se "20:00Z" (bug do app: o form manda UTC e a tela mostra +3h)
  : new Date(s.length === 16 ? `${s}:00Z` : `${s}Z`).toISOString();

export async function members(api) {
  const { group } = await api("GET", `/api/groups/${PD}`);
  return group.members.map(m => ({ ...m, userId: m.id }));
}

export async function createEvent(api, { startsAt, maxPlayers = 14, maxGoalkeepers = 2 }) {
  const { event } = await api("POST", "/api/events", { groupId: PD, startsAt: toIso(startsAt), maxPlayers, maxGoalkeepers });
  return event.id;
}

export async function confirmPlayers(api, eventId, n, { includePedro = true } = {}) {
  const all = await members(api);
  const pedro = all.find(m => m.name.startsWith("Pedro Costa"));
  const others = all.filter(m => m !== pedro);
  // goleiros: membros marcados como goleiro (fora o Pedro), senão os primeiros; Pedro sempre na linha
  const gks = [...others.filter(m => m.is_goalkeeper), ...others.filter(m => !m.is_goalkeeper)].slice(0, 2);
  const line = others.filter(m => !gks.includes(m));
  const picked = [...(includePedro ? [{ m: pedro, p: "forward" }] : []),
    ...gks.map(m => ({ m, p: "gk" })), ...line.map((m, i) => ({ m, p: POS[i % POS.length] }))].slice(0, n);
  for (const { m, p } of picked)
    await api("POST", `/api/events/${eventId}/admin-rsvp`, { userId: m.userId, status: "yes", preferredPosition: p });
  return picked.map(x => x.m.userId);
}

export async function drawTeams(api, eventId) {
  await api("POST", `/api/events/${eventId}/draw`, { numTeams: 2 });
  return (await api("GET", `/api/events/${eventId}/teams`)).teams;
}

export const startMatch = (api, eventId) => api("PATCH", `/api/events/${eventId}`, { status: "live" });
export const finishMatch = (api, eventId) => api("PATCH", `/api/events/${eventId}`, { status: "finished" });

export async function addGoal(api, eventId, { userId, teamId, assistUserId }) {
  await api("POST", `/api/events/${eventId}/actions`, { actionType: "goal", subjectUserId: userId, teamId });
  if (assistUserId) await api("POST", `/api/events/${eventId}/actions`, { actionType: "assist", subjectUserId: assistUserId, teamId });
}

export const vote = (api, eventId, userId) => api("POST", `/api/events/${eventId}/ratings`, { ratedUserId: userId });
export const deleteEvent = (api, eventId) => api("DELETE", `/api/events/${eventId}`);

const STATES = ["created", "confirmed", "drawn", "live", "finished"];
export async function matchReady(api, state, { startsAt } = {}) {
  const at = STATES.indexOf(state);
  if (at < 0) throw new Error(`estado inválido: ${state}`);
  // hoje às 20:00 em São Paulo (horário redondo fica melhor no vídeo)
  const sp = new Date(Date.now() - 3 * 3600e3).toISOString().slice(0, 10) + "T20:00";
  const eventId = await createEvent(api, { startsAt: startsAt ?? sp });
  const out = { eventId, teams: [], members: await members(api) };
  if (at < 1) return out;
  await confirmPlayers(api, eventId, 14);
  if (at < 2) return out;
  out.teams = await drawTeams(api, eventId);
  if (at < 3) return out;
  await startMatch(api, eventId);
  if (at < 4) return out;
  const [a, b] = out.teams.map(t => t.members);
  const pedro = a.concat(b).find(m => m.userName.startsWith("Pedro Costa"));
  const mine = out.teams.find(t => t.members.includes(pedro)), other = out.teams.find(t => t !== mine);
  const mate = mine.members.find(m => m !== pedro), foe = other.members[0], foe2 = other.members[1];
  await addGoal(api, eventId, { userId: pedro.userId, teamId: mine.id, assistUserId: mate.userId });
  await addGoal(api, eventId, { userId: pedro.userId, teamId: mine.id });
  await addGoal(api, eventId, { userId: foe.userId, teamId: other.id, assistUserId: foe2.userId });
  await finishMatch(api, eventId);
  await vote(api, eventId, mate.userId);
  return out;
}
