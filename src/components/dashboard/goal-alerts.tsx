import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { AlertTriangle, XCircle, TrendingUp } from "lucide-react";
import { formatCurrency } from "@/lib/utils/format";
import type { GoalAlert } from "@/lib/actions/dashboard-actions";
import { cn } from "@/lib/utils";

interface GoalAlertsProps {
  alerts: GoalAlert[];
}

const levelConfig = {
  warning: {
    icon: AlertTriangle,
    label: "Atenção",
    color: "text-amber-600",
    bgColor: "bg-amber-50",
    borderColor: "border-amber-200",
    progressColor: "[&>div]:bg-amber-500",
    iconBg: "bg-amber-100 text-amber-600",
  },
  danger: {
    icon: AlertTriangle,
    label: "Cuidado",
    color: "text-orange-600",
    bgColor: "bg-orange-50",
    borderColor: "border-orange-200",
    progressColor: "[&>div]:bg-orange-500",
    iconBg: "bg-orange-100 text-orange-600",
  },
  exceeded: {
    icon: XCircle,
    label: "Estourou",
    color: "text-red-600",
    bgColor: "bg-red-50",
    borderColor: "border-red-200",
    progressColor: "[&>div]:bg-red-500",
    iconBg: "bg-red-100 text-red-600",
  },
  ok: {
    icon: TrendingUp,
    label: "OK",
    color: "text-emerald-600",
    bgColor: "bg-emerald-50",
    borderColor: "border-emerald-200",
    progressColor: "[&>div]:bg-emerald-500",
    iconBg: "bg-emerald-100 text-emerald-600",
  },
};

export function GoalAlerts({ alerts }: GoalAlertsProps) {
  if (alerts.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <AlertTriangle className="h-5 w-5 text-amber-500" />
          Alertas de Metas
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {alerts.map((alert) => {
          const config = levelConfig[alert.level];
          const Icon = config.icon;
          const cappedPercentage = Math.min(alert.percentage, 100);

          return (
            <div
              key={alert.subcategoryName}
              className={cn(
                "rounded-lg border p-3",
                config.bgColor,
                config.borderColor
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <div
                    className={cn(
                      "flex h-7 w-7 shrink-0 items-center justify-center rounded-md",
                      config.iconBg
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className={cn("text-sm font-semibold", config.color)}>
                      {config.label}: {alert.subcategoryName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {alert.level === "exceeded" ? (
                        <>Passou <strong className="text-red-600">{formatCurrency(alert.diff)}</strong> da meta</>
                      ) : (
                        <>{alert.percentage.toFixed(0)}% da meta de {formatCurrency(alert.goalValue)}</>
                      )}
                    </p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className={cn("text-sm font-bold", config.color)}>
                    {formatCurrency(alert.spent)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    de {formatCurrency(alert.goalValue)}
                  </p>
                </div>
              </div>
              <div className="mt-2">
                <Progress
                  value={cappedPercentage}
                  className={cn("h-2", config.progressColor)}
                />
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
