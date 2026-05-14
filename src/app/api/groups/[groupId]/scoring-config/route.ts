import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-helpers";
import { sql } from "@/db/client";
import logger from "@/lib/logger";
import { z } from "zod";
import { requireGroupAccess } from "@/lib/group-access";
import { handleRouteError } from "@/lib/route-errors";

type Params = Promise<{ groupId: string }>;

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

const DEFAULT_TIEBREAKERS: TiebreakerKey[] = [
  "wins",
  "goal_difference",
  "goals",
  "games_played",
];

const DEFAULT_CONFIG = {
  pointsWin: 3,
  pointsDraw: 1,
  pointsLoss: 0,
  pointsGoal: 0,
  pointsAssist: 0,
  pointsMvp: 0,
  pointsPresence: 0,
  rankingMode: "standard" as const,
  tiebreakers: DEFAULT_TIEBREAKERS,
};

const scoringConfigSchema = z.object({
  pointsWin: z.number().min(0).max(10),
  pointsDraw: z.number().min(0).max(10),
  pointsLoss: z.number().min(0).max(10),
  pointsGoal: z.number().min(0).max(10),
  pointsAssist: z.number().min(0).max(10),
  pointsMvp: z.number().min(0).max(10),
  pointsPresence: z.number().min(0).max(10),
  rankingMode: z.enum(["standard", "complete"]),
  tiebreakers: z
    .array(z.enum(TIEBREAKER_KEYS))
    .max(TIEBREAKER_KEYS.length)
    .refine((arr) => new Set(arr).size === arr.length, {
      message: "Critérios de desempate duplicados",
    })
    .refine(
      (arr) =>
        !(arr.includes("games_played") && arr.includes("games_played_asc")),
      { message: "Use 'mais jogos' OU 'menos jogos', não os dois" }
    ),
});

export type ScoringConfig = z.infer<typeof scoringConfigSchema>;

function normalizeTiebreakers(raw: unknown): TiebreakerKey[] {
  if (!Array.isArray(raw)) return DEFAULT_TIEBREAKERS;
  const seen = new Set<string>();
  const out: TiebreakerKey[] = [];
  for (const item of raw) {
    if (typeof item !== "string") continue;
    if (!(TIEBREAKER_KEYS as readonly string[]).includes(item)) continue;
    if (seen.has(item)) continue;
    seen.add(item);
    out.push(item as TiebreakerKey);
  }
  return out;
}

// GET /api/groups/:groupId/scoring-config - Get scoring configuration for group
export async function GET(
  request: NextRequest,
  { params }: { params: Params }
) {
  try {
    const { groupId } = await params;
    const user = await requireAuth();

    await requireGroupAccess(groupId, user);

    const [row] = await sql`
      SELECT
        points_win as "pointsWin",
        points_draw as "pointsDraw",
        points_loss as "pointsLoss",
        points_goal as "pointsGoal",
        points_assist as "pointsAssist",
        points_mvp as "pointsMvp",
        points_presence as "pointsPresence",
        ranking_mode as "rankingMode",
        tiebreakers
      FROM scoring_configs
      WHERE group_id = ${groupId}
    `;

    if (!row) {
      return NextResponse.json({ config: DEFAULT_CONFIG });
    }

    return NextResponse.json({
      config: { ...row, tiebreakers: normalizeTiebreakers(row.tiebreakers) },
    });
  } catch (error) {
    return handleRouteError(error, {
      logMessage: "Error getting scoring config",
      fallbackMessage: "Erro ao buscar configuração de pontuação",
    });
  }
}

// PATCH /api/groups/:groupId/scoring-config - Update scoring configuration for group
export async function PATCH(
  request: NextRequest,
  { params }: { params: Params }
) {
  try {
    const { groupId } = await params;
    const user = await requireAuth();

    const body = await request.json();
    const validation = scoringConfigSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: "Configuração inválida", details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const config = validation.data;

    await requireGroupAccess(groupId, user, {
      minRole: "admin",
      adminErrorMessage: "Apenas admins podem alterar configurações de pontuação",
    });

    await sql`
      INSERT INTO scoring_configs (
        group_id,
        points_win,
        points_draw,
        points_loss,
        points_goal,
        points_assist,
        points_mvp,
        points_presence,
        ranking_mode,
        tiebreakers,
        created_by,
        updated_at
      ) VALUES (
        ${groupId},
        ${config.pointsWin},
        ${config.pointsDraw},
        ${config.pointsLoss},
        ${config.pointsGoal},
        ${config.pointsAssist},
        ${config.pointsMvp},
        ${config.pointsPresence},
        ${config.rankingMode},
        ${JSON.stringify(config.tiebreakers)}::jsonb,
        ${user.id},
        NOW()
      )
      ON CONFLICT (group_id)
      DO UPDATE SET
        points_win = EXCLUDED.points_win,
        points_draw = EXCLUDED.points_draw,
        points_loss = EXCLUDED.points_loss,
        points_goal = EXCLUDED.points_goal,
        points_assist = EXCLUDED.points_assist,
        points_mvp = EXCLUDED.points_mvp,
        points_presence = EXCLUDED.points_presence,
        ranking_mode = EXCLUDED.ranking_mode,
        tiebreakers = EXCLUDED.tiebreakers,
        updated_at = NOW()
    `;

    logger.info({ groupId, userId: user.id, config }, "Scoring config updated");

    return NextResponse.json({ success: true, config });
  } catch (error) {
    return handleRouteError(error, {
      logMessage: "Error saving scoring config",
      fallbackMessage: "Erro ao salvar configuração de pontuação",
    });
  }
}
