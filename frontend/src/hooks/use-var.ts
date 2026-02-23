import useSWR from "swr";
import { simulateVar } from "@/lib/api";
import type { VarRequest, VarResult } from "@/lib/types";

export function useVar(
  req: VarRequest | null,
): {
  data: VarResult | undefined;
  error: Error | undefined;
  isLoading: boolean;
} {
  const key = req ? JSON.stringify(req) : null;
  return useSWR<VarResult, Error>(
    key ? ["var", key] : null,
    () => simulateVar(req!),
    { revalidateOnFocus: false, dedupingInterval: 60_000 },
  );
}
