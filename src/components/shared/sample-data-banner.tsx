"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Loader2, Trash2 } from "lucide-react";
import { clearSampleData } from "@/lib/actions/onboarding-actions";

export function SampleDataBanner() {
  const [isPending, startTransition] = useTransition();

  function handleClear() {
    startTransition(async () => {
      await clearSampleData();
    });
  }

  return (
    <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 flex items-center justify-between gap-3">
      <div className="flex items-center gap-2 min-w-0">
        <AlertTriangle className="size-4 text-amber-500 shrink-0" />
        <p className="text-sm text-amber-700 dark:text-amber-400">
          Você está vendo <strong>dados de exemplo</strong>. Importe seu extrato ou limpe os dados para começar do zero.
        </p>
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={handleClear}
        disabled={isPending}
        className="shrink-0 border-amber-500/30 text-amber-700 hover:bg-amber-500/20 dark:text-amber-400"
      >
        {isPending ? (
          <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
        ) : (
          <Trash2 className="mr-1.5 h-3.5 w-3.5" />
        )}
        Limpar exemplos
      </Button>
    </div>
  );
}
