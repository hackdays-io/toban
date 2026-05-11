import type * as React from "react";

import { Typography } from "~/components/ui/typography";
import { cn } from "~/lib/utils";

interface WeightBarProps extends React.ComponentProps<"div"> {
  label: React.ReactNode;
  /** 0–100. Values outside the range are clamped. */
  pct: number;
  /** Bar fill colour — typically a Toban brand colour for the category. */
  color?: string;
}

// Toban WeightBar — category label, percent and a horizontal fill bar.
// Mirrors `docs/design/handoff/project/screens.jsx:626-636`.
function WeightBar({
  label,
  pct,
  color = "var(--color-primary)",
  className,
  ...rest
}: WeightBarProps) {
  const clamped = Math.max(0, Math.min(100, pct));
  return (
    <div data-slot="weight-bar" className={cn("w-full", className)} {...rest}>
      <div className="mb-1.5 flex items-baseline justify-between">
        <Typography as="span" variant="bodySm" weight="semibold">
          {label}
        </Typography>
        <Typography
          as="span"
          variant="bodySm"
          weight="bold"
          className="tabular-nums"
          style={{ color }}
        >
          {clamped}%
        </Typography>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-xs bg-[#F0EBE0]">
        <div
          className="h-full rounded-xs transition-[width] duration-200"
          style={{ width: `${clamped}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

export { WeightBar };
export type { WeightBarProps };
