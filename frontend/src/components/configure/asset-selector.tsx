"use client";

import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ASSET_METADATA, ASSET_CATEGORIES } from "@/lib/constants";
import { ChevronDown, ChevronUp } from "lucide-react";

interface AssetSelectorProps {
  selected: string[];
  onChange: (assets: string[]) => void;
}

export function AssetSelector({
  selected,
  onChange,
}: AssetSelectorProps): React.ReactElement {
  const [openCategories, setOpenCategories] = useState<Set<string>>(
    new Set(["crypto"]),
  );

  const toggle = (symbol: string): void => {
    if (selected.includes(symbol)) {
      if (selected.length > 1) {
        onChange(selected.filter((s) => s !== symbol));
      }
    } else {
      onChange([...selected, symbol]);
    }
  };

  const toggleCategory = (key: string): void => {
    setOpenCategories((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const assetsByCategory = ASSET_CATEGORIES.map((cat) => ({
    ...cat,
    assets: Object.entries(ASSET_METADATA).filter(
      ([, meta]) => meta.category === cat.key,
    ),
  }));

  return (
    <div className="space-y-2">
      {assetsByCategory.map((cat) => {
        const isOpen = openCategories.has(cat.key);
        const selectedCount = cat.assets.filter(([sym]) =>
          selected.includes(sym),
        ).length;

        return (
          <div key={cat.key} className="rounded-lg border border-border">
            <button
              type="button"
              onClick={() => toggleCategory(cat.key)}
              className="flex items-center justify-between w-full px-3 py-2 text-sm font-medium hover:bg-accent/30 transition-colors rounded-lg"
            >
              <span>
                {cat.label}
                {selectedCount > 0 && (
                  <span className="ml-2 text-xs text-muted-foreground">
                    ({selectedCount})
                  </span>
                )}
              </span>
              {isOpen ? (
                <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
              )}
            </button>

            {isOpen && (
              <div className="px-3 pb-3 grid grid-cols-2 gap-2">
                {cat.assets.map(([symbol, meta]) => (
                  <label
                    key={symbol}
                    className="flex items-center gap-2 rounded-md px-2 py-1.5 cursor-pointer hover:bg-accent/30 transition-colors"
                  >
                    <Checkbox
                      checked={selected.includes(symbol)}
                      onCheckedChange={() => toggle(symbol)}
                    />
                    <div
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: meta.color }}
                    />
                    <Label className="cursor-pointer text-xs">{meta.name}</Label>
                  </label>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
