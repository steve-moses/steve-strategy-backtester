"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

export const MODEL_COLORS: Record<string, string> = {
  XGBoost: "#F59E0B",
  "Random Forest": "#10B981",
  Prophet: "#8B5CF6",
  Actual: "#E5E7EB",
};

export const MODEL_DASH: Record<string, string> = {
  XGBoost: "6 3",
  "Random Forest": "4 2",
  Prophet: "3 3",
};

interface ModelComparisonChartProps {
  dates: string[];
  actualValues: number[];
  predictions: {
    model_name: string;
    predicted: number[];
  }[];
  selectedModels: string[];
}

export function ModelComparisonChart({
  dates,
  actualValues,
  predictions,
  selectedModels,
}: ModelComparisonChartProps): React.ReactElement {
  const activePredictions = predictions.filter(
    (p) => selectedModels.includes(p.model_name) && p.predicted.length > 0,
  );

  const data = dates.map((date, i) => {
    const point: Record<string, string | number> = { date, Actual: actualValues[i] };
    activePredictions.forEach((p) => {
      if (i < p.predicted.length) {
        point[p.model_name] = p.predicted[i];
      }
    });
    return point;
  });

  return (
    <ResponsiveContainer width="100%" height={400}>
      <LineChart data={data}>
        <XAxis dataKey="date" tick={{ fill: "#9ca3af", fontSize: 11 }} />
        <YAxis tick={{ fill: "#9ca3af", fontSize: 11 }} />
        <Tooltip
          contentStyle={{
            background: "#1f2937",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 8,
            color: "#e5e7eb",
          }}
        />
        <Legend wrapperStyle={{ color: "#9ca3af" }} />
        <Line
          type="monotone"
          dataKey="Actual"
          stroke={MODEL_COLORS.Actual}
          strokeWidth={2}
          dot={false}
          name="Actual (Out-of-Sample)"
        />
        {activePredictions.map((p) => (
          <Line
            key={p.model_name}
            type="monotone"
            dataKey={p.model_name}
            stroke={MODEL_COLORS[p.model_name] ?? "#6B7280"}
            strokeWidth={1.5}
            dot={false}
            strokeDasharray={MODEL_DASH[p.model_name] ?? "4 2"}
            name={`${p.model_name} (Forecast)`}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
