import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AnnualLineChart } from "@/components/charts/annual-line-chart";
import { getAnnualPurchaseChartData } from "@/lib/actions/chart-actions";

export default async function PurchaseAnnualChartPage() {
  const data = await getAnnualPurchaseChartData();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Gráfico Anual de Despesas</h1>
      <Card>
        <CardHeader>
          <CardTitle>Despesas vs Metas</CardTitle>
        </CardHeader>
        <CardContent>
          <AnnualLineChart
            data={data}
            actualLabel="Total Real"
            plannedLabel="Total Planejado"
          />
        </CardContent>
      </Card>
    </div>
  );
}
