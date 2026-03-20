"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SubmitButton } from "@/components/shared/submit-button";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { SerializedSubcategory } from "@/lib/actions/category-actions";

interface SubcategoryEntityFormProps {
  entity?: { id: string; value: number; subcategory_id: string; subcategory_name: string };
  subcategories: SerializedSubcategory[];
  action: (data: FormData) => Promise<{ error?: string; success?: boolean }>;
  entityName: string;
  returnPath: string;
}

export function SubcategoryEntityForm({
  entity,
  subcategories,
  action,
  entityName,
  returnPath,
}: SubcategoryEntityFormProps) {
  const router = useRouter();

  async function handleSubmit(formData: FormData) {
    const result = await action(formData);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success(entity ? `${entityName} atualizado!` : `${entityName} criado!`);
      router.push(returnPath);
    }
  }

  return (
    <form action={handleSubmit} className="space-y-4 max-w-lg">
      <div className="space-y-2">
        <Label htmlFor="value">Valor</Label>
        <Input id="value" name="value" type="number" step="0.01" defaultValue={entity?.value} required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="subcategory_id">Subcategoria</Label>
        <Select name="subcategory_id" defaultValue={entity?.subcategory_id}>
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
      <SubmitButton />
    </form>
  );
}
