import { type VariantProps, cva } from "class-variance-authority";
import { Slot } from "radix-ui";
import type * as React from "react";

import { cn } from "~/lib/utils";

// Toban Button — variants, sizes and shape come from the design tokens defined
// in `app/styles/globals.css`. The full-pill radius and 48 px default height
// are intentional brand cues: every primary CTA in the prototype is round.
const buttonVariants = cva(
  "inline-flex shrink-0 select-none items-center justify-center gap-2 rounded-full font-semibold whitespace-nowrap outline-none transition-[transform,background-color,color,box-shadow] active:scale-[0.98] focus-visible:ring-[3px] focus-visible:ring-ring/40 disabled:pointer-events-none disabled:opacity-60 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        primary:
          "bg-primary text-text-primary shadow-1 hover:brightness-[0.97] disabled:bg-[#F0E7CB] disabled:text-[#B0A179] disabled:opacity-100 disabled:shadow-none",
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

function Button({
  className,
  variant,
  size,
  full,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot.Root : "button";

  return (
    <Comp
      data-slot="button"
      data-variant={variant ?? "primary"}
      data-size={size ?? "md"}
      className={cn(buttonVariants({ variant, size, full, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
