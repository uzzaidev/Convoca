import { z } from "zod";

export const createGroupSchema = z.object({
  name: z.string().min(3, "Nome deve ter no mínimo 3 caracteres"),
  description: z.string().optional(),
  privacy: z.enum(["private", "public"]).default("private"),
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
  preferredPosition: z.enum(["gk", "defender", "midfielder", "forward"]).optional(),
  secondaryPosition: z.enum(["gk", "defender", "midfielder", "forward"]).optional(),
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

export type CreateGroupInput = z.infer<typeof createGroupSchema>;
export type CreateEventInput = z.infer<typeof createEventSchema>;
export type CreateRecurrenceInput = z.infer<typeof createRecurrenceSchema>;
export type RsvpInput = z.infer<typeof rsvpSchema>;
export type EventActionInput = z.infer<typeof eventActionSchema>;
export type PlayerRatingInput = z.infer<typeof playerRatingSchema>;
