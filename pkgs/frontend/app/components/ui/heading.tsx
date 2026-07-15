import { type VariantProps, cva } from "class-variance-authority";
import { Slot } from "radix-ui";
import type * as React from "react";

import { cn } from "~/lib/utils";

// Toban Heading primitive. Variant carries the full visual scale (font
// size + weight + line-height + tracking) so call sites never reach for
// `text-*` Tailwind utilities. `level` controls the semantic level used
// for the rendered element and document outline. The variant ladder is
// derived from the renewed surfaces (LP / auth / workspace list / app
// chrome); each variant maps 1:1 to a recurring visual role rather than
// to a pixel size so the underlying scale can shift in `globals.css`
// without touching call sites. See issue #491.
const headingVariants = cva("tracking-tight text-text-primary", {
  variants: {
    variant: {
      // Landing-page hero.
      display: "text-[clamp(34px,7vw,62px)] font-black leading-[1.15]",
      // Auth hero (login / signup) — sits between display and h1.
      hero: "text-[26px] font-extrabold leading-tight sm:text-3xl md:text-4xl",
      // LP section title.
      h1: "text-[clamp(28px,4vw,44px)] font-black leading-[1.18]",
      // App page title (workspace list / home / desktop TopBar).
      h2: "text-[22px] font-extrabold leading-tight md:text-[24px]",
      // Section heading / large card title (LP Principle / Feature / Step).
      h3: "text-[20px] font-extrabold leading-snug md:text-[22px]",
      // Use-case card / sub-section heading.
      h4: "text-lg font-extrabold leading-snug",
      // ScreenHeader title / smaller in-card title.
      h5: "text-[17px] font-bold leading-snug",
      // Row title / EmptyState title / very-tight in-card heading.
      h6: "text-[15px] font-bold leading-tight",
      // Eyebrow / footer column heading — small bold caption that
      // introduces a section. No implicit uppercase so JP copy renders
      // naturally; add `uppercase` via className for English eyebrows.
      eyebrow: "text-xs font-bold tracking-[0.04em] text-text-secondary",
    },
    tone: {
      primary: "text-text-primary",
      secondary: "text-text-secondary",
      danger: "text-danger",
    },
  },
  defaultVariants: {
    variant: "h2",
  },
});

type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6;

// Map a visual variant to a sensible default semantic level. Callers can
// still override with `level` when the document outline needs to diverge
// from the visual hierarchy.
const defaultLevelForVariant: Record<
  NonNullable<VariantProps<typeof headingVariants>["variant"]>,
  HeadingLevel
> = {
  display: 1,
  hero: 1,
  h1: 1,
  h2: 2,
  h3: 3,
  h4: 4,
  h5: 5,
  h6: 6,
  eyebrow: 6,
};

interface HeadingProps
  extends Omit<React.ComponentProps<"h2">, "color">,
    VariantProps<typeof headingVariants> {
  /** Semantic heading level for a11y. Defaults to the variant's natural level. */
  level?: HeadingLevel;
  /** Render via Radix Slot so the parent passes its own element. */
  asChild?: boolean;
}

function Heading({
  className,
  variant,
  tone,
  level,
  asChild = false,
  ...props
}: HeadingProps) {
  const resolvedVariant = variant ?? "h2";
  const resolvedLevel = level ?? defaultLevelForVariant[resolvedVariant];
  const Comp = asChild
    ? Slot.Root
    : (`h${resolvedLevel}` as "h1" | "h2" | "h3" | "h4" | "h5" | "h6");

  return (
    <Comp
      data-slot="heading"
      data-variant={resolvedVariant}
      className={cn(headingVariants({ variant, tone }), className)}
      {...props}
    />
  );
}

export { Heading, headingVariants };
export type { HeadingProps, HeadingLevel };
