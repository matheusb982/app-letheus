import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency } from "@/lib/utils/format";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface SubcategoryRow {
  name: string;
  goal: number;
  purchase: number;
  diff: number;
  id: string | null;
}

interface CategoryGroup {
  category_name: string;
  subcategories: SubcategoryRow[];
  total: SubcategoryRow;
}

interface CategoryTableProps {
  data: CategoryGroup[];
}

function DiffCell({ value }: { value: number }) {
  return (
    <span className={cn(value > 0 ? "text-emerald-600" : value < 0 ? "text-red-600" : "")}>
      {formatCurrency(value)}
    </span>
  );
}

export function CategoryTable({ data }: CategoryTableProps) {
  if (data.length === 0) {
    return <p className="text-muted-foreground text-sm">Nenhum dado de categoria encontrado.</p>;
  }

  return (
    <div className="space-y-6">
      {data.map((group) => (
        <div key={group.category_name} className="rounded-lg border">
          <div className="bg-muted/50 px-4 py-2">
            <h3 className="text-sm font-semibold">{group.category_name}</h3>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Subcategoria</TableHead>
                <TableHead className="text-right">Meta</TableHead>
                <TableHead className="text-right">Realizado</TableHead>
                <TableHead className="text-right">Diferença</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {group.subcategories.map((sub) => (
                <TableRow key={sub.id ?? sub.name}>
                  <TableCell>
                    {sub.id ? (
                      <Link
                        href={`/purchases?subcategory=${sub.id}`}
                        className="text-primary hover:underline"
                      >
                        {sub.name}
                      </Link>
                    ) : (
                      sub.name
                    )}
                  </TableCell>
                  <TableCell className="text-right">{formatCurrency(sub.goal)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(sub.purchase)}</TableCell>
                  <TableCell className="text-right">
                    <DiffCell value={sub.diff} />
                  </TableCell>
                </TableRow>
              ))}
              <TableRow className="font-semibold">
                <TableCell>{group.total.name}</TableCell>
                <TableCell className="text-right">{formatCurrency(group.total.goal)}</TableCell>
                <TableCell className="text-right">{formatCurrency(group.total.purchase)}</TableCell>
                <TableCell className="text-right">
                  <DiffCell value={group.total.diff} />
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      ))}
    </div>
  );
}
