import type * as React from "react";

import { Card } from "~/components/ui/card";
import { Typography } from "~/components/ui/typography";
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
      <Typography
        as="div"
        variant="micro"
        tone="secondary"
        weight="semibold"
        className="px-4"
      >
        {label}
      </Typography>
      <div
        className={cn(
          "mt-1 flex items-baseline gap-1.5 px-4",
          isWide ? "justify-start" : "justify-center",
        )}
      >
        <Typography
          as="span"
          variant={isWide ? "statLg" : "statMd"}
          style={accent ? { color: accent } : undefined}
        >
          {value}
        </Typography>
        {unit && (
          <Typography
            as="span"
            variant="caption"
            tone="secondary"
            weight="bold"
          >
            {unit}
          </Typography>
        )}
        {delta && (
          <Typography
            as="span"
            variant="micro"
            weight="bold"
            className="ml-auto rounded-full bg-[#E5F5EC] px-2 py-0.5 text-[#2F8B58]"
          >
            {delta}
          </Typography>
        )}
      </div>
    </Card>
  );
}

export { StatCard };
export type { StatCardProps };
