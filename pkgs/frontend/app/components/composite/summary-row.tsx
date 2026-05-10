import type * as React from "react";

import { cn } from "~/lib/utils";

interface SummaryRowProps extends React.ComponentProps<"div"> {
  label: React.ReactNode;
  value: React.ReactNode;
}

// Toban SummaryRow — confirm-screen key/value row (label left, value right).
// Mirrors `docs/design/handoff/project/screens.jsx:435-440`.
function SummaryRow({ label, value, className, ...rest }: SummaryRowProps) {
  return (
    <div
      data-slot="summary-row"
      className={cn(
        "flex items-center justify-between gap-3 px-4 py-3.5",
        className,
      )}
      {...rest}
    >
      <span className="text-xs font-semibold text-text-secondary">{label}</span>
      <span className="inline-flex items-center text-right text-sm font-semibold text-text-primary">
        {value}
      </span>
    </div>
  );
}

export { SummaryRow };
export type { SummaryRowProps };
