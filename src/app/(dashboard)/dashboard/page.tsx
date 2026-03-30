import { getCurrentPeriod } from "@/lib/actions/period-actions";
import { getDashboardData } from "@/lib/actions/dashboard-actions";
import { hasSampleData } from "@/lib/actions/onboarding-actions";
import { KPICards } from "@/components/dashboard/kpi-cards";
import { CategoryTable } from "@/components/dashboard/category-table";
import { GoalAlerts } from "@/components/dashboard/goal-alerts";
import { SampleDataBanner } from "@/components/shared/sample-data-banner";

export default async function DashboardPage() {
  const [period, data, showSampleBanner] = await Promise.all([
    getCurrentPeriod(),
    getDashboardData(),
    hasSampleData(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        {period && (
          <p className="text-muted-foreground mt-1">{period.label}</p>
        )}
      </div>

      {showSampleBanner && <SampleDataBanner />}

      {data ? (
        <>
          <KPICards kpis={data.kpis} />
          {data.goalAlerts.length > 0 && (
            <GoalAlerts alerts={data.goalAlerts} />
          )}
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
