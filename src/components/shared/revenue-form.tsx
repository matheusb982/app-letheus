"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/shared/submit-button";
import { toast } from "sonner";
import type { SerializedRevenue } from "@/lib/actions/revenue-actions";

interface RevenueFormProps {
  revenue?: SerializedRevenue;
  action: (data: FormData) => Promise<{ error?: string; success?: boolean }>;
  onSuccess?: () => void;
}

export function RevenueForm({ revenue, action, onSuccess }: RevenueFormProps) {
  async function handleSubmit(formData: FormData) {
    const result = await action(formData);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success(revenue ? "Receita atualizada!" : "Receita criada!");
      onSuccess?.();
    }
  }

  return (
    <form action={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Nome</Label>
        <Input id="name" name="name" defaultValue={revenue?.name} required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="value">Valor</Label>
        <Input id="value" name="value" type="number" step="0.01" defaultValue={revenue?.value} required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="description">Descrição</Label>
        <Input id="description" name="description" defaultValue={revenue?.description} />
      </div>
      <SubmitButton />
    </form>
  );
}
