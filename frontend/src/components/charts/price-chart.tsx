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

interface Series {
  name: string;
  data: LineData<Time>[];
  color: string;
}

interface PriceChartProps {
  series: Series[];
  height?: number;
}

export function PriceChart({
  series,
  height = 400,
}: PriceChartProps): React.ReactElement {
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
      crosshair: {
        vertLine: { color: "rgba(255,255,255,0.1)" },
        horzLine: { color: "rgba(255,255,255,0.1)" },
      },
      rightPriceScale: { borderColor: "rgba(255,255,255,0.1)" },
      timeScale: { borderColor: "rgba(255,255,255,0.1)" },
    });

    chartRef.current = chart;

    const handleResize = (): void => {
      if (containerRef.current) {
        chart.applyOptions({ width: containerRef.current.clientWidth });
      }
    };
    const observer = new ResizeObserver(handleResize);
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

    series.forEach((s) => {
      const lineSeries = chart.addSeries(LineSeries, {
        color: s.color,
        lineWidth: 2,
        title: s.name,
        lastValueVisible: false,
        priceLineVisible: false,
      });
      lineSeries.setData(s.data);
      seriesRefs.current.push(lineSeries);
    });

    chart.timeScale().fitContent();
  }, [series]);

  return <div ref={containerRef} className="w-full" />;
}
