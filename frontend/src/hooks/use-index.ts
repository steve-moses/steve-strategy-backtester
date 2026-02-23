import useSWR from "swr";
import { computeIndex } from "@/lib/api";
import type { IndexConfig, IndexResult } from "@/lib/types";

export function useIndex(config: IndexConfig): {
  data: IndexResult | undefined;
  error: Error | undefined;
  isLoading: boolean;
} {
  const key = JSON.stringify(config);
  return useSWR<IndexResult, Error>(
    ["index", key],
    () => computeIndex(config),
    { revalidateOnFocus: false, dedupingInterval: 60_000 },
  );
}
