import { z } from "zod";

export const purchaseSchema = z.object({
  value: z.coerce.number().positive("Valor deve ser positivo"),
  purchase_date: z.string().min(1, "Data é obrigatória"),
  purchase_type: z.enum(["debit", "credit"], { required_error: "Tipo é obrigatório" }),
  description: z.string().optional(),
  subcategory_id: z.string().optional(),
});

export type PurchaseInput = z.infer<typeof purchaseSchema>;
