"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ReferenceLine,
  ResponsiveContainer,
} from "recharts";

interface VarHistogramProps {
  monteCarloReturns: number[];
  choleskyReturns: number[];
  mcVar: number;
  cholVar: number;
  confidence: number;
}

function buildBins(data: number[], binCount: number = 60): { bin: number; count: number }[] {
  if (data.length === 0) return [];
  const min = Math.min(...data);
  const max = Math.max(...data);
  const step = (max - min) / binCount;
  const bins = Array.from({ length: binCount }, (_, i) => ({
    bin: +(min + step * (i + 0.5)).toFixed(5),
    count: 0,
  }));
  for (const val of data) {
    const idx = Math.min(Math.floor((val - min) / step), binCount - 1);
    bins[idx].count++;
  }
  return bins;
}

export function VarHistogram({
  monteCarloReturns,
  choleskyReturns,
  mcVar,
  cholVar,
  confidence,
}: VarHistogramProps): React.ReactElement {
  const mcBins = buildBins(monteCarloReturns);
  const cholBins = buildBins(choleskyReturns);

  const merged = mcBins.map((b, i) => ({
    bin: b.bin,
    mc: b.count,
    chol: cholBins[i]?.count ?? 0,
  }));

  return (
    <ResponsiveContainer width="100%" height={400}>
      <BarChart data={merged}>
        <XAxis
          dataKey="bin"
          tick={{ fill: "#9ca3af", fontSize: 11 }}
          tickFormatter={(v: number) => v.toFixed(3)}
        />
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
        <Bar dataKey="mc" name="Monte Carlo" fill="#F59E0B" opacity={0.6} />
        <Bar dataKey="chol" name="Cholesky" fill="#94A3B8" opacity={0.6} />
        <ReferenceLine
          x={mcBins.reduce((prev, curr) =>
            Math.abs(curr.bin - mcVar) < Math.abs(prev.bin - mcVar) ? curr : prev,
          ).bin}
          stroke="#D97706"
          strokeDasharray="5 5"
          label={{
            value: `MC VaR ${(confidence * 100).toFixed(0)}%`,
            fill: "#D97706",
            fontSize: 11,
          }}
        />
        <ReferenceLine
          x={cholBins.reduce((prev, curr) =>
            Math.abs(curr.bin - cholVar) < Math.abs(prev.bin - cholVar) ? curr : prev,
          ).bin}
          stroke="#64748B"
          strokeDasharray="5 5"
          label={{
            value: `Chol VaR ${(confidence * 100).toFixed(0)}%`,
            fill: "#64748B",
            fontSize: 11,
          }}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
