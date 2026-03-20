import { z } from "zod";

export const revenueSchema = z.object({
  value: z.coerce.number().positive("Valor deve ser positivo"),
  name: z.string().min(1, "Nome é obrigatório"),
  description: z.string().optional(),
});

export type RevenueInput = z.infer<typeof revenueSchema>;
