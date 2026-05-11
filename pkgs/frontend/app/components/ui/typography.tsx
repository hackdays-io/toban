import { type VariantProps, cva } from "class-variance-authority";
import { Slot } from "radix-ui";
import type * as React from "react";

import { cn } from "~/lib/utils";

// Toban Typography primitive. Variant carries the full visual scale
// (font size + line-height) so call sites never reach for `text-*`
// Tailwind utilities. `tone` controls colour, `weight` lets a caller
// bump weight without leaving the variant. Sizes were derived from the
// renewed surfaces; the 14px / `text-sm` slot collapses into `bodySm`
// (13px) on purpose — we don't want two adjacent compact-body variants.
const typographyVariants = cva("", {
  variants: {
    variant: {
      // LP marketing emphasis paragraph — fluid between body and h1.
      display: "text-[clamp(22px,3.4vw,40px)] font-extrabold leading-[1.45]",
      // Numeric stat display — wide (desktop) StatCard.
      statLg: "text-[32px] font-extrabold leading-none tracking-tight",
      // Numeric stat display — compact (mobile) StatCard.
      statMd: "text-[26px] font-extrabold leading-none tracking-tight",
      // LP / page intro body — slightly larger than `body`.
      lead: "text-base font-medium leading-relaxed md:text-[17px]",
      // Default running body copy.
      body: "text-[15px] leading-relaxed",
      // Compact body — card descriptions, secondary copy. Absorbs
      // `text-sm` callers too.
      bodySm: "text-[13px] leading-relaxed",
      // One-liner caption / meta line.
      caption: "text-xs leading-tight",
      // Smallest readable size for counters / disclaimers.
      micro: "text-[11px] leading-tight",
      // Form-control / section label (compact bold caption).
      label: "text-xs font-bold tracking-[0.03em] text-text-secondary",
      // Mono-spaced address / hash.
      mono: "font-mono text-[11px] leading-tight",
    },
    tone: {
      primary: "text-text-primary",
      secondary: "text-text-secondary",
      muted: "text-text-secondary",
      danger: "text-danger",
      success: "text-[#2F8B58]",
    },
    weight: {
      regular: "font-normal",
      medium: "font-medium",
      semibold: "font-semibold",
      bold: "font-bold",
    },
    truncate: {
      true: "truncate",
    },
  },
  defaultVariants: {
    variant: "body",
    tone: "primary",
  },
});

type TypographyElement = "p" | "span" | "div";

interface TypographyProps
  extends Omit<React.ComponentProps<"p">, "color">,
    VariantProps<typeof typographyVariants> {
  /** HTML element to render. Defaults to `p`. */
  as?: TypographyElement;
  /** Render via Radix Slot so the parent passes its own element. */
  asChild?: boolean;
}

function Typography({
  className,
  variant,
  tone,
  weight,
  truncate,
  as = "p",
  asChild = false,
  ...props
}: TypographyProps) {
  const Comp = asChild ? Slot.Root : as;
  return (
    <Comp
      data-slot="typography"
      data-variant={variant ?? "body"}
      className={cn(
        typographyVariants({ variant, tone, weight, truncate }),
        className,
      )}
      {...props}
    />
  );
}

export { Typography, typographyVariants };
export type { TypographyProps };
