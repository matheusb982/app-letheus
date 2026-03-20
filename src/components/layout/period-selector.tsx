"use client";

import { useTransition } from "react";
import { setPeriod, createNewPeriod } from "@/lib/actions/period-actions";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";

type PeriodOption = {
  id: string;
  label: string;
};

interface PeriodSelectorProps {
  periods: PeriodOption[];
  currentPeriodId: string | null;
  canCreateNew: boolean;
}

export function PeriodSelector({
  periods,
  currentPeriodId,
  canCreateNew,
}: PeriodSelectorProps) {
  const [isPending, startTransition] = useTransition();

  function handlePeriodChange(value: string) {
    startTransition(async () => {
      await setPeriod(value);
      toast.success("Período alterado");
    });
  }

  function handleCreateNew() {
    startTransition(async () => {
      await createNewPeriod();
      toast.success("Novo período criado");
    });
  }

  return (
    <div className="flex items-center gap-2">
      <Select
        value={currentPeriodId ?? undefined}
        onValueChange={handlePeriodChange}
        disabled={isPending}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Selecione o período" />
        </SelectTrigger>
        <SelectContent>
          {periods.map((p) => (
            <SelectItem key={p.id} value={p.id}>
              {p.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {canCreateNew && (
        <Button
          variant="outline"
          size="icon"
          onClick={handleCreateNew}
          disabled={isPending}
          title="Criar novo período"
        >
          {isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Plus className="h-4 w-4" />
          )}
        </Button>
      )}
    </div>
  );
}
