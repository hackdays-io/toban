import type * as React from "react";

import { Label } from "~/components/ui/label";
import { cn } from "~/lib/utils";

// Toban FieldLabel — small uppercase-ish caption above a form control.
// Mirrors `docs/design/handoff/project/screens.jsx:434`. Wraps the shadcn
// `Label` (Radix Label primitive) so callers can pass `htmlFor` for proper
// a11y association and the linter is happy with the underlying control.
function FieldLabel({
  className,
  ...props
}: React.ComponentProps<typeof Label>) {
  return (
    <Label
      data-slot="field-label"
      className={cn(
        "mb-2 block text-xs font-bold tracking-[0.03em] text-text-secondary",
        className,
      )}
      {...props}
    />
  );
}

export { FieldLabel };
