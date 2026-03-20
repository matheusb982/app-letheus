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
import { getGoals, deleteGoal } from "@/lib/actions/goal-actions";
import { getCurrentPeriod } from "@/lib/actions/period-actions";
import { formatCurrency } from "@/lib/utils/format";
import { DeleteButton } from "@/components/shared/delete-button";

export default async function GoalsPage() {
  const period = await getCurrentPeriod();
  const goals = period ? await getGoals() : [];
  const total = goals.reduce((sum, g) => sum + g.value, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Metas</h1>
          {period && <p className="text-muted-foreground mt-1">{period.label}</p>}
        </div>
        <Button asChild>
          <Link href="/goals/new">
            <Plus className="mr-2 h-4 w-4" />
            Nova Meta
          </Link>
        </Button>
      </div>

      {!period ? (
        <p className="text-muted-foreground">Selecione um período.</p>
      ) : goals.length === 0 ? (
        <p className="text-muted-foreground">Nenhuma meta encontrada.</p>
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
                {goals.map((g) => (
                  <TableRow key={g.id}>
                    <TableCell className="font-medium">{g.subcategory_name}</TableCell>
                    <TableCell className="text-right">{formatCurrency(g.value)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" asChild>
                          <Link href={`/goals/${g.id}/edit`}>
                            <Pencil className="h-4 w-4" />
                          </Link>
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
    </div>
  );
}
