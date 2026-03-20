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
import { Plus, Pencil } from "lucide-react";
import { getRevenues, deleteRevenue } from "@/lib/actions/revenue-actions";
import { getCurrentPeriod } from "@/lib/actions/period-actions";
import { formatCurrency } from "@/lib/utils/format";
import { DeleteButton } from "@/components/shared/delete-button";

export default async function RevenuesPage() {
  const period = await getCurrentPeriod();
  const revenues = period ? await getRevenues() : [];
  const total = revenues.reduce((sum, r) => sum + r.value, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Receitas</h1>
          {period && <p className="text-muted-foreground mt-1">{period.label}</p>}
        </div>
        <Button asChild>
          <Link href="/revenues/new">
            <Plus className="mr-2 h-4 w-4" />
            Nova Receita
          </Link>
        </Button>
      </div>

      {!period ? (
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
                        <Button variant="ghost" size="icon" asChild>
                          <Link href={`/revenues/${r.id}/edit`}>
                            <Pencil className="h-4 w-4" />
                          </Link>
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
    </div>
  );
}
