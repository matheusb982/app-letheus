import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AnnualLineChart } from "@/components/charts/annual-line-chart";
import { getAnnualPatrimonyChartData } from "@/lib/actions/chart-actions";
import { formatCurrency } from "@/lib/utils/format";

export default async function PatrimonyAnnualChartPage() {
  const { points, totalAmount } = await getAnnualPatrimonyChartData();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Gráfico Anual de Patrimônio</h1>
        <div className="text-right">
          <p className="text-sm text-muted-foreground">Variação no período</p>
          <p className={`text-xl font-bold ${totalAmount >= 0 ? "text-emerald-600" : "text-red-600"}`}>
            {formatCurrency(totalAmount)}
          </p>
        </div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Patrimônio Real vs Planejado</CardTitle>
        </CardHeader>
        <CardContent>
          <AnnualLineChart
            data={points}
            actualLabel="Real"
            plannedLabel="Planejado"
            actualColor="#7c3aed"
            plannedColor="#f59e0b"
          />
        </CardContent>
      </Card>
    </div>
  );
}
