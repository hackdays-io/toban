import { type VariantProps, cva } from "class-variance-authority";
import { Slot } from "radix-ui";
import type * as React from "react";

import { cn } from "~/lib/utils";

// Toban status badges. The bg/fg pairs are not in the brand palette because
// they're status-specific (e.g. green for member, blue for info). Using
// arbitrary Tailwind values keeps them inline with the design source rather
// than promoting six more tokens that no other component reads.
const badgeVariants = cva(
  "inline-flex w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-full border border-transparent px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap transition-[color,box-shadow] focus-visible:ring-[3px] focus-visible:ring-ring/40 [&>svg]:pointer-events-none [&>svg]:size-3",
  {
    variants: {
      kind: {
        member: "bg-[#E5F5EC] text-[#2F8B58]",
        lead: "bg-primary-soft text-[#A07310]",
        supporter: "bg-[#E8E2D4] text-[#7A5A2E]",
        role: "bg-[#F2EAD9] text-[#7A5A2E]",
        danger: "bg-[#FBE5E2] text-[#B5382C]",
        info: "bg-[#E2F0FB] text-[#2870A8]",
      },
    },
    defaultVariants: {
      kind: "member",
    },
  },
);

function Badge({
  className,
  kind,
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : "span";

  return (
    <Comp
      data-slot="badge"
      data-kind={kind ?? "member"}
      className={cn(badgeVariants({ kind }), className)}
      {...props}
    />
  );
}

export { Badge, badgeVariants };
