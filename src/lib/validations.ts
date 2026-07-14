import { z } from "zod";
import { groupStatusValues } from "@/lib/group-status";
import { isSeasonDateInput } from "@/lib/season-dates";

export const createGroupSchema = z.object({
  name: z.string().min(3, "Nome deve ter no minimo 3 caracteres"),
  description: z.string().optional(),
  privacy: z.enum(["private", "public"]).default("private"),
  appMode: z.enum(["ranking", "control"]).default("ranking"),
  planId: z.string().uuid().optional(),
});

export const createEventSchema = z.object({
  groupId: z.string().uuid(),
  startsAt: z.string().datetime(),
  venueId: z.string().uuid().optional(),
  maxPlayers: z.number().int().min(4).max(30).default(10),
  maxGoalkeepers: z.number().int().min(0).max(4).default(2),
  waitlistEnabled: z.boolean().default(true),
  listOpensAt: z.string().datetime().optional(),
});

export const createRecurrenceSchema = z.object({
  groupId: z.string().uuid(),
  frequency: z.enum(["weekly", "biweekly", "monthly"]),
  dayOfWeek: z.number().int().min(0).max(6),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, "Formato HH:MM"),
  venueId: z.string().uuid().optional(),
  maxPlayers: z.number().int().min(4).max(30).default(10),
  maxGoalkeepers: z.number().int().min(0).max(4).default(2),
  waitlistEnabled: z.boolean().default(true),
  listOpensHoursBefore: z.number().int().min(0).max(168).default(48),
});

export const rsvpSchema = z.object({
  eventId: z.string().uuid(),
  status: z.enum(["yes", "no", "waitlist"]),
  role: z.enum(["gk", "line"]).default("line"),
  preferredPosition: z.enum(["gk", "defender", "midfielder", "forward"]).nullish(),
  secondaryPosition: z.enum(["gk", "defender", "midfielder", "forward"]).nullish(),
});

export const eventActionSchema = z.object({
  eventId: z.string().uuid(),
  actorUserId: z.string().uuid(),
  actionType: z.enum([
    "goal",
    "assist",
    "save",
    "tackle",
    "error",
    "yellow_card",
    "red_card",
    "period_start",
    "period_end",
    "own_goal",
  ]),
  subjectUserId: z.string().uuid().optional(),
  teamId: z.string().uuid().optional(),
  minute: z.number().int().min(0).optional(),
  metadata: z.record(z.any()).optional(),
});

export const playerRatingSchema = z.object({
  eventId: z.string().uuid(),
  ratedUserId: z.string().uuid(),
});

export const createSeasonSchema = z.object({
  name: z.string().min(1, "Nome e obrigatorio").max(100),
  startsAt: z.string().refine(isSeasonDateInput, "Data de inicio invalida"),
  endsAt: z.string().refine(isSeasonDateInput, "Data de fim invalida"),
});

export const updateSeasonSchema = z.object({
  name: z.string().min(1, "Nome e obrigatorio").max(100).optional(),
  startsAt: z.string().refine(isSeasonDateInput, "Data de inicio invalida").optional(),
  endsAt: z.string().refine(isSeasonDateInput, "Data de fim invalida").optional(),
});

export const updateGroupStatusSchema = z.object({
  status: z.enum(["pending_payment", "active", "inactive", "rejected"], {
    errorMap: () => ({ message: "Status invalido" }),
  }),
  reason: z
    .string()
    .trim()
    .max(500, "Motivo deve ter no maximo 500 caracteres")
    .optional(),
});

export type CreateGroupInput = z.infer<typeof createGroupSchema>;
export type CreateEventInput = z.infer<typeof createEventSchema>;
export type CreateRecurrenceInput = z.infer<typeof createRecurrenceSchema>;
export type RsvpInput = z.infer<typeof rsvpSchema>;
export type EventActionInput = z.infer<typeof eventActionSchema>;
export type PlayerRatingInput = z.infer<typeof playerRatingSchema>;
export type CreateSeasonInput = z.infer<typeof createSeasonSchema>;
export type UpdateSeasonInput = z.infer<typeof updateSeasonSchema>;
export type UpdateGroupStatusInput = z.infer<typeof updateGroupStatusSchema>;

// ── Campeonatos ───────────────────────────────────────────────

export const createChampionshipSchema = z.object({
  groupId: z.string().uuid(),
  name: z.string().min(2, "Nome deve ter no mínimo 2 caracteres").max(255),
  description: z.string().max(1000).optional(),
  format: z.enum(["round_robin", "single_elimination", "double_elimination", "mixed"]).default("round_robin"),
  teamFormation: z.enum(["manual", "draw"]).default("manual"),
  startsAt: z.string().optional(),
  endsAt: z.string().optional(),
  venueId: z.string().uuid().optional(),
  matchDurationMinutes: z.number().int().min(1).max(120).default(10),
  matchWinGoalDiff: z.number().int().min(1).max(20).default(2),
  canCaptainEditRules: z.boolean().default(false),
  pointsWin: z.number().int().min(0).max(10).default(3),
  pointsDraw: z.number().int().min(0).max(10).default(1),
  pointsLoss: z.number().int().min(0).max(10).default(0),
});

export const updateChampionshipSchema = createChampionshipSchema
  .omit({ groupId: true, format: true })
  .partial();

export const createChampionshipTeamSchema = z.object({
  name: z.string().min(1, "Nome obrigatório").max(100),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Cor inválida (hex #RRGGBB)").default("#6b7280"),
  seed: z.number().int().min(1).optional(),
  playerIds: z.array(z.string().uuid()).min(1, "Time precisa de ao menos 1 jogador"),
  captainId: z.string().uuid().optional(),
});

export const updateChampionshipMatchSchema = z.object({
  action: z.enum(["start"]).optional(),
  homeScore: z.number().int().min(0).optional(),
  awayScore: z.number().int().min(0).optional(),
  playedAt: z.string().datetime().optional(),
});

export const generateRoundsSchema = z.object({
  // Optional: override scheduled times for each round
  roundSchedules: z.array(z.object({
    roundNumber: z.number().int().min(1),
    scheduledAt: z.string().datetime(),
  })).optional(),
  // Auto-create events in group calendar for each match
  autoCreateEvents: z.boolean().default(true),
  defaultEventStartTime: z.string().regex(/^\d{2}:\d{2}$/, "Formato HH:MM").optional(),
});

export type CreateChampionshipInput = z.infer<typeof createChampionshipSchema>;
export type UpdateChampionshipInput = z.infer<typeof updateChampionshipSchema>;
export type CreateChampionshipTeamInput = z.infer<typeof createChampionshipTeamSchema>;
export type UpdateChampionshipMatchInput = z.infer<typeof updateChampionshipMatchSchema>;
export type GenerateRoundsInput = z.infer<typeof generateRoundsSchema>;
