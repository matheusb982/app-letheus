import { getCurrentPeriod } from "@/lib/actions/period-actions";

export default async function DashboardPage() {
  const period = await getCurrentPeriod();

  return (
    <div>
      <h1 className="text-2xl font-bold">Dashboard</h1>
      {period ? (
        <p className="text-muted-foreground mt-1">
          {period.label}
        </p>
      ) : (
        <p className="text-muted-foreground mt-1">
          Nenhum período selecionado. Crie um período no seletor acima.
        </p>
      )}
      <div className="mt-6">
        <p className="text-muted-foreground">KPIs e tabela de categorias — Fase 3</p>
      </div>
    </div>
  );
}
