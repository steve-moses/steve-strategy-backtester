import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  label: string;
  value: string;
  change?: number;
  suffix?: string;
}

export function MetricCard({
  label,
  value,
  change,
  suffix,
}: MetricCardProps): React.ReactElement {
  const displayValue = change !== undefined && !value
    ? `${change >= 0 ? "+" : ""}${change.toFixed(2)}%`
    : `${value}${suffix ?? ""}`;

  const valueColor = change !== undefined && !value
    ? change >= 0 ? "text-emerald-400" : "text-red-400"
    : "text-foreground";

  return (
    <Card className="bg-card border-border">
      <CardContent className="p-4">
        <p className="text-xs text-muted-foreground mb-1">{label}</p>
        <p className={cn("text-lg font-semibold tabular-nums", valueColor)}>
          {displayValue}
        </p>
      </CardContent>
    </Card>
  );
}
