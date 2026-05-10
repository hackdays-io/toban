"use client";

/**
 * Phase 1-2 Menu — issue #420.
 *
 * Reimplements the small slice of Chakra v3 Menu that the app actually uses
 * (Header workspace switcher + user menu) on top of @radix-ui/react-dropdown-
 * menu. Phase 2-2 (#427) replaces this with the full Shadcn DropdownMenu.
 *
 * Chakra's MenuItem accepts a `value` prop and a `closeOnSelect` flag; we
 * accept and ignore them since Radix doesn't need value-based identification
 * and closes by default.
 */
import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu";
import {
  type ComponentPropsWithoutRef,
  type ElementRef,
  forwardRef,
} from "react";
import { cn } from "~/lib/utils";

export const MenuRoot = DropdownMenuPrimitive.Root;
export const MenuTrigger = DropdownMenuPrimitive.Trigger;
export const MenuSeparator = DropdownMenuPrimitive.Separator;

type MenuContentProps = ComponentPropsWithoutRef<
  typeof DropdownMenuPrimitive.Content
> & {
  portalled?: boolean;
  // Chakra-style style props that Header passes through; consumed for layout.
  mt?: number;
  ml?: number;
  py?: number;
  px?: number;
  borderRadius?: number;
  minW?: number;
};

export const MenuContent = forwardRef<
  ElementRef<typeof DropdownMenuPrimitive.Content>,
  MenuContentProps
>(function MenuContent(
  { className, mt, ml, py, px, borderRadius, minW, style, ...rest },
  ref,
) {
  const inlineStyle = {
    ...(mt != null && { marginTop: `${mt * 4}px` }),
    ...(ml != null && { marginLeft: `${ml * 4}px` }),
    ...(py != null && {
      paddingTop: `${py * 4}px`,
      paddingBottom: `${py * 4}px`,
    }),
    ...(px != null && {
      paddingLeft: `${px * 4}px`,
      paddingRight: `${px * 4}px`,
    }),
    ...(borderRadius != null && { borderRadius: `${borderRadius}px` }),
    ...(minW != null && { minWidth: `${minW * 4}px` }),
    ...style,
  };
  return (
    <DropdownMenuPrimitive.Portal>
      <DropdownMenuPrimitive.Content
        ref={ref}
        sideOffset={4}
        className={cn(
          "z-50 min-w-32 overflow-hidden rounded-sm border border-border bg-surface p-1 text-foreground shadow-2",
          className,
        )}
        style={inlineStyle}
        {...rest}
      />
    </DropdownMenuPrimitive.Portal>
  );
});

type MenuItemProps = Omit<
  ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Item>,
  "value"
> & {
  // Chakra v3 MenuItem requires `value`; Radix doesn't. Consume so callers
  // don't need to be touched in Phase 1-2.
  value?: string;
  closeOnSelect?: boolean;
  // Chakra style passthroughs the Header relies on.
  bgColor?: string;
  display?: string;
  fontWeight?: string | number;
  fontSize?: string;
  px?: number;
  pt?: number;
  pb?: number;
  mb?: number;
  cursor?: string;
};

export const MenuItem = forwardRef<
  ElementRef<typeof DropdownMenuPrimitive.Item>,
  MenuItemProps
>(function MenuItem(
  {
    className,
    value: _value,
    closeOnSelect,
    bgColor,
    display,
    fontWeight,
    fontSize,
    px,
    pt,
    pb,
    mb,
    cursor,
    style,
    ...rest
  },
  ref,
) {
  const inlineStyle = {
    ...(bgColor && { backgroundColor: bgColor }),
    ...(display && { display }),
    ...(fontWeight != null && { fontWeight }),
    ...(fontSize && { fontSize }),
    ...(px != null && {
      paddingLeft: `${px * 4}px`,
      paddingRight: `${px * 4}px`,
    }),
    ...(pt != null && { paddingTop: `${pt * 4}px` }),
    ...(pb != null && { paddingBottom: `${pb * 4}px` }),
    ...(mb != null && { marginBottom: `${mb * 4}px` }),
    ...(cursor && { cursor }),
    ...style,
  };
  return (
    <DropdownMenuPrimitive.Item
      ref={ref}
      className={cn(
        "relative flex cursor-pointer select-none items-center rounded-xs px-3 py-2 text-sm outline-none focus:bg-primary-soft data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
        className,
      )}
      style={inlineStyle}
      onSelect={
        closeOnSelect === false
          ? (event: Event) => event.preventDefault()
          : undefined
      }
      {...rest}
    />
  );
});

// Compatibility re-exports for the (unused-in-app) advanced Chakra Menu
// surface; kept so the file's exported API matches the previous one.
export const MenuArrow = (props: { children?: React.ReactNode }) => (
  <>{props.children}</>
);
export const MenuCheckboxItem = MenuItem;
export const MenuRadioItem = MenuItem;
export const MenuItemGroup = ({
  title,
  children,
}: {
  title?: React.ReactNode;
  children?: React.ReactNode;
}) => (
  <>
    {title}
    {children}
  </>
);
export const MenuTriggerItem = MenuItem;
export const MenuRadioItemGroup = MenuItemGroup;
export const MenuContextTrigger = MenuTrigger;
export const MenuItemText = ({ children }: { children?: React.ReactNode }) => (
  <>{children}</>
);
export const MenuItemCommand = ({
  children,
}: {
  children?: React.ReactNode;
}) => <span className="ml-auto text-xs opacity-60">{children}</span>;
