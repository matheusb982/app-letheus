"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Plus, Pencil, Info } from "lucide-react";
import { SubcategoryEntityForm } from "@/components/shared/subcategory-form";
import { DeleteButton } from "@/components/shared/delete-button";
import {
  createGoal,
  updateGoal,
  deleteGoal,
  type SerializedGoal,
} from "@/lib/actions/goal-actions";
import type { SerializedSubcategory } from "@/lib/actions/category-actions";
import { formatCurrency } from "@/lib/utils/format";
import { useRouter } from "next/navigation";
import { ReviewGoalsDialog } from "@/components/goals/review-goals-dialog";

interface GoalsClientProps {
  goals: SerializedGoal[];
  subcategories: SerializedSubcategory[];
  periodLabel?: string;
  hasEnoughData?: boolean;
  periodsWithData?: number;
}

export function GoalsClient({ goals, subcategories, periodLabel, hasEnoughData, periodsWithData }: GoalsClientProps) {
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<SerializedGoal | undefined>();

  const total = goals.reduce((sum, g) => sum + g.value, 0);

  function openCreate() {
    setEditing(undefined);
    setDialogOpen(true);
  }

  function openEdit(goal: SerializedGoal) {
    setEditing(goal);
    setDialogOpen(true);
  }

  function handleSuccess() {
    setDialogOpen(false);
    setEditing(undefined);
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Metas</h1>
          {periodLabel && <p className="text-muted-foreground mt-1">{periodLabel}</p>}
        </div>
        <div className="flex gap-2">
          <ReviewGoalsDialog />
          <Button onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Nova Meta
          </Button>
        </div>
      </div>

      {hasEnoughData === false && (
        <div className="flex items-start gap-3 rounded-lg border border-blue-500/20 bg-blue-500/5 p-4">
          <Info className="size-5 text-blue-500 shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-sm">Sugestões automáticas ainda não disponíveis</p>
            <p className="text-sm text-muted-foreground mt-1">
              {periodsWithData === 0
                ? "Precisamos de pelo menos 2 meses com despesas reais para sugerir metas personalizadas. Importe seus gastos e continue usando o app!"
                : `Você tem ${periodsWithData} mês com dados. A IA precisa de pelo menos 2 meses de histórico para criar sugestões inteligentes. Continue importando seus gastos!`}
            </p>
          </div>
        </div>
      )}

      {!periodLabel ? (
        <p className="text-muted-foreground">Selecione um período.</p>
      ) : goals.length === 0 ? (
        <p className="text-muted-foreground">Nenhuma meta encontrada. {hasEnoughData === false ? "As sugestões automáticas da IA serão ativadas quando você tiver pelo menos 2 meses de dados. Você ainda pode criar metas manualmente." : "Crie uma meta ou use as sugestões da IA."}</p>
      ) : (
        <>
          <div className="overflow-x-auto rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Subcategoria</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead className="w-[100px]">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {goals.map((g) => (
                  <TableRow key={g.id}>
                    <TableCell className="font-medium">{g.subcategory_name}</TableCell>
                    <TableCell className="text-right">{formatCurrency(g.value)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(g)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <DeleteButton action={deleteGoal.bind(null, g.id)} />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <div className="text-right text-sm font-semibold">Total: {formatCurrency(total)}</div>
        </>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Editar Meta" : "Nova Meta"}</DialogTitle>
          </DialogHeader>
          <SubcategoryEntityForm
            key={editing?.id ?? "new"}
            entity={editing}
            subcategories={subcategories}
            action={editing ? updateGoal.bind(null, editing.id) : createGoal}
            entityName="Meta"
            onSuccess={handleSuccess}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
