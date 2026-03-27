"use client";

import { useState, useTransition } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Upload, Loader2, ArrowLeft, CheckCircle2, SkipForward, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import { importCSVAction, importTextAction } from "@/lib/actions/import-actions";
import { getGoalAlerts, type GoalAlert } from "@/lib/actions/dashboard-actions";
import type { ImportedItem } from "@/lib/services/csv-import";

interface ImportResultData {
  created: number;
  skipped: number;
  total: number;
  errors: string[];
  items: ImportedItem[];
}

export function ImportDialog() {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<ImportResultData | null>(null);
  const [goalAlerts, setGoalAlerts] = useState<GoalAlert[]>([]);

  function handleCSVSubmit(formData: FormData) {
    startTransition(async () => {
      const res = await importCSVAction(formData);
      setResult(res);
      if (res.created > 0) {
        toast.success(`${res.created} despesas importadas!`);
        const alerts = await getGoalAlerts();
        setGoalAlerts(alerts);
      }
    });
  }

  function handleTextSubmit(formData: FormData) {
    startTransition(async () => {
      const res = await importTextAction(formData);
      setResult(res);
      if (res.created > 0) {
        toast.success(`${res.created} despesas importadas!`);
        const alerts = await getGoalAlerts();
        setGoalAlerts(alerts);
      }
    });
  }

  function handleClose(isOpen: boolean) {
    setOpen(isOpen);
    if (!isOpen) { setResult(null); setGoalAlerts([]); }
  }

  function formatBRL(value: number) {
    return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  }

  const statusLabel = {
    created: <Badge variant="default" className="bg-emerald-600 text-xs">Criada</Badge>,
    skipped: <Badge variant="secondary" className="text-xs">Ignorada</Badge>,
    error: <Badge variant="destructive" className="text-xs">Erro</Badge>,
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Upload className="mr-2 h-4 w-4" />
          Importar
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {result ? "Resultado da Importação" : "Importar Despesas"}
          </DialogTitle>
        </DialogHeader>

        {result ? (
          <div className="flex flex-col gap-4 overflow-hidden">
            {/* Summary */}
            <div className="flex gap-3 flex-wrap">
              <div className="flex items-center gap-1.5 text-sm">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                <span className="font-medium">{result.created}</span> criadas
              </div>
              <div className="flex items-center gap-1.5 text-sm">
                <SkipForward className="h-4 w-4 text-amber-500" />
                <span className="font-medium">{result.skipped}</span> ignoradas
              </div>
              {result.errors.length > 0 && (
                <div className="flex items-center gap-1.5 text-sm">
                  <AlertCircle className="h-4 w-4 text-red-500" />
                  <span className="font-medium">{result.errors.length}</span> erros
                </div>
              )}
              <div className="text-muted-foreground text-sm ml-auto">
                Total: {result.total}
              </div>
            </div>

            {/* Items table */}
            <div className="overflow-auto border rounded-md max-h-[55vh]">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 sticky top-0">
                  <tr>
                    <th className="text-left p-2 font-medium">Status</th>
                    <th className="text-left p-2 font-medium">Data</th>
                    <th className="text-left p-2 font-medium">Descrição</th>
                    <th className="text-left p-2 font-medium">Subcategoria</th>
                    <th className="text-right p-2 font-medium">Valor</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {result.items.map((item, i) => (
                    <tr key={i} className={item.status === "skipped" ? "opacity-50" : ""}>
                      <td className="p-2">{statusLabel[item.status]}</td>
                      <td className="p-2 whitespace-nowrap">{item.date}</td>
                      <td className="p-2 max-w-[200px] truncate" title={item.description}>
                        {item.description}
                      </td>
                      <td className="p-2 text-muted-foreground">
                        {item.subcategory || "—"}
                      </td>
                      <td className="p-2 text-right whitespace-nowrap font-mono">
                        {formatBRL(item.value)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            
            {goalAlerts.length > 0 && (() => {
              const importedSubcategories = new Set(
                result.items
                  .filter((item) => item.status === "created" && item.subcategory)
                  .map((item) => item.subcategory)
              );
              const affectedAlerts = goalAlerts.filter((a) =>
                importedSubcategories.has(a.subcategoryName)
              );
              if (affectedAlerts.length === 0) return null;
              return (
              <div className="space-y-2">
                <p className="text-sm font-semibold flex items-center gap-1.5">
                  <AlertCircle className="h-4 w-4 text-amber-500" />
                  Metas afetadas
                </p>
                {affectedAlerts.map((alert) => {
                  const pct = Math.min(alert.percentage, 100);
                  const color =
                    alert.level === "exceeded"
                      ? "text-red-600"
                      : alert.level === "danger"
                      ? "text-orange-600"
                      : "text-amber-600";
                  const progressColor =
                    alert.level === "exceeded"
                      ? "[&>div]:bg-red-500"
                      : alert.level === "danger"
                      ? "[&>div]:bg-orange-500"
                      : "[&>div]:bg-amber-500";
                  return (
                    <div key={alert.subcategoryName} className="rounded border p-2 text-xs space-y-1">
                      <div className="flex justify-between">
                        <span className={cn("font-medium", color)}>
                          {alert.level === "exceeded" ? "Estourou" : alert.level === "danger" ? "Cuidado" : "Atenção"}:{" "}
                          {alert.subcategoryName}
                        </span>
                        <span className="text-muted-foreground">
                          {alert.spent.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })} / {alert.goalValue.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                        </span>
                      </div>
                      <Progress value={pct} className={cn("h-1.5", progressColor)} />
                      <p className={cn("text-right", color)}>
                        {alert.level === "exceeded"
                          ? `Passou ${alert.diff.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}`
                          : `${alert.percentage.toFixed(0)}% da meta`}
                      </p>
                    </div>
                  );
                })}
              </div>
              );
            })()}

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => { setResult(null); setGoalAlerts([]); }}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Nova importação
              </Button>
              <Button onClick={() => handleClose(false)} className="ml-auto">
                Fechar
              </Button>
            </div>
          </div>
        ) : (
          <Tabs defaultValue="csv">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="csv">CSV</TabsTrigger>
              <TabsTrigger value="text">Texto</TabsTrigger>
            </TabsList>
            <TabsContent value="csv" className="space-y-4">
              <form action={handleCSVSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="csv-file">Arquivo CSV</Label>
                  <Input
                    id="csv-file"
                    name="file"
                    type="file"
                    accept=".csv"
                    disabled={isPending}
                  />
                  <p className="text-muted-foreground text-xs">
                    Formatos aceitos: extrato débito (C6/Itaú), fatura crédito (C6) ou extrato Nubank.
                  </p>
                </div>
                <Button type="submit" disabled={isPending} className="w-full">
                  {isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Importando...
                    </>
                  ) : (
                    "Importar CSV"
                  )}
                </Button>
              </form>
            </TabsContent>
            <TabsContent value="text" className="space-y-4">
              <form action={handleTextSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="paste-text">Texto do extrato</Label>
                  <Textarea
                    id="paste-text"
                    name="text"
                    rows={8}
                  className="max-h-[40vh] overflow-y-auto"
                    placeholder="Cole aqui o texto copiado do app do banco..."
                    disabled={isPending}
                  />
                </div>
                <Button type="submit" disabled={isPending} className="w-full">
                  {isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Importando...
                    </>
                  ) : (
                    "Importar Texto"
                  )}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
}
