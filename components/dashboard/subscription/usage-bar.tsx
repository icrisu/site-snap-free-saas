"use client";

import { cn } from "@/lib/utils";

type UsageBarProps = {
  label: string;
  current: number;
  max: number;
  unit?: string;
};

export function UsageBar({ label, current, max, unit = "" }: UsageBarProps) {
  const percentage = max > 0 ? Math.min((current / max) * 100, 100) : 0;
  const isHigh = percentage >= 80;
  const isFull = percentage >= 100;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className={cn("font-medium", isFull && "text-red-500")}>
          {current}{unit} / {max}{unit}
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={cn(
            "h-full rounded-full transition-all",
            isFull
              ? "bg-red-500"
              : isHigh
                ? "bg-orange-500"
                : "bg-primary",
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
