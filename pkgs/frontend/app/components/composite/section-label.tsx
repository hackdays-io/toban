import type * as React from "react";

import { cn } from "~/lib/utils";

// Toban SectionLabel — small caps caption that introduces a section
// (e.g. "あなたの当番"). Mirrors
// `docs/design/handoff/project/screens.jsx:87-89`.
function SectionLabel({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="section-label"
      className={cn(
        "px-5 pt-1 pb-2 text-xs font-bold tracking-[0.04em] text-text-secondary",
        className,
      )}
      {...props}
    />
  );
}

export { SectionLabel };
