import type * as React from "react";

import { Card } from "~/components/ui/card";
import { cn } from "~/lib/utils";

interface StatCardProps extends React.ComponentProps<typeof Card> {
  label: React.ReactNode;
  value: React.ReactNode;
  unit?: React.ReactNode;
  /** Optional CSS colour applied to the value (matches design `accent`). */
  accent?: string;
  /** Optional pill (e.g. "+12%") shown trailing on the value row. */
  delta?: React.ReactNode;
  /** "compact" matches the mobile spec; "wide" matches the desktop spec. */
  size?: "compact" | "wide";
}

// Toban StatCard — label + large numeric value + unit, with an optional
// delta pill. Mirrors `screens.jsx:737-745` (compact) and
// `desktop.jsx:328-337` (wide with delta).
function StatCard({
  label,
  value,
  unit,
  accent,
  delta,
  size = "compact",
  className,
  ...rest
}: StatCardProps) {
  const isWide = size === "wide";
  return (
    <Card
      data-slot="stat-card"
      className={cn(
        "flex flex-col gap-0",
        isWide ? "py-[18px]" : "items-center py-3.5 text-center",
        className,
      )}
      {...rest}
    >
      <div className="px-4 text-[11px] font-semibold text-text-secondary">
        {label}
      </div>
      <div
        className={cn(
          "mt-1 flex items-baseline gap-1.5 px-4",
          isWide ? "justify-start" : "justify-center",
        )}
      >
        <span
          className={cn(
            "font-extrabold tracking-tight text-text-primary",
            isWide ? "text-[32px] leading-none" : "text-[26px] leading-none",
          )}
          style={accent ? { color: accent } : undefined}
        >
          {value}
        </span>
        {unit && (
          <span className="text-xs font-bold text-text-secondary">{unit}</span>
        )}
        {delta && (
          <span className="ml-auto rounded-full bg-[#E5F5EC] px-2 py-0.5 text-[11px] font-bold text-[#2F8B58]">
            {delta}
          </span>
        )}
      </div>
    </Card>
  );
}

export { StatCard };
export type { StatCardProps };
