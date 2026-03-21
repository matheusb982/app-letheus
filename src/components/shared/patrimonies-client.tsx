"use client";

import { useState } from "react";
import Link from "next/link";
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
import { Plus, Pencil, BarChart3 } from "lucide-react";
import { SubcategoryEntityForm } from "@/components/shared/subcategory-form";
import { DeleteButton } from "@/components/shared/delete-button";
import {
  createPatrimony,
  updatePatrimony,
  deletePatrimony,
  type SerializedPatrimony,
} from "@/lib/actions/patrimony-actions";
import type { SerializedSubcategory } from "@/lib/actions/category-actions";
import { formatCurrency } from "@/lib/utils/format";
import { useRouter } from "next/navigation";

interface PatrimoniesClientProps {
  patrimonies: SerializedPatrimony[];
  subcategories: SerializedSubcategory[];
  periodLabel?: string;
}

export function PatrimoniesClient({ patrimonies, subcategories, periodLabel }: PatrimoniesClientProps) {
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<SerializedPatrimony | undefined>();

  const total = patrimonies.reduce((sum, p) => sum + p.value, 0);

  function openCreate() {
    setEditing(undefined);
    setDialogOpen(true);
  }

  function openEdit(patrimony: SerializedPatrimony) {
    setEditing(patrimony);
    setDialogOpen(true);
  }

  function handleSuccess() {
    setDialogOpen(false);
    setEditing(undefined);
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Patrimônio</h1>
          {periodLabel && <p className="text-muted-foreground mt-1">{periodLabel}</p>}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/patrimonies/annual-chart">
              <BarChart3 className="mr-2 h-4 w-4" />
              Gráfico Anual
            </Link>
          </Button>
          <Button onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Novo Patrimônio
          </Button>
        </div>
      </div>

      {!periodLabel ? (
        <p className="text-muted-foreground">Selecione um período.</p>
      ) : patrimonies.length === 0 ? (
        <p className="text-muted-foreground">Nenhum patrimônio encontrado.</p>
      ) : (
        <>
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Subcategoria</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead className="w-[100px]">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {patrimonies.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.subcategory_name}</TableCell>
                    <TableCell className="text-right">{formatCurrency(p.value)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(p)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <DeleteButton action={deletePatrimony.bind(null, p.id)} />
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
            <DialogTitle>{editing ? "Editar Patrimônio" : "Novo Patrimônio"}</DialogTitle>
          </DialogHeader>
          <SubcategoryEntityForm
            key={editing?.id ?? "new"}
            entity={editing}
            subcategories={subcategories}
            action={editing ? updatePatrimony.bind(null, editing.id) : createPatrimony}
            entityName="Patrimônio"
            onSuccess={handleSuccess}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
