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
import { Plus, Pencil, BarChart3 } from "lucide-react";
import { getPatrimonies, deletePatrimony } from "@/lib/actions/patrimony-actions";
import { getCurrentPeriod } from "@/lib/actions/period-actions";
import { formatCurrency } from "@/lib/utils/format";
import { DeleteButton } from "@/components/shared/delete-button";

export default async function PatrimoniesPage() {
  const period = await getCurrentPeriod();
  const patrimonies = period ? await getPatrimonies() : [];
  const total = patrimonies.reduce((sum, p) => sum + p.value, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Patrimônio</h1>
          {period && <p className="text-muted-foreground mt-1">{period.label}</p>}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/patrimonies/annual-chart">
              <BarChart3 className="mr-2 h-4 w-4" />
              Gráfico Anual
            </Link>
          </Button>
          <Button asChild>
            <Link href="/patrimonies/new">
              <Plus className="mr-2 h-4 w-4" />
              Novo Patrimônio
            </Link>
          </Button>
        </div>
      </div>

      {!period ? (
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
                        <Button variant="ghost" size="icon" asChild>
                          <Link href={`/patrimonies/${p.id}/edit`}>
                            <Pencil className="h-4 w-4" />
                          </Link>
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
    </div>
  );
}
