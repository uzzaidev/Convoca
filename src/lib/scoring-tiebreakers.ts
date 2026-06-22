export const TIEBREAKER_KEYS = [
  "wins",
  "goal_difference",
  "goals",
  "games_played",
  "games_played_asc",
  "assists",
  "mvp_count",
] as const;

export type TiebreakerKey = (typeof TIEBREAKER_KEYS)[number];

export const DEFAULT_TIEBREAKERS: TiebreakerKey[] = [
  "wins",
  "goal_difference",
  "goals",
  "games_played",
];

export function normalizeTiebreakers(raw: unknown): TiebreakerKey[] {
  let value = raw;

  if (typeof raw === "string") {
    try {
      value = JSON.parse(raw);
    } catch {
      return [...DEFAULT_TIEBREAKERS];
    }
  }

  if (!Array.isArray(value)) return [...DEFAULT_TIEBREAKERS];

  const seen = new Set<string>();
  const out: TiebreakerKey[] = [];
  for (const item of value) {
    if (typeof item !== "string") continue;
    if (!(TIEBREAKER_KEYS as readonly string[]).includes(item)) continue;
    if (seen.has(item)) continue;
    if (item === "games_played" && seen.has("games_played_asc")) continue;
    if (item === "games_played_asc" && seen.has("games_played")) continue;
    seen.add(item);
    out.push(item as TiebreakerKey);
  }

  return out.length > 0 ? out : [...DEFAULT_TIEBREAKERS];
}
