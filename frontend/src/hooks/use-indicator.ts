import useSWR from "swr";
import { computeIndicator } from "@/lib/api";
import type { IndicatorRequest, IndicatorResult } from "@/lib/types";

export function useIndicator(
  req: IndicatorRequest | null,
): {
  data: IndicatorResult | undefined;
  error: Error | undefined;
  isLoading: boolean;
} {
  const key = req ? JSON.stringify(req) : null;
  return useSWR<IndicatorResult, Error>(
    key ? ["indicator", key] : null,
    () => computeIndicator(req!),
    { revalidateOnFocus: false, dedupingInterval: 60_000 },
  );
}
