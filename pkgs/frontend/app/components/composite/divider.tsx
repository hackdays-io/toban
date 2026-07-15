import type * as React from "react";

import { cn } from "~/lib/utils";

interface DividerProps extends React.ComponentProps<"hr"> {
  /** Left inset in pixels; matches the design source's `inset` prop. */
  inset?: number;
}

// Toban Divider — single hairline rule with an optional left inset (e.g.
// to align with an Avatar in a Row).
// Mirrors `docs/design/handoff/project/primitives.jsx:207-209`.
function Divider({ inset = 0, className, style, ...props }: DividerProps) {
  return (
    // `<hr>` keeps `width: auto` so margin-left (the inset) reduces its
    // computed width instead of overflowing — `w-full` would force 100% and
    // push the right edge past the parent.
    <hr
      data-slot="divider"
      className={cn("block h-px border-0 bg-border", className)}
      style={inset ? { marginLeft: inset, ...style } : style}
      {...props}
    />
  );
}

export { Divider };
export type { DividerProps };
