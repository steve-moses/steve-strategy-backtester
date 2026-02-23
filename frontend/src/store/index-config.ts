import { create } from "zustand";
import type { IndexConfig } from "@/lib/types";
import { DEFAULT_ASSETS, DEFAULT_START, DEFAULT_END } from "@/lib/constants";

interface IndexConfigStore {
  config: IndexConfig;
  setConfig: (config: Partial<IndexConfig>) => void;
  resetConfig: () => void;
}

const DEFAULT_CONFIG: IndexConfig = {
  assets: DEFAULT_ASSETS,
  weights: null,
  start_time: DEFAULT_START,
  end_time: DEFAULT_END,
  initial_level: 1000,
};

export const useIndexConfig = create<IndexConfigStore>((set) => ({
  config: DEFAULT_CONFIG,
  setConfig: (partial) =>
    set((state) => ({ config: { ...state.config, ...partial } })),
  resetConfig: () => set({ config: DEFAULT_CONFIG }),
}));
