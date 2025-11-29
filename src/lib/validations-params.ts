import { z } from "zod";

/**
 * UUID validation schemas for route parameters
 * Use these to validate IDs before using them in database queries
 */

export const uuidSchema = z.string().uuid("ID inválido");

export const groupIdSchema = z.object({
  groupId: z.string().uuid("ID do grupo inválido"),
});

export const eventIdSchema = z.object({
  eventId: z.string().uuid("ID do evento inválido"),
});

export const userIdSchema = z.object({
  userId: z.string().uuid("ID do usuário inválido"),
});

export const groupUserIdSchema = z.object({
  groupId: z.string().uuid("ID do grupo inválido"),
  userId: z.string().uuid("ID do usuário inválido"),
});

export const groupEventIdSchema = z.object({
  groupId: z.string().uuid("ID do grupo inválido"),
  eventId: z.string().uuid("ID do evento inválido"),
});

export const chargeIdSchema = z.object({
  chargeId: z.string().uuid("ID da cobrança inválido"),
});

export const groupChargeIdSchema = z.object({
  groupId: z.string().uuid("ID do grupo inválido"),
  chargeId: z.string().uuid("ID da cobrança inválido"),
});

export const inviteIdSchema = z.object({
  inviteId: z.string().uuid("ID do convite inválido"),
});

export const groupInviteIdSchema = z.object({
  groupId: z.string().uuid("ID do grupo inválido"),
  inviteId: z.string().uuid("ID do convite inválido"),
});

/**
 * Helper function to validate params and return typed result
 */
export function validateParams<T>(
  params: unknown,
  schema: z.ZodSchema<T>
): { success: true; data: T } | { success: false; error: string } {
  try {
    const data = schema.parse(params);
    return { success: true, data };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message };
    }
    return { success: false, error: "Parâmetros inválidos" };
  }
}
