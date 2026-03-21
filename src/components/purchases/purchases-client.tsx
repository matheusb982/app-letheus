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
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, BarChart3 } from "lucide-react";
import { ImportDialog } from "@/components/purchases/import-dialog";
import { PurchaseForm } from "@/components/purchases/purchase-form";
import { DeleteButton } from "@/components/shared/delete-button";
import {
  createPurchase,
  updatePurchase,
  deletePurchase,
  type SerializedPurchase,
} from "@/lib/actions/purchase-actions";
import type { SerializedSubcategory } from "@/lib/actions/category-actions";
import { formatCurrency, formatDate } from "@/lib/utils/format";
import { useRouter } from "next/navigation";

interface PurchasesClientProps {
  purchases: SerializedPurchase[];
  subcategories: SerializedSubcategory[];
  periodLabel?: string;
}

export function PurchasesClient({ purchases, subcategories, periodLabel }: PurchasesClientProps) {
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<SerializedPurchase | undefined>();

  const total = purchases.reduce((sum, p) => sum + p.value, 0);

  function openCreate() {
    setEditing(undefined);
    setDialogOpen(true);
  }

  function openEdit(purchase: SerializedPurchase) {
    setEditing(purchase);
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
          <h1 className="text-2xl font-bold">Despesas</h1>
          {periodLabel && <p className="text-muted-foreground mt-1">{periodLabel}</p>}
        </div>
        <div className="flex gap-2">
          <ImportDialog />
          <Button variant="outline" asChild>
            <Link href="/purchases/annual-chart">
              <BarChart3 className="mr-2 h-4 w-4" />
              Gráfico Anual
            </Link>
          </Button>
          <Button onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Nova Despesa
          </Button>
        </div>
      </div>

      {!periodLabel ? (
        <p className="text-muted-foreground">Selecione um período para ver as despesas.</p>
      ) : purchases.length === 0 ? (
        <p className="text-muted-foreground">Nenhuma despesa encontrada.</p>
      ) : (
        <>
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Subcategoria</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead className="w-[100px]">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {purchases.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>{formatDate(p.purchase_date)}</TableCell>
                    <TableCell className="max-w-[300px] truncate">{p.description}</TableCell>
                    <TableCell>{p.subcategory_name}</TableCell>
                    <TableCell>
                      <Badge variant={p.purchase_type === "debit" ? "secondary" : "outline"}>
                        {p.purchase_type === "debit" ? "Débito" : "Crédito"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(p.value)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(p)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <DeleteButton action={deletePurchase.bind(null, p.id)} />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <div className="text-right text-sm font-semibold">
            Total: {formatCurrency(total)} ({purchases.length} despesas)
          </div>
        </>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Editar Despesa" : "Nova Despesa"}</DialogTitle>
          </DialogHeader>
          <PurchaseForm
            key={editing?.id ?? "new"}
            purchase={editing}
            subcategories={subcategories}
            action={editing ? updatePurchase.bind(null, editing.id) : createPurchase}
            onSuccess={handleSuccess}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
