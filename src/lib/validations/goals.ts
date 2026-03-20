import { z } from "zod";

export const goalSchema = z.object({
  value: z.coerce.number().positive("Valor deve ser positivo"),
  subcategory_id: z.string().min(1, "Subcategoria é obrigatória"),
});

export type GoalInput = z.infer<typeof goalSchema>;
