import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  const cards = [
    {
      title: "Receita Total",
      value: kpis.totalRevenue,
      icon: DollarSign,
      color: "text-emerald-600",
    },
    {
      title: "Despesa Total",
      value: kpis.totalPurchase,
      icon: ShoppingCart,
      color: "text-red-600",
    },
    {
      title: "Aporte Mensal",
      value: kpis.totalAporte,
      icon: TrendingUp,
      color: "text-blue-600",
    },
    {
      title: "Saldo",
      value: kpis.totalBalance,
      icon: Wallet,
      color: kpis.totalBalance >= 0 ? "text-emerald-600" : "text-red-600",
    },
    {
      title: "Meta Total",
      value: kpis.totalGoal,
      icon: Target,
      color: "text-orange-600",
    },
    {
      title: "Patrimônio Total",
      value: kpis.totalPatrimony,
      icon: Landmark,
      color: "text-purple-600",
    },
    {
      title: "Performance",
      value: kpis.performanceValue,
      icon: BarChart3,
      color: kpis.performanceValue >= 0 ? "text-emerald-600" : "text-red-600",
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <Card key={card.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
            <card.icon className={cn("h-4 w-4", card.color)} />
          </CardHeader>
          <CardContent>
            <div className={cn("text-2xl font-bold", card.color)}>
              {formatCurrency(card.value)}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
