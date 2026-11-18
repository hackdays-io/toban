import { type VariantProps, cva } from "class-variance-authority";
import { Slot } from "radix-ui";
import type * as React from "react";

import { Spinner } from "~/components/ui/spinner";
import { cn } from "~/lib/utils";

// Toban Button — variants, sizes and shape come from the design tokens defined
// in `app/styles/globals.css`. The full-pill radius and 48 px default height
// are intentional brand cues: every primary CTA in the prototype is round.
const buttonVariants = cva(
  "inline-flex shrink-0 select-none items-center justify-center gap-2 rounded-full font-semibold whitespace-nowrap outline-none transition-[transform,background-color,color,box-shadow] active:scale-[0.98] focus-visible:ring-[3px] focus-visible:ring-ring/40 disabled:pointer-events-none disabled:opacity-60 data-[loading]:opacity-100 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        primary:
          "bg-primary text-text-primary shadow-1 hover:brightness-[0.97] disabled:bg-[#F0E7CB] disabled:text-[#B0A179] disabled:opacity-100 disabled:shadow-none data-[loading]:bg-primary data-[loading]:text-text-primary data-[loading]:shadow-1",
        soft: "bg-primary-soft text-[#7A5A2E] hover:brightness-[0.97]",
        secondary:
          "border border-border bg-surface text-text-primary hover:bg-bg",
        ghost: "bg-transparent text-text-secondary hover:bg-primary-soft/60",
        danger:
          "border border-border bg-surface text-danger hover:bg-[#FBE5E2]",
        dark: "bg-text-primary text-white hover:brightness-110",
      },
      size: {
        sm: "h-9 px-[14px] text-sm",
        md: "h-12 px-5 text-[15px]",
        lg: "h-14 px-6 text-base",
        "icon-sm": "size-9 px-0",
        icon: "size-12 px-0",
        "icon-lg": "size-14 px-0",
      },
      full: {
        true: "w-full",
        false: "",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
      full: false,
    },
  },
);

// Spinners inherit the button's own text colour so every variant keeps its
// contrast (primary is dark-on-yellow, dark is white-on-black). Size tracks the
// `[&_svg]` rules above so a spinner and a leading icon occupy the same box.
const spinnerSizeForButton = {
  sm: "size-4 border-2",
  md: "size-4 border-2",
  lg: "size-[18px] border-2",
  "icon-sm": "size-4 border-2",
  icon: "size-5 border-2",
  "icon-lg": "size-6 border-[2.5px]",
} as const;

function Button({
  className,
  variant,
  size,
  full,
  asChild = false,
  loading = false,
  loadingText,
  disabled,
  children,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
    /**
     * Swap the label for a spinner and block interaction. Prefer this over a
     * bare `disabled` for anything that waits on a network or chain write —
     * `disabled` alone reads as "not allowed", not "working on it" (#548).
     */
    loading?: boolean;
    /** Replaces the label while `loading`. Omit to keep the label in place. */
    loadingText?: React.ReactNode;
  }) {
  const Comp = asChild ? Slot.Root : "button";

  // `Slot.Root` forwards onto a single child element, so there is nowhere to
  // inject a spinner. Callers that need a loading state should render a real
  // button instead of `asChild`.
  const showSpinner = loading && !asChild;
  // An icon-only button has no room for both; the spinner replaces the icon.
  const iconOnly = (size ?? "md").startsWith("icon");

  return (
    <Comp
      data-slot="button"
      data-variant={variant ?? "primary"}
      data-size={size ?? "md"}
      data-loading={loading ? "" : undefined}
      aria-busy={loading || undefined}
      disabled={asChild ? disabled : disabled || loading}
      className={cn(buttonVariants({ variant, size, full, className }))}
      {...props}
    >
      {showSpinner ? (
        <>
          <Spinner
            className={cn(
              "border-current/30 border-t-current",
              spinnerSizeForButton[size ?? "md"],
            )}
          />
          {iconOnly ? null : (loadingText ?? children)}
        </>
      ) : (
        children
      )}
    </Comp>
  );
}

export { Button, buttonVariants };
