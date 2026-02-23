"use client";

import { Slider } from "@/components/ui/slider";
import { ASSET_METADATA } from "@/lib/constants";

interface WeightSlidersProps {
  assets: string[];
  weights: Record<string, number>;
  onChange: (weights: Record<string, number>) => void;
}

const ASSET_ORDER = Object.keys(ASSET_METADATA);

export function WeightSliders({
  assets,
  weights,
  onChange,
}: WeightSlidersProps): React.ReactElement {
  const sorted = [...assets].sort(
    (a, b) => ASSET_ORDER.indexOf(a) - ASSET_ORDER.indexOf(b),
  );
  const handleChange = (asset: string, pct: number): void => {
    const clamped = Math.min(pct, 100);
    const fraction = clamped / 100;
    const remaining = 1 - fraction;
    const othersTotal = Object.entries(weights)
      .filter(([k]) => k !== asset)
      .reduce((sum, [, v]) => sum + v, 0);

    const updated: Record<string, number> = {};
    for (const a of assets) {
      if (a === asset) {
        updated[a] = fraction;
      } else if (othersTotal > 0) {
        updated[a] = (weights[a] ?? 0) * (remaining / othersTotal);
      } else {
        const otherCount = assets.length - 1;
        updated[a] = otherCount > 0 ? remaining / otherCount : 0;
      }
    }
    onChange(updated);
  };

  return (
    <div className="space-y-4">
      {sorted.map((asset) => {
        const w = weights[asset] ?? 1 / assets.length;
        const pct = (w * 100).toFixed(1);
        const name = ASSET_METADATA[asset]?.name ?? asset.toUpperCase();
        return (
          <div key={asset} className="space-y-1.5">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{name}</span>
              <span className="font-mono tabular-nums">{pct}%</span>
            </div>
            <Slider
              value={[w * 100]}
              min={0}
              max={100}
              step={0.5}
              onValueChange={([v]) => handleChange(asset, v)}
            />
          </div>
        );
      })}
    </div>
  );
}
