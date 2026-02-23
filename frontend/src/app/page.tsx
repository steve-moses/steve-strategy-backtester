"use client";

import { useMemo, useCallback, useState } from "react";
import { useIndexConfig } from "@/store/index-config";
import { useIndex } from "@/hooks/use-index";
import { usePrices } from "@/hooks/use-prices";
import { useIndicator } from "@/hooks/use-indicator";
import { useVar } from "@/hooks/use-var";
import { PriceChart } from "@/components/charts/price-chart";
import { IndicatorChart } from "@/components/charts/indicator-chart";
import { VarHistogram } from "@/components/charts/var-histogram";
import { MetricCard } from "@/components/charts/metric-card";
import { AssetSelector } from "@/components/configure/asset-selector";
import { WeightSliders } from "@/components/configure/weight-sliders";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BENCHMARKS, INDEX_COLOR, DEFAULT_ASSETS, DEFAULT_START, DEFAULT_END } from "@/lib/constants";
import { ChevronDown, ChevronUp, RotateCcw } from "lucide-react";
import type { IndicatorRequest } from "@/lib/types";
import type { LineData, Time } from "lightweight-charts";

export default function DashboardPage(): React.ReactElement {
  const { config, setConfig, resetConfig } = useIndexConfig();
  const { data, isLoading, error } = useIndex(config);
  const [configOpen, setConfigOpen] = useState(false);
  const [selectedBenchmarks, setSelectedBenchmarks] = useState<string[]>(["^GSPC"]);

  const [stagedAssets, setStagedAssets] = useState<string[]>(config.assets);
  const [stagedWeights, setStagedWeights] = useState<Record<string, number> | null>(config.weights);
  const [stagedStart, setStagedStart] = useState(config.start_time);
  const [stagedEnd, setStagedEnd] = useState(config.end_time);

  const [analyticsTab, setAnalyticsTab] = useState("sma");
  const [smaWindow, setSmaWindow] = useState(50);
  const [rsiWindow, setRsiWindow] = useState(14);
  const [bbWindow, setBbWindow] = useState(20);
  const [bbStd, setBbStd] = useState(2);
  const [macdShort, setMacdShort] = useState(12);
  const [macdLong, setMacdLong] = useState(26);
  const [volWindow, setVolWindow] = useState(30);
  const [numSim, setNumSim] = useState(10000);
  const [confidence, setConfidence] = useState(0.95);

  const { data: benchmarkData } = usePrices(
    selectedBenchmarks,
    config.start_time,
    config.end_time,
  );

  const stagedWeightsResolved = useMemo(() => {
    if (stagedWeights) return stagedWeights;
    const eq = 1 / stagedAssets.length;
    return Object.fromEntries(stagedAssets.map((a) => [a, eq]));
  }, [stagedWeights, stagedAssets]);

  const handleAssetsChange = useCallback(
    (assets: string[]) => {
      const eq = 1 / assets.length;
      const w = Object.fromEntries(assets.map((a) => [a, eq]));
      setStagedAssets(assets);
      setStagedWeights(w);
    },
    [],
  );

  const handleWeightsChange = useCallback(
    (w: Record<string, number>) => setStagedWeights(w),
    [],
  );

  const applyConfig = useCallback(() => {
    setConfig({
      assets: stagedAssets,
      weights: stagedWeights,
      start_time: stagedStart,
      end_time: stagedEnd,
    });
    setConfigOpen(false);
  }, [setConfig, stagedAssets, stagedWeights, stagedStart, stagedEnd]);

  const toggleBenchmark = useCallback((ticker: string) => {
    setSelectedBenchmarks((prev) =>
      prev.includes(ticker) ? prev.filter((t) => t !== ticker) : [...prev, ticker],
    );
  }, []);

  const indexSeries = useMemo(() => {
    if (!data) return [];
    const baseValue = data.index_values[0] || 1;
    const indexLine: LineData<Time>[] = data.dates.map((d, i) => ({
      time: d as Time,
      value: data.index_values[i] / baseValue,
    }));

    const series = [{ name: "Index", data: indexLine, color: INDEX_COLOR }];

    if (benchmarkData) {
      for (const [ticker, priceData] of Object.entries(benchmarkData)) {
        const bm = BENCHMARKS[ticker];
        if (!bm || priceData.prices.length === 0) continue;
        const base = priceData.prices[0] || 1;
        const bmLine: LineData<Time>[] = priceData.dates.map((d, i) => ({
          time: d as Time,
          value: priceData.prices[i] / base,
        }));
        series.push({ name: bm.name, data: bmLine, color: bm.color });
      }
    }

    return series;
  }, [data, benchmarkData]);

  const metrics = useMemo(() => {
    if (!data || data.index_values.length < 2) return null;
    const vals = data.index_values;
    const current = vals[vals.length - 1];
    const first = vals[0];
    const prev1d = vals[vals.length - 2];
    const prev7d = vals.length >= 8 ? vals[vals.length - 8] : vals[0];
    const prev30d = vals.length >= 31 ? vals[vals.length - 31] : vals[0];
    const returns = vals.slice(1).map((v, i) => (v - vals[i]) / vals[i]);
    const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
    const variance =
      returns.reduce((sum, r) => sum + (r - mean) ** 2, 0) / returns.length;
    const volatility = Math.sqrt(variance) * Math.sqrt(365) * 100;

    const totalReturn = ((current - first) / first) * 100;

    let peak = vals[0];
    let maxDrawdown = 0;
    for (const v of vals) {
      if (v > peak) peak = v;
      const dd = (v - peak) / peak;
      if (dd < maxDrawdown) maxDrawdown = dd;
    }

    const riskFreeDaily = 0.05 / 365;
    const excessMean = mean - riskFreeDaily;
    const stdDev = Math.sqrt(variance);
    const sharpe = stdDev > 0 ? (excessMean / stdDev) * Math.sqrt(365) : 0;

    return {
      current: current.toFixed(2),
      change1d: ((current - prev1d) / prev1d) * 100,
      change7d: ((current - prev7d) / prev7d) * 100,
      change30d: ((current - prev30d) / prev30d) * 100,
      volatility: volatility.toFixed(1),
      totalReturn,
      maxDrawdown: maxDrawdown * 100,
      sharpe,
    };
  }, [data]);

  const prices = useMemo((): number[] => {
    if (!data) return [];
    return data.index_values;
  }, [data]);

  const dates = data?.dates ?? [];

  const indicatorReq = useMemo((): IndicatorRequest | null => {
    if (prices.length === 0 || dates.length === 0) return null;
    const paramsMap: Record<string, Record<string, number>> = {
      sma: { window: smaWindow },
      rsi: { window: rsiWindow },
      bollinger: { window: bbWindow, num_std: bbStd },
      macd: { short_window: macdShort, long_window: macdLong },
      volatility: { window: volWindow },
    };
    if (analyticsTab === "var") return null;
    return {
      asset: "Index",
      indicator: analyticsTab as IndicatorRequest["indicator"],
      prices,
      dates,
      params: paramsMap[analyticsTab] ?? {},
    };
  }, [analyticsTab, prices, dates, smaWindow, rsiWindow, bbWindow, bbStd, macdShort, macdLong, volWindow]);

  const { data: indicatorData, isLoading: indicatorLoading } = useIndicator(indicatorReq);

  const varReq = useMemo(() => {
    if (analyticsTab !== "var" || !data) return null;
    const assets = config.assets;
    const allReturns: number[][] = [];
    const n = data.dates.length;
    for (let i = 1; i < n; i++) {
      const row = assets.map((a) => {
        const p = data.component_prices[a];
        if (!p || !p[i] || !p[i - 1]) return 0;
        return (p[i] - p[i - 1]) / p[i - 1];
      });
      allReturns.push(row);
    }
    return {
      returns: allReturns,
      asset_names: assets,
      num_simulations: numSim,
      confidence_level: confidence,
      portfolio_value: data.index_values[n - 1] ?? 1000,
    };
  }, [analyticsTab, data, config.assets, numSim, confidence]);

  const { data: varData, isLoading: varLoading } = useVar(varReq);

  const indicatorLines = useMemo((): { name: string; data: LineData<Time>[]; color: string }[] => {
    if (!indicatorData) return [];
    const lineColors: Record<string, string> = {
      price: INDEX_COLOR,
      sma: "#94A3B8",
      rsi: INDEX_COLOR,
      upper: "#64748B",
      lower: "#64748B",
      macd: INDEX_COLOR,
      signal: "#94A3B8",
      histogram: "#475569",
      volatility: INDEX_COLOR,
    };
    return Object.entries(indicatorData.values).map(([key, vals]) => ({
      name: key.toUpperCase(),
      color: lineColors[key] ?? "#6B7280",
      data: indicatorData.dates
        .map((d, i) =>
          vals[i] != null ? { time: d as Time, value: vals[i]! } : null,
        )
        .filter((p): p is LineData<Time> => p !== null),
    }));
  }, [indicatorData]);

  if (error) {
    return (
      <div className="flex items-center justify-center h-96 text-red-400">
        Failed to load index data: {error.message}
      </div>
    );
  }

  const configPanel = (
    <div className="space-y-4">
      <Card className="bg-card border-border">
        <CardContent className="p-4 space-y-3">
          <h2 className="text-sm font-medium">Date Range</h2>
          <div className="grid grid-cols-2 gap-3">
            <input
              type="date"
              value={stagedStart.slice(0, 10)}
              onChange={(e) => setStagedStart(e.target.value)}
              className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm"
            />
            <input
              type="date"
              value={stagedEnd.slice(0, 10)}
              onChange={(e) => setStagedEnd(e.target.value)}
              className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm"
            />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card border-border">
        <CardContent className="p-4 space-y-3">
          <h2 className="text-sm font-medium">Assets</h2>
          <AssetSelector
            selected={stagedAssets}
            onChange={handleAssetsChange}
          />
        </CardContent>
      </Card>

      <Card className="bg-card border-border">
        <CardContent className="p-4 space-y-3">
          <h2 className="text-sm font-medium">Weights</h2>
          <WeightSliders
            assets={stagedAssets}
            weights={stagedWeightsResolved}
            onChange={handleWeightsChange}
          />
        </CardContent>
      </Card>

      <Button className="w-full" onClick={applyConfig}>
        Go
      </Button>
    </div>
  );

  const metricsPanel = metrics ? (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <MetricCard label="Index Value" value={metrics.current} />
      <MetricCard label="24h Change" value="" change={metrics.change1d} />
      <MetricCard label="7d Change" value="" change={metrics.change7d} />
      <MetricCard label="30d Change" value="" change={metrics.change30d} />
      <MetricCard label="Total Return" value="" change={metrics.totalReturn} />
      <MetricCard label="Max Drawdown" value="" change={metrics.maxDrawdown} />
      <MetricCard label="Sharpe Ratio" value={metrics.sharpe.toFixed(2)} />
      <MetricCard label="Annualized Vol" value={metrics.volatility} suffix="%" />
    </div>
  ) : null;

  const chartPanel = (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-medium text-muted-foreground">
          Portfolio Index Performance
        </h2>
        <div className="flex items-center gap-3">
          {Object.entries(BENCHMARKS).map(([ticker, bm]) => (
            <label key={ticker} className="flex items-center gap-1.5 cursor-pointer">
              <Checkbox
                checked={selectedBenchmarks.includes(ticker)}
                onCheckedChange={() => toggleBenchmark(ticker)}
              />
              <div
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ backgroundColor: bm.color }}
              />
              <Label className="text-xs cursor-pointer text-muted-foreground">
                {bm.name}
              </Label>
            </label>
          ))}
        </div>
      </div>
      {isLoading ? (
        <div className="h-[400px] flex items-center justify-center text-muted-foreground animate-pulse">
          Loading chart data...
        </div>
      ) : (
        <PriceChart series={indexSeries} />
      )}
    </div>
  );

  const analyticsPanel = (
    <div className="rounded-xl border border-border bg-card p-4">
      <h2 className="text-sm font-medium text-muted-foreground mb-3">
        Technical Indicators
      </h2>
      <Tabs value={analyticsTab} onValueChange={setAnalyticsTab}>
        <TabsList>
          <TabsTrigger value="sma">SMA</TabsTrigger>
          <TabsTrigger value="rsi">RSI</TabsTrigger>
          <TabsTrigger value="bollinger">Bollinger</TabsTrigger>
          <TabsTrigger value="macd">MACD</TabsTrigger>
          <TabsTrigger value="volatility">Volatility</TabsTrigger>
          <TabsTrigger value="var">VaR</TabsTrigger>
        </TabsList>

        <TabsContent value="sma" className="space-y-4">
          <div className="flex items-center gap-4 pt-2">
            <span className="text-xs text-muted-foreground w-14">Window</span>
            <Slider value={[smaWindow]} min={5} max={200} step={1} onValueChange={([v]) => setSmaWindow(v)} className="flex-1" />
            <span className="text-xs font-mono w-8 text-right">{smaWindow}</span>
          </div>
          {indicatorLoading ? (
            <div className="h-[300px] flex items-center justify-center text-muted-foreground animate-pulse">Loading...</div>
          ) : (
            <IndicatorChart lines={indicatorLines} height={300} />
          )}
        </TabsContent>

        <TabsContent value="rsi" className="space-y-4">
          <div className="flex items-center gap-4 pt-2">
            <span className="text-xs text-muted-foreground w-14">Window</span>
            <Slider value={[rsiWindow]} min={5} max={30} step={1} onValueChange={([v]) => setRsiWindow(v)} className="flex-1" />
            <span className="text-xs font-mono w-8 text-right">{rsiWindow}</span>
          </div>
          {indicatorLoading ? (
            <div className="h-[300px] flex items-center justify-center text-muted-foreground animate-pulse">Loading...</div>
          ) : (
            <IndicatorChart lines={indicatorLines} height={300} />
          )}
        </TabsContent>

        <TabsContent value="bollinger" className="space-y-4">
          <div className="flex items-center gap-4 pt-2">
            <span className="text-xs text-muted-foreground w-14">Window</span>
            <Slider value={[bbWindow]} min={5} max={50} step={1} onValueChange={([v]) => setBbWindow(v)} className="flex-1" />
            <span className="text-xs font-mono w-8 text-right">{bbWindow}</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs text-muted-foreground w-14">Std Dev</span>
            <Slider value={[bbStd]} min={1} max={3} step={0.5} onValueChange={([v]) => setBbStd(v)} className="flex-1" />
            <span className="text-xs font-mono w-8 text-right">{bbStd}</span>
          </div>
          {indicatorLoading ? (
            <div className="h-[300px] flex items-center justify-center text-muted-foreground animate-pulse">Loading...</div>
          ) : (
            <IndicatorChart lines={indicatorLines} height={300} />
          )}
        </TabsContent>

        <TabsContent value="macd" className="space-y-4">
          <div className="flex items-center gap-4 pt-2">
            <span className="text-xs text-muted-foreground w-14">Short</span>
            <Slider value={[macdShort]} min={5} max={20} step={1} onValueChange={([v]) => setMacdShort(v)} className="flex-1" />
            <span className="text-xs font-mono w-8 text-right">{macdShort}</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs text-muted-foreground w-14">Long</span>
            <Slider value={[macdLong]} min={15} max={50} step={1} onValueChange={([v]) => setMacdLong(v)} className="flex-1" />
            <span className="text-xs font-mono w-8 text-right">{macdLong}</span>
          </div>
          {indicatorLoading ? (
            <div className="h-[300px] flex items-center justify-center text-muted-foreground animate-pulse">Loading...</div>
          ) : (
            <IndicatorChart lines={indicatorLines} height={300} />
          )}
        </TabsContent>

        <TabsContent value="volatility" className="space-y-4">
          <div className="flex items-center gap-4 pt-2">
            <span className="text-xs text-muted-foreground w-14">Window</span>
            <Slider value={[volWindow]} min={5} max={120} step={1} onValueChange={([v]) => setVolWindow(v)} className="flex-1" />
            <span className="text-xs font-mono w-8 text-right">{volWindow}</span>
          </div>
          {indicatorLoading ? (
            <div className="h-[300px] flex items-center justify-center text-muted-foreground animate-pulse">Loading...</div>
          ) : (
            <IndicatorChart lines={indicatorLines} height={300} />
          )}
        </TabsContent>

        <TabsContent value="var" className="space-y-4">
          <div className="flex items-center gap-4 pt-2">
            <span className="text-xs text-muted-foreground w-20">Simulations</span>
            <Slider value={[numSim]} min={1000} max={50000} step={1000} onValueChange={([v]) => setNumSim(v)} className="flex-1" />
            <span className="text-xs font-mono w-14 text-right">{numSim.toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs text-muted-foreground w-20">Confidence</span>
            <Slider value={[confidence * 100]} min={80} max={99} step={1} onValueChange={([v]) => setConfidence(v / 100)} className="flex-1" />
            <span className="text-xs font-mono w-14 text-right">{(confidence * 100).toFixed(0)}%</span>
          </div>

          {varData && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Card className="bg-card border-border">
                <CardContent className="p-3">
                  <p className="text-xs text-muted-foreground">MC VaR</p>
                  <p className="text-lg font-semibold tabular-nums">{(varData.monte_carlo_var * 100).toFixed(2)}%</p>
                </CardContent>
              </Card>
              <Card className="bg-card border-border">
                <CardContent className="p-3">
                  <p className="text-xs text-muted-foreground">MC VaR ($)</p>
                  <p className="text-lg font-semibold tabular-nums">${varData.monte_carlo_var_dollar.toFixed(2)}</p>
                </CardContent>
              </Card>
              <Card className="bg-card border-border">
                <CardContent className="p-3">
                  <p className="text-xs text-muted-foreground">Cholesky VaR</p>
                  <p className="text-lg font-semibold tabular-nums">{(varData.cholesky_var * 100).toFixed(2)}%</p>
                </CardContent>
              </Card>
              <Card className="bg-card border-border">
                <CardContent className="p-3">
                  <p className="text-xs text-muted-foreground">Cholesky VaR ($)</p>
                  <p className="text-lg font-semibold tabular-nums">${varData.cholesky_var_dollar.toFixed(2)}</p>
                </CardContent>
              </Card>
            </div>
          )}

          {varLoading ? (
            <div className="h-[350px] flex items-center justify-center text-muted-foreground animate-pulse">
              Running simulation...
            </div>
          ) : varData ? (
            <VarHistogram
              monteCarloReturns={varData.simulated_returns}
              choleskyReturns={varData.cholesky_returns}
              mcVar={varData.monte_carlo_var}
              cholVar={varData.cholesky_var}
              confidence={confidence}
            />
          ) : (
            <div className="h-[350px] flex items-center justify-center text-muted-foreground">
              Select VaR tab to run simulation
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Steve's Strategy Builder</h1>
          <p className="text-sm text-muted-foreground">
            Custom Portfolio Index
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => {
            resetConfig();
            setStagedAssets(DEFAULT_ASSETS);
            setStagedWeights(null);
            setStagedStart(DEFAULT_START);
            setStagedEnd(DEFAULT_END);
          }}>
            <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
            Reset
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setConfigOpen(!configOpen)}
          >
            Configure
            {configOpen ? (
              <ChevronUp className="h-3.5 w-3.5 ml-1.5" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5 ml-1.5" />
            )}
          </Button>
        </div>
      </div>

      {metricsPanel}

      {configOpen ? (
        <div className="grid lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] gap-6">
          {configPanel}
          <div className="space-y-6">
            {chartPanel}
            {analyticsPanel}
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {chartPanel}
          {analyticsPanel}
        </div>
      )}
    </div>
  );
}
