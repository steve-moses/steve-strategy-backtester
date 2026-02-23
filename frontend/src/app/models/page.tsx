"use client";

import { useMemo, useState } from "react";
import useSWR from "swr";
import { fetchPredictions } from "@/lib/api";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { ModelComparisonChart } from "@/components/charts/model-comparison-chart";
import { ForecastChart } from "@/components/charts/forecast-chart";
import { ASSET_METADATA } from "@/lib/constants";

const ALL_MODELS = ["XGBoost", "Random Forest", "Prophet"];

function formatDate(d: string): string {
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function ModelsPage(): React.ReactElement {
  const { data, error, isLoading } = useSWR("predictions", fetchPredictions, {
    revalidateOnFocus: false,
  });
  const [selected, setSelected] = useState<string[]>(ALL_MODELS);

  const toggle = (model: string): void => {
    setSelected((prev) =>
      prev.includes(model) ? prev.filter((m) => m !== model) : [...prev, model],
    );
  };

  const availableModels = useMemo(() => {
    if (!data) return ALL_MODELS;
    return data.predictions
      .filter((p) => p.predicted.length > 0)
      .map((p) => p.model_name);
  }, [data]);

  const portfolioLabel = useMemo(() => {
    if (!data?.metadata?.assets) return null;
    const assets = data.metadata.assets as string[];
    const names = assets.map((a) => ASSET_METADATA[a]?.name ?? a);
    if (assets.length === 1) return names[0];
    return `Equally Weighted (${names.join(", ")})`;
  }, [data]);

  const trainEnd = (data?.metadata?.train_end as string)?.slice(0, 10);
  const testStart = (data?.metadata?.test_start as string)?.slice(0, 10);

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">ML Models</h1>
          <p className="text-sm text-muted-foreground">
            Model comparison and forecasting
          </p>
        </div>
        <Card className="bg-card border-border">
          <CardContent className="p-8 text-center text-muted-foreground">
            <p className="mb-2">No predictions available yet.</p>
            <p className="text-xs">
              Run <code className="bg-muted px-1 py-0.5 rounded text-xs">python -m ml.train</code> to
              generate predictions, then restart the API.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">ML Models</h1>
        <p className="text-sm text-muted-foreground">
          Model comparison and forecasting
        </p>
      </div>

      {data && (trainEnd || portfolioLabel) && (
        <Card className="bg-card border-border">
          <CardContent className="p-4 space-y-1">
            {portfolioLabel && (
              <p className="text-sm">
                <span className="text-muted-foreground">Predicting:</span>{" "}
                <span className="font-medium">{portfolioLabel}</span>
              </p>
            )}
            {trainEnd && testStart && (
              <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm">
                <p>
                  <span className="text-muted-foreground">Training period:</span>{" "}
                  <span className="font-medium">Jan 1, 2021 — {formatDate(trainEnd)}</span>
                </p>
                <p>
                  <span className="text-muted-foreground">Out-of-sample forecast:</span>{" "}
                  <span className="font-medium">{formatDate(testStart)} — present</span>
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Card className="bg-card border-border">
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4">
            {availableModels.map((model) => (
              <label key={model} className="flex items-center gap-2 cursor-pointer">
                <Checkbox
                  checked={selected.includes(model)}
                  onCheckedChange={() => toggle(model)}
                />
                <Label className="cursor-pointer text-sm">{model}</Label>
              </label>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="rounded-xl border border-border bg-card p-4">
        <h2 className="text-sm font-medium text-muted-foreground mb-3">
          Out-of-Sample Forecast vs Actual
        </h2>
        {isLoading ? (
          <div className="h-[400px] flex items-center justify-center text-muted-foreground animate-pulse">
            Loading predictions...
          </div>
        ) : data ? (
          <ModelComparisonChart
            dates={data.actual_dates}
            actualValues={data.actual_values}
            predictions={data.predictions}
            selectedModels={selected}
          />
        ) : null}
      </div>

      {data?.forecast && data.forecast.models.some((m) => m.predicted.length > 0) && (
        <div className="rounded-xl border border-border bg-card p-4">
          <h2 className="text-sm font-medium text-muted-foreground mb-3">
            60-Day Price Forecast
          </h2>
          <ForecastChart forecast={data.forecast} selectedModels={selected} />
        </div>
      )}

      {data && (
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <h2 className="text-sm font-medium text-muted-foreground mb-3">
              Model Metrics (Out-of-Sample)
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 pr-4 text-muted-foreground font-medium">Model</th>
                    <th className="text-right py-2 px-4 text-muted-foreground font-medium">MAE</th>
                    <th className="text-right py-2 px-4 text-muted-foreground font-medium">RMSE</th>
                    <th className="text-right py-2 px-4 text-muted-foreground font-medium">MAPE</th>
                  </tr>
                </thead>
                <tbody>
                  {data.predictions
                    .filter((p) => selected.includes(p.model_name) && p.predicted.length > 0)
                    .map((p) => (
                      <tr key={p.model_name} className="border-b border-border/50">
                        <td className="py-2 pr-4 font-medium">{p.model_name}</td>
                        <td className="py-2 px-4 text-right tabular-nums">
                          {p.metrics.mae?.toFixed(2) ?? "—"}
                        </td>
                        <td className="py-2 px-4 text-right tabular-nums">
                          {p.metrics.rmse?.toFixed(2) ?? "—"}
                        </td>
                        <td className="py-2 px-4 text-right tabular-nums">
                          {p.metrics.mape ? `${(p.metrics.mape * 100).toFixed(2)}%` : "—"}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
