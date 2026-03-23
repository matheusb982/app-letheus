"use client";

import { Input } from "@/components/ui/input";
import { CurrencyInput } from "@/components/shared/currency-input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SubmitButton } from "@/components/shared/submit-button";
import { toast } from "sonner";
import type { SerializedPurchase } from "@/lib/actions/purchase-actions";
import type { SerializedSubcategory } from "@/lib/actions/category-actions";

interface PurchaseFormProps {
  purchase?: SerializedPurchase;
  subcategories: SerializedSubcategory[];
  action: (data: FormData) => Promise<{ error?: string; success?: boolean }>;
  onSuccess?: () => void;
}

export function PurchaseForm({ purchase, subcategories, action, onSuccess }: PurchaseFormProps) {
  async function handleSubmit(formData: FormData) {
    const result = await action(formData);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success(purchase ? "Despesa atualizada!" : "Despesa criada!");
      onSuccess?.();
    }
  }

  return (
    <form action={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="subcategory_id">Subcategoria</Label>
        <Select name="subcategory_id" defaultValue={purchase?.subcategory_id}>
          <SelectTrigger>
            <SelectValue placeholder="Selecione..." />
          </SelectTrigger>
          <SelectContent>
            {subcategories.map((s) => (
              <SelectItem key={s.id} value={s.id}>
                {s.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="value">Valor</Label>
        <CurrencyInput
          id="value"
          name="value"
          defaultValue={purchase?.value}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="purchase_date">Data</Label>
        <Input
          id="purchase_date"
          name="purchase_date"
          type="date"
          defaultValue={purchase?.purchase_date}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="purchase_type">Tipo</Label>
        <Select name="purchase_type" defaultValue={purchase?.purchase_type ?? "credit"}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="debit">Débito</SelectItem>
            <SelectItem value="credit">Crédito</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Descrição</Label>
        <Input
          id="description"
          name="description"
          defaultValue={purchase?.description}
        />
      </div>

      <SubmitButton />
    </form>
  );
}
