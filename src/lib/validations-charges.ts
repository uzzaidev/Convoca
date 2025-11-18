import { z } from "zod";

// Schema para criar cobrança
export const createChargeSchema = z.object({
  userId: z.string().uuid("ID do usuário inválido"),
  type: z.enum(["monthly", "daily", "fine", "other"], {
    errorMap: () => ({ message: "Tipo de cobrança inválido" }),
  }),
  amountCents: z.number().int().min(1, "Valor deve ser maior que zero"),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data deve estar no formato YYYY-MM-DD").optional(),
  description: z.string().optional(),
  eventId: z.string().uuid("ID do evento inválido").optional().nullable(),
});

// Schema para atualizar status de cobrança
export const updateChargeStatusSchema = z.object({
  status: z.enum(["pending", "paid", "canceled"], {
    errorMap: () => ({ message: "Status inválido" }),
  }),
});

export type CreateChargeInput = z.infer<typeof createChargeSchema>;
export type UpdateChargeStatusInput = z.infer<typeof updateChargeStatusSchema>;
