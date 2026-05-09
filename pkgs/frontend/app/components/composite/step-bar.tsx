import type * as React from "react";

import { cn } from "~/lib/utils";

interface StepBarProps extends React.ComponentProps<"div"> {
  /** Total number of steps in the flow (>= 1). */
  total: number;
  /** 0-indexed current step. Earlier steps render filled. */
  current: number;
  /** Aria-label for the whole progress group. */
  ariaLabel?: string;
}

// Toban StepBar — segmented progress bar for multi-step flows. Mirrors
// `docs/design/handoff/project/edit-screens.jsx:219-229`.
function StepBar({
  total,
  current,
  ariaLabel,
  className,
  ...rest
}: StepBarProps) {
  const safeTotal = Math.max(1, total);
  const safeCurrent = Math.max(0, Math.min(safeTotal - 1, current));
  const steps = Array.from({ length: safeTotal }, (_, i) => `step-${i}`);
  return (
    <div
      data-slot="step-bar"
      aria-label={ariaLabel}
      aria-valuemin={0}
      aria-valuemax={safeTotal - 1}
      aria-valuenow={safeCurrent}
      className={cn("flex w-full gap-1.5", className)}
      {...rest}
    >
      {steps.map((id, i) => (
        <div
          key={id}
          data-active={i <= safeCurrent ? "" : undefined}
          className={cn(
            "h-1 flex-1 rounded-xs transition-colors duration-200",
            i <= safeCurrent ? "bg-primary" : "bg-border",
          )}
        />
      ))}
    </div>
  );
}

export { StepBar };
export type { StepBarProps };
