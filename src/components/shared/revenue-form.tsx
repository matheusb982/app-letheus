"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/shared/submit-button";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { SerializedRevenue } from "@/lib/actions/revenue-actions";

interface RevenueFormProps {
  revenue?: SerializedRevenue;
  action: (data: FormData) => Promise<{ error?: string; success?: boolean }>;
}

export function RevenueForm({ revenue, action }: RevenueFormProps) {
  const router = useRouter();

  async function handleSubmit(formData: FormData) {
    const result = await action(formData);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success(revenue ? "Receita atualizada!" : "Receita criada!");
      router.push("/revenues");
    }
  }

  return (
    <form action={handleSubmit} className="space-y-4 max-w-lg">
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
