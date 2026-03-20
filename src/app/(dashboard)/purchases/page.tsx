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
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, BarChart3 } from "lucide-react";
import { getPurchases, deletePurchase } from "@/lib/actions/purchase-actions";
import { getCurrentPeriod } from "@/lib/actions/period-actions";
import { formatCurrency, formatDate } from "@/lib/utils/format";
import { DeleteButton } from "@/components/shared/delete-button";

export default async function PurchasesPage({
  searchParams,
}: {
  searchParams: Promise<{ subcategory?: string }>;
}) {
  const params = await searchParams;
  const period = await getCurrentPeriod();
  const purchases = period ? await getPurchases(params.subcategory) : [];

  const total = purchases.reduce((sum, p) => sum + p.value, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Despesas</h1>
          {period && <p className="text-muted-foreground mt-1">{period.label}</p>}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/purchases/annual-chart">
              <BarChart3 className="mr-2 h-4 w-4" />
              Gráfico Anual
            </Link>
          </Button>
          <Button asChild>
            <Link href="/purchases/new">
              <Plus className="mr-2 h-4 w-4" />
              Nova Despesa
            </Link>
          </Button>
        </div>
      </div>

      {!period ? (
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
                        <Button variant="ghost" size="icon" asChild>
                          <Link href={`/purchases/${p.id}/edit`}>
                            <Pencil className="h-4 w-4" />
                          </Link>
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
    </div>
  );
}
