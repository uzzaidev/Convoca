import { getCurrentUser } from "@/lib/auth-helpers";
import { sql } from "@/db/client";
import { redirect, notFound } from "next/navigation";
import { getGroupAccessContext } from "@/lib/group-access";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import {
  ChampionshipDetail,
  type ChampionshipData,
  type TeamData,
  type MemberOption,
} from "@/components/championships/championship-detail";
import { rowToStanding, type ChampionshipStandingRow } from "@/types/championship";

type RouteParams = { params: Promise<{ groupId: string; championshipId: string }> };

export default async function ChampionshipDetailPage({ params }: RouteParams) {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/signin");

  const { groupId, championshipId } = await params;
  const group = await getGroupAccessContext(groupId, user);
  if (!group || (!group.userRole && !group.isSystemAdmin)) redirect("/dashboard");

  const [champ] = await sql`
    SELECT * FROM championships WHERE id = ${championshipId} AND group_id = ${groupId}
  `;
  if (!champ) notFound();

  const isNotDraft = champ.status !== "draft";

  // Parallelizar todas as queries independentes
  const [teamsRows, membersRows, roundsRows, standingsRows, topScorersRows] = await Promise.all([
    sql`
      SELECT
        ct.id,
        ct.name,
        ct.color,
        ct.seed,
        COALESCE(
          json_agg(
            json_build_object(
              'id', ctp.id,
              'userId', ctp.user_id,
              'userName', u.name,
              'isCaptain', ctp.is_captain
            ) ORDER BY ctp.created_at
          ) FILTER (WHERE ctp.id IS NOT NULL),
          '[]'
        ) AS players
      FROM championship_teams ct
      LEFT JOIN championship_team_players ctp ON ctp.championship_team_id = ct.id
      LEFT JOIN users u ON u.id = ctp.user_id
      WHERE ct.championship_id = ${championshipId} AND ct.is_bye = FALSE
      GROUP BY ct.id
      ORDER BY ct.seed NULLS LAST, ct.created_at
    `,
    sql`
      SELECT u.id, u.name
      FROM group_members gm
      JOIN users u ON u.id = gm.user_id
      WHERE gm.group_id = ${groupId}
      ORDER BY u.name
    `,
    isNotDraft
      ? sql`
          SELECT
            cr.id,
            cr.round_number,
            cr.name AS round_name,
            cr.scheduled_at,
            COALESCE(
              json_agg(
                json_build_object(
                  'id',            cm.id,
                  'homeTeamId',    cm.home_team_id,
                  'awayTeamId',    cm.away_team_id,
                  'homeTeamName',  ht.name,
                  'awayTeamName',  at.name,
                  'homeTeamColor', ht.color,
                  'awayTeamColor', at.color,
                  'homeScore',     cm.home_score,
                  'awayScore',     cm.away_score,
                  'status',        cm.status,
                  'eventId',       cm.event_id,
                  'matchPosition', cm.match_position
                ) ORDER BY cm.match_position NULLS LAST, cm.created_at
              ) FILTER (WHERE cm.id IS NOT NULL),
              '[]'
            ) AS matches
          FROM championship_phases cp
          JOIN championship_rounds cr ON cr.phase_id = cp.id
          LEFT JOIN championship_matches cm ON cm.round_id = cr.id
          LEFT JOIN championship_teams ht ON ht.id = cm.home_team_id
          LEFT JOIN championship_teams at ON at.id = cm.away_team_id
          WHERE cp.championship_id = ${championshipId}
          GROUP BY cr.id, cr.round_number, cr.name, cr.scheduled_at
          ORDER BY cr.round_number
        `
      : Promise.resolve([]),
    isNotDraft
      ? sql`
          SELECT *
          FROM mv_championship_standings
          WHERE championship_id = ${championshipId}
          ORDER BY points DESC, wins DESC, goal_diff DESC, goals_for DESC, team_name
        `
      : Promise.resolve([]),
    isNotDraft
      ? sql`
          SELECT
            u.id        AS user_id,
            u.name      AS user_name,
            u.image     AS user_image,
            ct.name     AS team_name,
            ct.color    AS team_color,
            COUNT(*)    AS goals
          FROM event_actions ea
          JOIN events e ON e.id = ea.event_id
          JOIN championship_matches cm ON cm.event_id = e.id
          JOIN championship_rounds cr ON cr.id = cm.round_id
          JOIN championship_phases cp ON cp.id = cr.phase_id
          JOIN users u ON u.id = ea.actor_user_id
          JOIN championship_team_players ctp ON ctp.user_id = u.id
          JOIN championship_teams ct ON ct.id = ctp.championship_team_id
            AND ct.championship_id = ${championshipId}
          WHERE cp.championship_id = ${championshipId}
            AND ea.action_type = 'goal'
          GROUP BY u.id, u.name, u.image, ct.name, ct.color
          ORDER BY goals DESC, u.name
          LIMIT 10
        `
      : Promise.resolve([]),
  ]);

  const initialStandings = (standingsRows as unknown as ChampionshipStandingRow[]).map(
    (r, i) => rowToStanding(r, i + 1)
  );

  const isAdmin = group.userRole === "admin" || !!group.isSystemAdmin;

  const championship: ChampionshipData = {
    id: champ.id,
    name: champ.name,
    description: champ.description,
    status: champ.status,
    format: champ.format,
    teamFormation: champ.team_formation,
    startsAt: champ.starts_at,
    endsAt: champ.ends_at,
    matchDurationMinutes: champ.match_duration_minutes,
    matchWinGoalDiff: champ.match_win_goal_diff,
    pointsWin: champ.points_win,
    pointsDraw: champ.points_draw,
    pointsLoss: champ.points_loss,
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        <div className="mb-6">
          <Link
            href={`/groups/${groupId}/championships`}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            Campeonatos
          </Link>
        </div>

        <ChampionshipDetail
          groupId={groupId}
          championship={championship}
          teams={teamsRows as unknown as TeamData[]}
          members={membersRows as unknown as MemberOption[]}
          initialRounds={roundsRows as unknown as any[]}
          initialStandings={initialStandings}
          initialTopScorers={topScorersRows as unknown as any[]}
          isAdmin={isAdmin}
          currentUserId={user.id}
        />
      </div>
    </div>
  );
}
