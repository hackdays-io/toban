import type * as React from "react";

import { cn } from "~/lib/utils";

const spinnerSizeClass = {
  sm: "size-5 border-2",
  md: "size-8 border-[2.5px]",
  lg: "size-10 border-[3px]",
} as const;

interface SpinnerProps extends React.ComponentProps<"span"> {
  /** Visual size — matches the auth / account-menu use cases. */
  size?: keyof typeof spinnerSizeClass;
}

// Toban Spinner — circular border-only spinner sized off the design
// tokens. Used by `AccountMenu` (sm) and the login transitional card
// (lg). Prefer this over hand-rolled `animate-spin rounded-full …`
// utilities so the visual stays consistent.
function Spinner({
  size = "md",
  className,
  "aria-hidden": ariaHidden = true,
  ...rest
}: SpinnerProps) {
  return (
    <span
      data-slot="spinner"
      aria-hidden={ariaHidden}
      className={cn(
        "inline-block animate-spin rounded-full border-border border-t-primary",
        spinnerSizeClass[size],
        className,
      )}
      {...rest}
    />
  );
}

export { Spinner };
export type { SpinnerProps };
