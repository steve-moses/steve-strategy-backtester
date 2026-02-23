"use client";

import { useEffect, useRef } from "react";
import {
  createChart,
  LineSeries,
  type IChartApi,
  type ISeriesApi,
  ColorType,
  type LineData,
  type Time,
} from "lightweight-charts";

interface LineDef {
  name: string;
  data: LineData<Time>[];
  color: string;
  lineWidth?: number;
  lineStyle?: number;
}

interface IndicatorChartProps {
  lines: LineDef[];
  height?: number;
}

export function IndicatorChart({
  lines,
  height = 350,
}: IndicatorChartProps): React.ReactElement {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRefs = useRef<ISeriesApi<"Line">[]>([]);

  useEffect(() => {
    if (!containerRef.current) return;

    const chart = createChart(containerRef.current, {
      height,
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: "#9ca3af",
      },
      grid: {
        vertLines: { color: "rgba(255,255,255,0.04)" },
        horzLines: { color: "rgba(255,255,255,0.04)" },
      },
      rightPriceScale: { borderColor: "rgba(255,255,255,0.1)" },
      timeScale: { borderColor: "rgba(255,255,255,0.1)" },
    });

    chartRef.current = chart;

    const observer = new ResizeObserver(() => {
      if (containerRef.current) {
        chart.applyOptions({ width: containerRef.current.clientWidth });
      }
    });
    observer.observe(containerRef.current);

    return () => {
      observer.disconnect();
      chart.remove();
      chartRef.current = null;
      seriesRefs.current = [];
    };
  }, [height]);

  useEffect(() => {
    const chart = chartRef.current;
    if (!chart) return;

    seriesRefs.current.forEach((s) => {
      chart.removeSeries(s);
    });
    seriesRefs.current = [];

    lines.forEach((line) => {
      const s = chart.addSeries(LineSeries, {
        color: line.color,
        lineWidth: (line.lineWidth ?? 2) as 1 | 2 | 3 | 4,
        title: line.name,
        lastValueVisible: false,
        priceLineVisible: false,
      });
      s.setData(line.data);
      seriesRefs.current.push(s);
    });

    chart.timeScale().fitContent();
  }, [lines]);

  return <div ref={containerRef} className="w-full" />;
}
