import type * as React from "react";

import { cn } from "~/lib/utils";

interface ChipProps extends React.ComponentProps<"button"> {
  active?: boolean;
}

// Toban Chip — single-tag pill with an active state. Mirrors
// `docs/design/handoff/project/primitives.jsx:156-169`.
function Chip({ className, active, type = "button", ...props }: ChipProps) {
  return (
    <button
      type={type}
      data-slot="chip"
      data-active={active ? "" : undefined}
      className={cn(
        "inline-flex h-[34px] shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-3.5 text-[13px] font-semibold transition-colors disabled:pointer-events-none disabled:opacity-50",
        active
          ? "border-text-primary bg-text-primary text-white"
          : "border-border bg-surface text-text-primary hover:bg-bg",
        "[&_svg]:pointer-events-none [&_svg]:size-3.5 [&_svg]:shrink-0",
        className,
      )}
      {...props}
    />
  );
}

export { Chip };
export type { ChipProps };
