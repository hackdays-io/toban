import { Avatar as AvatarPrimitive } from "radix-ui";
import type * as React from "react";

import { cn } from "~/lib/utils";

// Toban deterministic palette — avatar fallback colour derived from a seed
// string (typically the member's name), mirroring `primitives.jsx:108-126`.
const SEED_PALETTE = [
  "#F5B82E",
  "#65C98A",
  "#5DADEC",
  "#D6B995",
  "#E48F4F",
  "#B696E0",
  "#E48ABF",
] as const;

function seedColor(seed: string): string {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return SEED_PALETTE[h % SEED_PALETTE.length];
}

function seedInitials(seed: string): string {
  const cleaned = seed.replace(/[^a-zA-Z぀-ヿ一-鿿]/g, "");
  return cleaned.slice(0, 2).toUpperCase() || "?";
}

function Avatar({
  className,
  size = "default",
  ...props
}: React.ComponentProps<typeof AvatarPrimitive.Root> & {
  size?: "default" | "sm" | "lg" | "xl";
}) {
  return (
    <AvatarPrimitive.Root
      data-slot="avatar"
      data-size={size}
      className={cn(
        "group/avatar relative flex size-9 shrink-0 select-none overflow-hidden rounded-full font-bold text-white data-[size=lg]:size-12 data-[size=sm]:size-7 data-[size=xl]:size-16",
        className,
      )}
      {...props}
    />
  );
}

function AvatarImage({
  className,
  ...props
}: React.ComponentProps<typeof AvatarPrimitive.Image>) {
  return (
    <AvatarPrimitive.Image
      data-slot="avatar-image"
      className={cn("aspect-square size-full object-cover", className)}
      {...props}
    />
  );
}

interface AvatarFallbackProps
  extends React.ComponentProps<typeof AvatarPrimitive.Fallback> {
  /** Optional seed string used to pick a deterministic background colour and
   *  initials when no `children` are supplied. */
  seed?: string;
}

function AvatarFallback({
  className,
  seed,
  children,
  style,
  ...props
}: AvatarFallbackProps) {
  const bg = seed ? seedColor(seed) : undefined;
  const fallbackText =
    children ?? (seed ? seedInitials(seed) : undefined) ?? "?";
  return (
    <AvatarPrimitive.Fallback
      data-slot="avatar-fallback"
      className={cn(
        "flex size-full items-center justify-center rounded-full text-[15px] tracking-tight group-data-[size=lg]/avatar:text-xl group-data-[size=sm]/avatar:text-xs group-data-[size=xl]/avatar:text-2xl",
        seed ? "text-white" : "bg-muted font-medium text-muted-foreground",
        className,
      )}
      style={bg ? { backgroundColor: bg, ...style } : style}
      {...props}
    >
      {fallbackText}
    </AvatarPrimitive.Fallback>
  );
}

function AvatarBadge({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="avatar-badge"
      className={cn(
        "absolute right-0 bottom-0 z-10 inline-flex items-center justify-center rounded-full bg-primary text-primary-foreground ring-2 ring-background select-none",
        "group-data-[size=sm]/avatar:size-2 group-data-[size=sm]/avatar:[&>svg]:hidden",
        "group-data-[size=default]/avatar:size-2.5 group-data-[size=default]/avatar:[&>svg]:size-2",
        "group-data-[size=lg]/avatar:size-3 group-data-[size=lg]/avatar:[&>svg]:size-2",
        "group-data-[size=xl]/avatar:size-4 group-data-[size=xl]/avatar:[&>svg]:size-3",
        className,
      )}
      {...props}
    />
  );
}

function AvatarGroup({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="avatar-group"
      className={cn(
        "group/avatar-group flex -space-x-2 *:data-[slot=avatar]:ring-2 *:data-[slot=avatar]:ring-background",
        className,
      )}
      {...props}
    />
  );
}

function AvatarGroupCount({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="avatar-group-count"
      className={cn(
        "relative flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-sm text-muted-foreground ring-2 ring-background group-has-data-[size=lg]/avatar-group:size-12 group-has-data-[size=sm]/avatar-group:size-7 group-has-data-[size=xl]/avatar-group:size-16 [&>svg]:size-4",
        className,
      )}
      {...props}
    />
  );
}

export {
  Avatar,
  AvatarImage,
  AvatarFallback,
  AvatarBadge,
  AvatarGroup,
  AvatarGroupCount,
  seedColor,
  seedInitials,
};
