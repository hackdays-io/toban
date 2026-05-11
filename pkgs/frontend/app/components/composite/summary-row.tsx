import type * as React from "react";

import { Typography } from "~/components/ui/typography";
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
      <Typography
        as="span"
        variant="caption"
        tone="secondary"
        weight="semibold"
      >
        {label}
      </Typography>
      <Typography
        as="span"
        variant="bodySm"
        weight="semibold"
        className="inline-flex items-center text-right"
      >
        {value}
      </Typography>
    </div>
  );
}

export { SummaryRow };
export type { SummaryRowProps };
