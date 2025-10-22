import { z } from "zod";

export const createGroupSchema = z.object({
  name: z.string().min(2).max(120),
  description: z.string().max(500).optional(),
  createdBy: z.string().uuid(),
});

export const createEventSchema = z.object({
  groupId: z.string().uuid(),
  startsAt: z.string().datetime(),
  maxPlayers: z.number().int().positive(),
  maxGoalkeepers: z.number().int().positive().default(2),
  createdBy: z.string().uuid(),
});

export const rsvpSchema = z.object({
  status: z.enum(["yes", "no", "waitlist"]),
  role: z.enum(["gk", "line"]).default("line"),
});

export const actionSchema = z.object({
  actionType: z.enum(["goal", "assist", "save", "tackle", "error", "card", "period_start", "period_end"]),
  actorUserId: z.string().uuid(),
  subjectUserId: z.string().uuid().optional(),
  teamId: z.string().uuid().optional(),
  minuteTs: z.number().int().nonnegative().optional(),
  metadata: z.record(z.any()).optional(),
});
