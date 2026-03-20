"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { formatCurrency } from "@/lib/utils/format";

interface ChartDataPoint {
  label: string;
  actual: number;
  planned: number;
}

interface AnnualLineChartProps {
  data: ChartDataPoint[];
  actualLabel?: string;
  plannedLabel?: string;
  actualColor?: string;
  plannedColor?: string;
}

export function AnnualLineChart({
  data,
  actualLabel = "Real",
  plannedLabel = "Planejado",
  actualColor = "#2563eb",
  plannedColor = "#dc2626",
}: AnnualLineChartProps) {
  if (data.length === 0) {
    return <p className="text-muted-foreground">Sem dados para exibir.</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={400}>
      <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="label" />
        <YAxis tickFormatter={(v) => `R$ ${(v / 1000).toFixed(0)}k`} />
        <Tooltip
          formatter={(value) => formatCurrency(Number(value))}
          labelFormatter={(label) => `Período: ${label}`}
        />
        <Legend />
        <Line
          type="monotone"
          dataKey="actual"
          name={actualLabel}
          stroke={actualColor}
          strokeWidth={2}
          dot={{ r: 4 }}
        />
        <Line
          type="monotone"
          dataKey="planned"
          name={plannedLabel}
          stroke={plannedColor}
          strokeWidth={2}
          dot={{ r: 4 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
