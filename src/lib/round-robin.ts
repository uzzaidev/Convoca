/**
 * Round-robin scheduling algorithm (Berger tables / circle method).
 *
 * For N teams:
 *   - N even → N-1 rounds, each round has N/2 matches
 *   - N odd  → N rounds, one team has a bye per round; a virtual BYE team is added
 *
 * Returns an array of rounds, each round is an array of {homeId, awayId} pairs.
 * Bye matches (where one side is the BYE_ID sentinel) are filtered out — the
 * caller receives only real matches.
 *
 * Usage:
 *   const rounds = generateRoundRobin(["t1","t2","t3","t4","t5"]);
 *   // rounds[0] = [{homeId:"t1",awayId:"t5"},{homeId:"t2",awayId:"t4"}] (t3 has bye)
 */

const BYE_ID = "__bye__";

export type RoundMatch = {
  homeId: string;
  awayId: string;
};

/**
 * Generates a single round-robin schedule for the given team IDs.
 * Teams array order determines seeding in round 1.
 */
export function generateRoundRobin(teamIds: string[]): RoundMatch[][] {
  if (teamIds.length < 2) return [];

  const teams = [...teamIds];

  // Add virtual BYE for odd number of teams
  if (teams.length % 2 !== 0) {
    teams.push(BYE_ID);
  }

  const n = teams.length;
  const totalRounds = n - 1;
  const rounds: RoundMatch[][] = [];

  // Circle method: fix teams[0], rotate the rest
  const circle = teams.slice(1);

  for (let round = 0; round < totalRounds; round++) {
    const matches: RoundMatch[] = [];
    const current = [teams[0], ...circle];

    for (let i = 0; i < n / 2; i++) {
      const home = current[i];
      const away = current[n - 1 - i];
      // Skip bye matches
      if (home !== BYE_ID && away !== BYE_ID) {
        matches.push({ homeId: home, awayId: away });
      }
    }

    rounds.push(matches);

    // Rotate circle: move last element to front
    circle.unshift(circle.pop()!);
  }

  return rounds;
}

/**
 * Returns which team IDs have a bye in each round.
 * Used to display "descansa" in the round schedule.
 */
export function getByesPerRound(teamIds: string[]): (string | null)[] {
  if (teamIds.length % 2 === 0) {
    // No byes needed
    return new Array(teamIds.length - 1).fill(null);
  }

  const teams = [...teamIds, BYE_ID];
  const n = teams.length;
  const circle = teams.slice(1);
  const byes: (string | null)[] = [];

  for (let round = 0; round < n - 1; round++) {
    const current = [teams[0], ...circle];
    let byeTeam: string | null = null;

    for (let i = 0; i < n / 2; i++) {
      const home = current[i];
      const away = current[n - 1 - i];
      if (home === BYE_ID) byeTeam = away;
      if (away === BYE_ID) byeTeam = home;
    }

    byes.push(byeTeam);
    circle.unshift(circle.pop()!);
  }

  return byes;
}

/**
 * Validates round-robin output:
 * - Every pair of teams appears exactly once
 * - No team plays itself
 */
export function validateRoundRobin(teamIds: string[], rounds: RoundMatch[][]): boolean {
  const pairs = new Set<string>();

  for (const round of rounds) {
    for (const { homeId, awayId } of round) {
      if (homeId === awayId) return false;
      const key = [homeId, awayId].sort().join("|");
      if (pairs.has(key)) return false;
      pairs.add(key);
    }
  }

  const expectedPairs = (teamIds.length * (teamIds.length - 1)) / 2;
  return pairs.size === expectedPairs;
}
