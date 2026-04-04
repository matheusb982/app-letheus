import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils/format";
import type { DashboardKPIs } from "@/lib/actions/dashboard-actions";
import {
  DollarSign,
  ShoppingCart,
  TrendingUp,
  Wallet,
  Target,
  Landmark,
  BarChart3,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface KPICardsProps {
  kpis: DashboardKPIs;
}

export function KPICards({ kpis }: KPICardsProps) {
  const hasPatrimony = kpis.totalPatrimony > 0;

  const cards = [
    {
      title: "Receita Total",
      description: "Entradas no mês",
      value: kpis.totalRevenue,
      displayValue: formatCurrency(kpis.totalRevenue),
      icon: DollarSign,
      borderColor: "border-l-emerald-500",
      iconBg: "bg-emerald-100 text-emerald-700",
      valueColor: "text-emerald-700",
    },
    {
      title: "Despesa Total",
      description: "Saídas no mês",
      value: kpis.totalPurchase,
      displayValue: formatCurrency(kpis.totalPurchase),
      icon: ShoppingCart,
      borderColor: "border-l-rose-500",
      iconBg: "bg-rose-100 text-rose-700",
      valueColor: "text-rose-700",
    },
    {
      title: "Aporte Mensal",
      description: kpis.totalAporte > 0
        ? "Investido no mês"
        : "Registre despesas em Financeiras > Investimento/Aporte Mensal",
      value: kpis.totalAporte,
      displayValue: kpis.totalAporte > 0 ? formatCurrency(kpis.totalAporte) : "R$ 0,00",
      icon: TrendingUp,
      borderColor: kpis.totalAporte > 0 ? "border-l-blue-500" : "border-l-gray-400",
      iconBg: kpis.totalAporte > 0 ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-500",
      valueColor: kpis.totalAporte > 0 ? "text-blue-700" : "text-gray-400",
    },
    {
      title: "Saldo",
      description: kpis.totalBalance >= 0 ? "Positivo no mês" : "Negativo no mês",
      value: kpis.totalBalance,
      displayValue: formatCurrency(kpis.totalBalance),
      icon: Wallet,
      borderColor: kpis.totalBalance >= 0 ? "border-l-emerald-500" : "border-l-red-500",
      iconBg: kpis.totalBalance >= 0 ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700",
      valueColor: kpis.totalBalance >= 0 ? "text-emerald-700" : "text-red-700",
    },
    {
      title: "Meta Total",
      description: "Objetivo mensal",
      value: kpis.totalGoal,
      displayValue: formatCurrency(kpis.totalGoal),
      icon: Target,
      borderColor: "border-l-amber-500",
      iconBg: "bg-amber-100 text-amber-700",
      valueColor: "text-amber-700",
    },
    {
      title: "Patrimônio Total",
      description: "Acumulado total",
      value: kpis.totalPatrimony,
      displayValue: formatCurrency(kpis.totalPatrimony),
      icon: Landmark,
      borderColor: "border-l-violet-500",
      iconBg: "bg-violet-100 text-violet-700",
      valueColor: "text-violet-700",
    },
    {
      title: "Performance",
      description: !kpis.hasPerformanceData
        ? "Precisa de patrimônio em 2 meses para calcular"
        : kpis.performanceValue >= 0 ? "Rendimento no mês" : "Perda no mês",
      value: kpis.performanceValue,
      displayValue: kpis.hasPerformanceData ? formatCurrency(kpis.performanceValue) : "—",
      icon: BarChart3,
      borderColor: !kpis.hasPerformanceData
        ? "border-l-gray-400"
        : kpis.performanceValue >= 0 ? "border-l-teal-500" : "border-l-orange-500",
      iconBg: !kpis.hasPerformanceData
        ? "bg-gray-100 text-gray-500"
        : kpis.performanceValue >= 0 ? "bg-teal-100 text-teal-700" : "bg-orange-100 text-orange-700",
      valueColor: !kpis.hasPerformanceData
        ? "text-gray-400"
        : kpis.performanceValue >= 0 ? "text-teal-700" : "text-orange-700",
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <Card
          key={card.title}
          className={cn(
            "border-l-4 transition-shadow hover:shadow-md",
            card.borderColor
          )}
        >
          <CardContent className="pt-5 pb-4">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-muted-foreground text-sm font-medium">
                  {card.title}
                </p>
                <p className={cn("text-2xl font-bold tracking-tight", card.valueColor)}>
                  {card.displayValue}
                </p>
                <p className="text-muted-foreground text-xs">
                  {card.description}
                </p>
              </div>
              <div
                className={cn(
                  "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
                  card.iconBg
                )}
              >
                <card.icon className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
