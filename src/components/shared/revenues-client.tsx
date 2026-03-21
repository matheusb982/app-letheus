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
import { RevenueForm } from "@/components/shared/revenue-form";
import { DeleteButton } from "@/components/shared/delete-button";
import {
  createRevenue,
  updateRevenue,
  deleteRevenue,
  type SerializedRevenue,
} from "@/lib/actions/revenue-actions";
import { formatCurrency } from "@/lib/utils/format";
import { useRouter } from "next/navigation";

interface RevenuesClientProps {
  revenues: SerializedRevenue[];
  periodLabel?: string;
}

export function RevenuesClient({ revenues, periodLabel }: RevenuesClientProps) {
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<SerializedRevenue | undefined>();

  const total = revenues.reduce((sum, r) => sum + r.value, 0);

  function openCreate() {
    setEditing(undefined);
    setDialogOpen(true);
  }

  function openEdit(revenue: SerializedRevenue) {
    setEditing(revenue);
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
          <h1 className="text-2xl font-bold">Receitas</h1>
          {periodLabel && <p className="text-muted-foreground mt-1">{periodLabel}</p>}
        </div>
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Nova Receita
        </Button>
      </div>

      {!periodLabel ? (
        <p className="text-muted-foreground">Selecione um período.</p>
      ) : revenues.length === 0 ? (
        <p className="text-muted-foreground">Nenhuma receita encontrada.</p>
      ) : (
        <>
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead className="w-[100px]">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {revenues.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">{r.name}</TableCell>
                    <TableCell>{r.description}</TableCell>
                    <TableCell className="text-right">{formatCurrency(r.value)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(r)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <DeleteButton action={deleteRevenue.bind(null, r.id)} />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <div className="text-right text-sm font-semibold">
            Total: {formatCurrency(total)}
          </div>
        </>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Editar Receita" : "Nova Receita"}</DialogTitle>
          </DialogHeader>
          <RevenueForm
            key={editing?.id ?? "new"}
            revenue={editing}
            action={editing ? updateRevenue.bind(null, editing.id) : createRevenue}
            onSuccess={handleSuccess}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
