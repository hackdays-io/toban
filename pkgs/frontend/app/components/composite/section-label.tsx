import type * as React from "react";

import { Typography } from "~/components/ui/typography";
import { cn } from "~/lib/utils";

// Toban SectionLabel — small caps caption that introduces a section
// (e.g. "あなたの当番"). Mirrors
// `docs/design/handoff/project/screens.jsx:87-89`.
function SectionLabel({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <Typography
      as="div"
      variant="label"
      data-slot="section-label"
      className={cn("px-5 pt-1 pb-2", className)}
      {...props}
    />
  );
}

export { SectionLabel };
