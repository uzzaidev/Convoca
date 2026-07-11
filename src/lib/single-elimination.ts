/**
 * Single-elimination bracket generator.
 *
 * N teams → ceil(log2(N)) rounds.
 * Slots are padded with null (BYE) to the next power of 2.
 * BYE matches are flagged so the caller can auto-advance the real team.
 *
 * Round naming (from the final backwards):
 *   Final · Semifinais · Quartas de Final · Oitavas de Final · Fase N
 */

export type ElimMatch = {
  homeId: string | null;
  awayId: string | null;
  position: number;  // 1-indexed within the round
  isBye: boolean;    // one side is null → real team auto-advances
};

export type ElimRound = {
  roundNumber: number;
  name: string;
  matches: ElimMatch[];
};

function nextPowerOf2(n: number): number {
  let p = 1;
  while (p < n) p *= 2;
  return p;
}

export function getElimRoundName(totalRounds: number, roundNumber: number): string {
  const stepsFromFinal = totalRounds - roundNumber;
  if (stepsFromFinal === 0) return "Final";
  if (stepsFromFinal === 1) return "Semifinais";
  if (stepsFromFinal === 2) return "Quartas de Final";
  if (stepsFromFinal === 3) return "Oitavas de Final";
  return `Fase ${roundNumber}`;
}

/**
 * Generates the full bracket structure.
 * Round 1 has actual team IDs (null = BYE slot).
 * Rounds 2+ have null slots (filled in as winners advance).
 */
export function generateSingleElimination(teamIds: string[]): ElimRound[] {
  if (teamIds.length < 2) return [];

  const size = nextPowerOf2(teamIds.length);
  const totalRounds = Math.log2(size);

  // Pad with null to reach power of 2 (BYE slots go at the end)
  const seeded: (string | null)[] = [...teamIds];
  while (seeded.length < size) seeded.push(null);

  const rounds: ElimRound[] = [];

  // Round 1: pair teams sequentially; nulls become BYE
  const r1Matches: ElimMatch[] = [];
  for (let i = 0; i < size / 2; i++) {
    const homeId = seeded[i * 2] ?? null;
    const awayId = seeded[i * 2 + 1] ?? null;
    r1Matches.push({
      homeId,
      awayId,
      position: i + 1,
      isBye: homeId === null || awayId === null,
    });
  }
  rounds.push({
    roundNumber: 1,
    name: getElimRoundName(totalRounds, 1),
    matches: r1Matches,
  });

  // Rounds 2+: all TBD (null) — filled as winners advance
  for (let r = 2; r <= totalRounds; r++) {
    const matchCount = size / Math.pow(2, r);
    const matches: ElimMatch[] = [];
    for (let i = 0; i < matchCount; i++) {
      matches.push({ homeId: null, awayId: null, position: i + 1, isBye: false });
    }
    rounds.push({ roundNumber: r, name: getElimRoundName(totalRounds, r), matches });
  }

  return rounds;
}

/**
 * Given the current match position and round, returns where the winner goes next.
 * - nextRound = currentRound + 1
 * - nextPosition = ceil(currentPosition / 2)
 * - slot = "home" if currentPosition is odd, "away" if even
 */
export function getWinnerSlot(
  currentPosition: number
): { nextPosition: number; slot: "home" | "away" } {
  return {
    nextPosition: Math.ceil(currentPosition / 2),
    slot: currentPosition % 2 === 1 ? "home" : "away",
  };
}
