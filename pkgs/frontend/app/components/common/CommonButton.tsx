import type { VariantProps } from "class-variance-authority";
import {
  type CSSProperties,
  type ComponentProps,
  type ReactNode,
  forwardRef,
} from "react";
import type { ChakraStyleProps } from "~/components/chakra-shim";
import { Button, type buttonVariants } from "~/components/ui/button";
import { cn } from "~/lib/utils";

type ShadcnSize = NonNullable<VariantProps<typeof buttonVariants>["size"]>;

const sizeMap: Record<string, ShadcnSize> = {
  md: "default",
  xl: "lg",
};

interface CommonButtonProps
  extends Omit<ChakraStyleProps, "variant" | "size">,
    Omit<ComponentProps<typeof Button>, "size" | "color"> {
  children: ReactNode;
  width?: "full" | number | string;
  backgroundColor?: string;
  bgColor?: string;
  bg?: string;
  color?: string;
  fontWeight?: string | number;
  borderRadius?: string | number;
  rounded?: string | number;
  size?: ShadcnSize | "md" | "xl";
  /** Render the button as a <label> via asChild — used for file-input wrappers. */
  as?: "button" | "label";
}

const toCss = (v: string | number | undefined) =>
  v == null ? undefined : typeof v === "number" ? `${v}px` : v;

export const CommonButton = forwardRef<HTMLButtonElement, CommonButtonProps>(
  function CommonButton(
    {
      children,
      width = "full",
      size = "md",
      backgroundColor,
      bgColor,
      bg,
      color,
      fontWeight,
      borderRadius = "12px",
      rounded,
      as,
      className,
      style,
      ...rest
    },
    ref,
  ) {
    const resolvedSize = (sizeMap[size as string] ?? size) as ShadcnSize;
    const wValue = width === "full" ? undefined : toCss(width);
    const inlineStyle: CSSProperties = {
      ...(wValue != null && { width: wValue }),
      ...((backgroundColor || bgColor || bg) && {
        backgroundColor: backgroundColor ?? bgColor ?? bg,
      }),
      ...(color && { color }),
      ...(fontWeight != null && { fontWeight }),
      ...(borderRadius != null && { borderRadius: toCss(borderRadius) }),
      ...(rounded != null && { borderRadius: toCss(rounded) }),
      ...style,
    };
    const widthClass = width === "full" ? "w-full" : "";

    if (as === "label") {
      return (
        <Button
          asChild
          size={resolvedSize}
          className={cn(widthClass, "cursor-pointer", className)}
          style={inlineStyle}
        >
          {/* biome-ignore lint/a11y/noLabelWithoutControl: callers (e.g. settings) place the <input type="file"> inside children so the label wraps a real control at the call site */}
          <label>{children}</label>
        </Button>
      );
    }

    return (
      <Button
        ref={ref}
        size={resolvedSize}
        className={cn(widthClass, className)}
        style={inlineStyle}
        {...rest}
      >
        {children}
      </Button>
    );
  },
);

export default CommonButton;
