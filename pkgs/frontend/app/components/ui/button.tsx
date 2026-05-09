/**
 * Phase 1-2 transitional Button — issue #420.
 *
 * Just enough surface area to keep CommonButton and other call sites
 * compiling. Issue #426 (Phase 2-1) replaces this with the Shadcn variants
 * (primary / soft / secondary / ghost / danger / dark) defined in the design
 * spec. Until then we expose a permissive prop bag so existing pass-throughs
 * (size, backgroundColor, w, etc.) don't trip TypeScript.
 */
import { Slot } from "@radix-ui/react-slot";
import {
  type ButtonHTMLAttributes,
  type CSSProperties,
  type ReactNode,
  forwardRef,
} from "react";
import type { ChakraStyleProps } from "~/components/chakra-shim";
import { cn } from "~/lib/utils";

/**
 * `ButtonProps` is intentionally permissive during the Phase 1-2 transition:
 * call sites still pass Chakra-shaped props like `mt={2}` / `_hover={{ bg }}` /
 * `as="a"` etc. We compose with `ChakraStyleProps` (an explicit list of
 * Chakra style props) instead of using `any` so biome's `noExplicitAny` rule
 * stays happy while still accepting the legacy prop bag.
 */
export interface ButtonProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "size">,
    ChakraStyleProps {
  asChild?: boolean;
  loading?: boolean;
  loadingText?: ReactNode;
  size?: "xs" | "sm" | "md" | "lg" | string;
}

const toCssLength = (v: string | number | undefined) =>
  v == null ? undefined : typeof v === "number" ? `${v}px` : v;

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    {
      asChild,
      className,
      loading,
      loadingText,
      children,
      style,
      w,
      width,
      backgroundColor,
      bgColor,
      bg,
      color,
      borderRadius,
      rounded,
      colorScheme: _cs,
      colorPalette: _cp,
      size: _size,
      variant: _variant,
      ...rest
    },
    ref,
  ) {
    const Component = asChild ? Slot : "button";
    const resolvedRadius = borderRadius ?? rounded;
    const inlineStyle: CSSProperties = {
      ...(toCssLength(w) && { width: toCssLength(w) }),
      ...(toCssLength(width) && { width: toCssLength(width) }),
      ...((backgroundColor || bgColor || bg) && {
        backgroundColor: backgroundColor ?? bgColor ?? bg,
      }),
      ...(color && { color }),
      ...(toCssLength(resolvedRadius) && {
        borderRadius: toCssLength(resolvedRadius),
      }),
      ...style,
    };
    return (
      <Component
        ref={ref}
        type={asChild ? undefined : (rest.type ?? "button")}
        className={cn(
          "inline-flex items-center justify-center gap-2 rounded-sm bg-primary px-4 py-2 font-semibold text-foreground transition-opacity hover:opacity-90 disabled:opacity-50 disabled:pointer-events-none",
          className,
        )}
        style={inlineStyle}
        disabled={rest.disabled || loading}
        {...rest}
      >
        {loading ? (loadingText ?? children) : children}
      </Component>
    );
  },
);
