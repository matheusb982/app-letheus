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
import { Plus, Pencil } from "lucide-react";
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
}

export function GoalsClient({ goals, subcategories, periodLabel }: GoalsClientProps) {
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

      {!periodLabel ? (
        <p className="text-muted-foreground">Selecione um período.</p>
      ) : goals.length === 0 ? (
        <p className="text-muted-foreground">Nenhuma meta encontrada.</p>
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
