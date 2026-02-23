"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { MODEL_COLORS, MODEL_DASH } from "./model-comparison-chart";
import type { ForecastData } from "@/lib/types";

interface ForecastChartProps {
  forecast: ForecastData;
  selectedModels: string[];
}

export function ForecastChart({
  forecast,
  selectedModels,
}: ForecastChartProps): React.ReactElement {
  const activeModels = forecast.models.filter(
    (m) => selectedModels.includes(m.model_name) && m.predicted.length > 0,
  );

  const lastTrailingDate = forecast.trailing_dates[forecast.trailing_dates.length - 1];

  const data = [
    ...forecast.trailing_dates.map((date, i) => {
      const point: Record<string, string | number> = {
        date,
        Actual: forecast.trailing_values[i],
      };
      return point;
    }),
    ...forecast.dates.map((date, i) => {
      const point: Record<string, string | number> = { date };
      if (i === 0) {
        point.Actual = forecast.trailing_values[forecast.trailing_values.length - 1];
      }
      activeModels.forEach((m) => {
        if (i < m.predicted.length) {
          point[m.model_name] = m.predicted[i];
        }
      });
      return point;
    }),
  ];

  return (
    <ResponsiveContainer width="100%" height={400}>
      <LineChart data={data}>
        <XAxis dataKey="date" tick={{ fill: "#9ca3af", fontSize: 11 }} />
        <YAxis tick={{ fill: "#9ca3af", fontSize: 11 }} domain={["auto", "auto"]} />
        <Tooltip
          contentStyle={{
            background: "#1f2937",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 8,
            color: "#e5e7eb",
          }}
          formatter={(value: number | undefined) =>
            value != null ? `$${value.toLocaleString(undefined, { maximumFractionDigits: 2 })}` : "—"
          }
        />
        <Legend wrapperStyle={{ color: "#9ca3af" }} />
        <ReferenceLine
          x={lastTrailingDate}
          stroke="#6B7280"
          strokeDasharray="4 4"
          label={{ value: "Today", fill: "#9ca3af", fontSize: 11, position: "top" }}
        />
        <Line
          type="monotone"
          dataKey="Actual"
          stroke={MODEL_COLORS.Actual}
          strokeWidth={2}
          dot={false}
          name="Actual"
        />
        {activeModels.map((m) => (
          <Line
            key={m.model_name}
            type="monotone"
            dataKey={m.model_name}
            stroke={MODEL_COLORS[m.model_name] ?? "#6B7280"}
            strokeWidth={1.5}
            dot={false}
            strokeDasharray={MODEL_DASH[m.model_name] ?? "4 2"}
            name={`${m.model_name} (Forecast)`}
            connectNulls
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
