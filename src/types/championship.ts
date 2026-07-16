// Types for the championships module.
// DB rows use snake_case; API responses are camelCase (transformed in route handlers).

export type ChampionshipFormat = "round_robin" | "single_elimination" | "double_elimination" | "mixed";
export type ChampionshipTeamFormation = "manual" | "draw";
export type ChampionshipStatus = "draft" | "active" | "finished" | "cancelled";
export type PhaseType = "group_stage" | "round_of_16" | "quarterfinals" | "semifinals" | "third_place" | "final";
export type PhaseStatus = "pending" | "active" | "finished";
export type MatchStatus = "scheduled" | "in_progress" | "finished" | "cancelled" | "postponed";

// ── DB row types (from SQL queries) ─────────────────────────

export type ChampionshipRow = {
  id: string;
  group_id: string;
  name: string;
  description: string | null;
  format: ChampionshipFormat;
  team_formation: ChampionshipTeamFormation;
  status: ChampionshipStatus;
  starts_at: string | null;
  ends_at: string | null;
  venue_id: string | null;
  match_duration_minutes: number;
  match_win_goal_diff: number;
  can_captain_edit_rules: boolean;
  points_win: number;
  points_draw: number;
  points_loss: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type ChampionshipPhaseRow = {
  id: string;
  championship_id: string;
  phase_type: PhaseType;
  name: string;
  order: number;
  status: PhaseStatus;
  created_at: string;
  updated_at: string;
};

export type ChampionshipTeamRow = {
  id: string;
  championship_id: string;
  name: string;
  color: string;
  seed: number | null;
  is_bye: boolean;
  created_at: string;
  updated_at: string;
};

export type ChampionshipTeamPlayerRow = {
  id: string;
  championship_team_id: string;
  user_id: string | null;
  guest_name: string | null;
  is_captain: boolean;
  created_at: string;
};

export type ChampionshipRoundRow = {
  id: string;
  phase_id: string;
  round_number: number;
  scheduled_at: string | null;
  created_at: string;
};

export type ChampionshipMatchRow = {
  id: string;
  round_id: string;
  home_team_id: string;
  away_team_id: string;
  event_id: string | null;
  home_score: number | null;
  away_score: number | null;
  status: MatchStatus;
  played_at: string | null;
  created_at: string;
  updated_at: string;
};

export type ChampionshipStandingRow = {
  championship_id: string;
  team_id: string;
  team_name: string;
  team_color: string;
  games_played: number;
  wins: number;
  draws: number;
  losses: number;
  goals_for: number;
  goals_against: number;
  goal_diff: number;
  points: number;
};

// ── API response types (camelCase, enriched) ────────────────

export type Championship = {
  id: string;
  groupId: string;
  name: string;
  description: string | null;
  format: ChampionshipFormat;
  teamFormation: ChampionshipTeamFormation;
  status: ChampionshipStatus;
  startsAt: string | null;
  endsAt: string | null;
  venueId: string | null;
  matchDurationMinutes: number;
  matchWinGoalDiff: number;
  canCaptainEditRules: boolean;
  pointsWin: number;
  pointsDraw: number;
  pointsLoss: number;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ChampionshipTeam = {
  id: string;
  championshipId: string;
  name: string;
  color: string;
  seed: number | null;
  isBye: boolean;
  players?: ChampionshipTeamPlayer[];
};

export type ChampionshipTeamPlayer = {
  id: string;
  championshipTeamId: string;
  userId: string | null;
  guestName: string | null;
  isCaptain: boolean;
  // enriched
  userName?: string | null;
  userImage?: string | null;
};

export type ChampionshipRound = {
  id: string;
  phaseId: string;
  roundNumber: number;
  scheduledAt: string | null;
  matches?: ChampionshipMatch[];
};

export type ChampionshipMatch = {
  id: string;
  roundId: string;
  homeTeamId: string;
  awayTeamId: string;
  eventId: string | null;
  homeScore: number | null;
  awayScore: number | null;
  status: MatchStatus;
  playedAt: string | null;
  // enriched
  homeTeam?: ChampionshipTeam;
  awayTeam?: ChampionshipTeam;
};

export type ChampionshipStanding = {
  teamId: string;
  teamName: string;
  teamColor: string;
  gamesPlayed: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDiff: number;
  points: number;
  position?: number; // set by the API after sorting
};

// ── Mapper helpers ───────────────────────────────────────────

export function rowToChampionship(r: ChampionshipRow): Championship {
  return {
    id: r.id,
    groupId: r.group_id,
    name: r.name,
    description: r.description,
    format: r.format,
    teamFormation: r.team_formation,
    status: r.status,
    startsAt: r.starts_at,
    endsAt: r.ends_at,
    venueId: r.venue_id,
    matchDurationMinutes: r.match_duration_minutes,
    matchWinGoalDiff: r.match_win_goal_diff,
    canCaptainEditRules: r.can_captain_edit_rules,
    pointsWin: r.points_win,
    pointsDraw: r.points_draw,
    pointsLoss: r.points_loss,
    createdBy: r.created_by,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

export function rowToStanding(r: ChampionshipStandingRow, position: number): ChampionshipStanding {
  return {
    teamId: r.team_id,
    teamName: r.team_name,
    teamColor: r.team_color,
    gamesPlayed: Number(r.games_played),
    wins: Number(r.wins),
    draws: Number(r.draws),
    losses: Number(r.losses),
    goalsFor: Number(r.goals_for),
    goalsAgainst: Number(r.goals_against),
    goalDiff: Number(r.goal_diff),
    points: Number(r.points),
    position,
  };
}
