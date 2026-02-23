import useSWR from "swr";
import { fetchPrices } from "@/lib/api";

type PriceData = Record<string, { dates: string[]; prices: number[] }>;

export function usePrices(
  assets: string[],
  startTime: string,
  endTime: string,
): {
  data: PriceData | undefined;
  error: Error | undefined;
  isLoading: boolean;
} {
  const key = assets.length > 0
    ? `prices:${assets.join(",")}:${startTime}:${endTime}`
    : null;
  return useSWR<PriceData, Error>(
    key,
    () => fetchPrices(assets, startTime, endTime),
    { revalidateOnFocus: false, dedupingInterval: 60_000 },
  );
}
