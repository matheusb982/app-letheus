"use client";

import { useState, useTransition, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Sparkles, Loader2, TrendingUp, TrendingDown, Minus, Check, ArrowRight, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/utils/format";
import { toast } from "sonner";
import {
  getGoalSuggestions,
  applyGoalSuggestions,
  type GoalSuggestionsResult,
} from "@/lib/actions/goal-suggestions";
import { useRouter } from "next/navigation";

function formatBRL(cents: number): string {
  const reais = cents / 100;
  return reais.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function parseCentsFromDisplay(display: string): number {
  const digits = display.replace(/\D/g, "");
  return parseInt(digits || "0", 10);
}

export function ReviewGoalsDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, startLoading] = useTransition();
  const [applying, startApplying] = useTransition();
  const [data, setData] = useState<GoalSuggestionsResult | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [editedValues, setEditedValues] = useState<Map<string, number>>(new Map());

  const getEffectiveValue = useCallback((goalId: string, originalSuggested: number) => {
    return editedValues.get(goalId) ?? originalSuggested;
  }, [editedValues]);

  const totalEdited = data
    ? data.suggestions.reduce((sum, s) => sum + getEffectiveValue(s.goal_id, s.suggested_value), 0)
    : 0;

  function handleOpen() {
    setOpen(true);
    setData(null);
    setSelected(new Set());
    setEditedValues(new Map());
    startLoading(async () => {
      const result = await getGoalSuggestions();
      setData(result);
      const auto = new Set<string>();
      for (const s of result.suggestions) {
        if (Math.abs(s.suggested_value - s.current_value) > 0.01) {
          auto.add(s.goal_id);
        }
      }
      setSelected(auto);
    });
  }

  function toggleSelect(goalId: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(goalId)) next.delete(goalId);
      else next.add(goalId);
      return next;
    });
  }

  function toggleAll() {
    if (!data) return;
    const changedIds = data.suggestions
      .filter((s) => Math.abs(getEffectiveValue(s.goal_id, s.suggested_value) - s.current_value) > 0.01)
      .map((s) => s.goal_id);
    if (selected.size === changedIds.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(changedIds));
    }
  }

  function handleEditValue(goalId: string, cents: number) {
    const value = Math.round(cents) / 100;
    setEditedValues((prev) => {
      const next = new Map(prev);
      next.set(goalId, value);
      return next;
    });
    // Auto-select when user edits a value
    setSelected((prev) => {
      if (prev.has(goalId)) return prev;
      const next = new Set(prev);
      next.add(goalId);
      return next;
    });
  }

  function resetValue(goalId: string) {
    setEditedValues((prev) => {
      const next = new Map(prev);
      next.delete(goalId);
      return next;
    });
  }

  function handleApply() {
    if (!data) return;
    const updates = data.suggestions
      .filter((s) => selected.has(s.goal_id))
      .map((s) => ({ goal_id: s.goal_id, value: getEffectiveValue(s.goal_id, s.suggested_value) }));

    if (updates.length === 0) {
      toast.info("Nenhuma sugestao selecionada");
      return;
    }

    startApplying(async () => {
      const result = await applyGoalSuggestions(updates);
      if (result.success) {
        toast.success(`${result.updated} metas atualizadas!`);
        setOpen(false);
        router.refresh();
      }
    });
  }

  const trendIcon = {
    up: <TrendingUp className="h-3.5 w-3.5 text-red-500" />,
    down: <TrendingDown className="h-3.5 w-3.5 text-emerald-500" />,
    stable: <Minus className="h-3.5 w-3.5 text-muted-foreground" />,
  };

  const trendLabel = {
    up: <Badge variant="outline" className="text-red-600 border-red-200 text-[10px]">Subindo</Badge>,
    down: <Badge variant="outline" className="text-emerald-600 border-emerald-200 text-[10px]">Caindo</Badge>,
    stable: <Badge variant="outline" className="text-[10px]">Estavel</Badge>,
  };

  const changedCount = data?.suggestions.filter(
    (s) => Math.abs(getEffectiveValue(s.goal_id, s.suggested_value) - s.current_value) > 0.01
  ).length ?? 0;

  return (
    <>
      <Button variant="outline" onClick={handleOpen}>
        <Sparkles className="mr-2 h-4 w-4" />
        Revisar com IA
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-violet-500" />
              Revisar Metas com IA
            </DialogTitle>
          </DialogHeader>

          {loading ? (
            <div className="flex flex-col items-center gap-3 py-12">
              <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
              <p className="text-sm text-muted-foreground">Analisando historico e gerando sugestoes...</p>
            </div>
          ) : data ? (
            <div className="space-y-4">
              {/* Summary cards */}
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground">Receita Mensal</p>
                  <p className="text-sm font-semibold text-emerald-600">{formatCurrency(data.total_revenue)}</p>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground">Total Metas Atual</p>
                  <p className="text-sm font-semibold">{formatCurrency(data.total_current_goals)}</p>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground">Total Sugerido</p>
                  <p className={cn(
                    "text-sm font-semibold",
                    totalEdited < data.total_current_goals ? "text-emerald-600" : "text-amber-600"
                  )}>
                    {formatCurrency(totalEdited)}
                  </p>
                </div>
              </div>

              {/* Suggestions table */}
              <div className="overflow-auto border rounded-md max-h-[45vh]">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 sticky top-0">
                    <tr>
                      <th className="p-2 text-left w-8">
                        <Checkbox
                          checked={selected.size === changedCount && changedCount > 0}
                          onCheckedChange={toggleAll}
                        />
                      </th>
                      <th className="p-2 text-left font-medium">Subcategoria</th>
                      <th className="p-2 text-center font-medium">Tendencia</th>
                      <th className="p-2 text-right font-medium">Media 3m</th>
                      <th className="p-2 text-right font-medium">Atual</th>
                      <th className="p-2 text-center font-medium"></th>
                      <th className="p-2 text-right font-medium">Sugestao IA</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {data.suggestions.map((s) => {
                      const effectiveValue = getEffectiveValue(s.goal_id, s.suggested_value);
                      const changed = Math.abs(effectiveValue - s.current_value) > 0.01;
                      const isEdited = editedValues.has(s.goal_id);
                      const pctDiff = s.current_value > 0
                        ? ((effectiveValue - s.current_value) / s.current_value * 100)
                        : 0;
                      const cents = Math.round(effectiveValue * 100);

                      return (
                        <tr key={s.goal_id} className={cn(!changed && !isEdited && "opacity-60")}>
                          <td className="p-2">
                            {changed ? (
                              <Checkbox
                                checked={selected.has(s.goal_id)}
                                onCheckedChange={() => toggleSelect(s.goal_id)}
                              />
                            ) : (
                              <Check className="h-4 w-4 text-emerald-500" />
                            )}
                          </td>
                          <td className="p-2">
                            <div>
                              <span className="font-medium">{s.subcategory_name}</span>
                              <p className="text-xs text-muted-foreground mt-0.5 max-w-[200px]">{s.reason}</p>
                            </div>
                          </td>
                          <td className="p-2 text-center">
                            <div className="flex items-center justify-center gap-1">
                              {trendIcon[s.trend]}
                              {trendLabel[s.trend]}
                            </div>
                          </td>
                          <td className="p-2 text-right font-mono text-xs">
                            {s.avg_3m > 0 ? formatCurrency(s.avg_3m) : "\u2014"}
                          </td>
                          <td className="p-2 text-right font-mono text-xs">
                            {formatCurrency(s.current_value)}
                          </td>
                          <td className="p-2 text-center">
                            {changed && <ArrowRight className="h-3.5 w-3.5 text-muted-foreground mx-auto" />}
                          </td>
                          <td className="p-2 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <div className="relative">
                                <Input
                                  type="text"
                                  inputMode="numeric"
                                  value={cents > 0 ? `R$ ${formatBRL(cents)}` : ""}
                                  onChange={(e) => handleEditValue(s.goal_id, parseCentsFromDisplay(e.target.value))}
                                  className={cn(
                                    "h-7 w-[120px] text-right font-mono text-xs pr-1.5 pl-1.5",
                                    changed && pctDiff < 0 && "text-emerald-600 font-semibold",
                                    changed && pctDiff > 0 && "text-amber-600 font-semibold",
                                    !changed && "text-muted-foreground",
                                    isEdited && "border-violet-300 bg-violet-50 dark:bg-violet-950/20"
                                  )}
                                  placeholder="R$ 0,00"
                                />
                              </div>
                              {isEdited && (
                                <button
                                  type="button"
                                  onClick={() => resetValue(s.goal_id)}
                                  className="text-muted-foreground hover:text-foreground"
                                  title="Restaurar sugestão da IA"
                                >
                                  <RotateCcw className="h-3 w-3" />
                                </button>
                              )}
                            </div>
                            {changed && (
                              <span className={cn(
                                "block text-[10px] font-normal mt-0.5",
                                pctDiff < 0 && "text-emerald-600",
                                pctDiff > 0 && "text-amber-600"
                              )}>
                                {pctDiff > 0 ? "+" : ""}{pctDiff.toFixed(0)}%
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">
                  {selected.size} de {changedCount} sugestoes selecionadas
                </p>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setOpen(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleApply} disabled={applying || selected.size === 0}>
                    {applying ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Aplicando...
                      </>
                    ) : (
                      <>
                        <Check className="mr-2 h-4 w-4" />
                        Aplicar {selected.size} sugestoes
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}
