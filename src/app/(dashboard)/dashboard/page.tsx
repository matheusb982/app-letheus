import { getCurrentPeriod } from "@/lib/actions/period-actions";
import { getDashboardData } from "@/lib/actions/dashboard-actions";
import { KPICards } from "@/components/dashboard/kpi-cards";
import { CategoryTable } from "@/components/dashboard/category-table";

export default async function DashboardPage() {
  const period = await getCurrentPeriod();
  const data = await getDashboardData();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        {period && (
          <p className="text-muted-foreground mt-1">{period.label}</p>
        )}
      </div>

      {data ? (
        <>
          <KPICards kpis={data.kpis} />
          <div>
            <h2 className="mb-4 text-lg font-semibold">Despesas por Categoria</h2>
            <CategoryTable data={data.paymentsPerCategory} />
          </div>
        </>
      ) : (
        <p className="text-muted-foreground">
          Nenhum período selecionado. Crie um período no seletor acima.
        </p>
      )}
    </div>
  );
}
