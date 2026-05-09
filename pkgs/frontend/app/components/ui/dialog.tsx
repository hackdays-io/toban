/**
 * Phase 1-2 Dialog — issue #420.
 *
 * Replaces the Chakra v3 Dialog wrapper with @radix-ui/react-dialog so that
 * roleAttributeDialog/, SwitchNetwork, and CommonDialog keep working without
 * Chakra. Phase 2-2 (#427) replaces this with the full Shadcn Dialog.
 *
 * The exported names match Chakra's so call sites compile unchanged:
 *   DialogRoot / DialogTrigger / DialogContent / DialogHeader / DialogBody /
 *   DialogFooter / DialogTitle / DialogDescription / DialogCloseTrigger /
 *   DialogActionTrigger / DialogBackdrop.
 */
import * as DialogPrimitive from "@radix-ui/react-dialog";
import {
  type ComponentPropsWithoutRef,
  type ElementRef,
  type HTMLAttributes,
  type ReactNode,
  forwardRef,
} from "react";
import type { ChakraStyleProps } from "~/components/chakra-shim";
import { cn } from "~/lib/utils";

/**
 * Chakra v3 Dialog.Root signals open-state changes with
 * `onOpenChange={(details) => details.open}`; Radix uses
 * `onOpenChange={(open: boolean) => ...}`. We adapt the callback at the
 * boundary so existing handlers like `setOpen(d.open)` keep working.
 */
type DialogRootProps = Omit<
  ComponentPropsWithoutRef<typeof DialogPrimitive.Root>,
  "onOpenChange"
> & {
  onOpenChange?: (details: { open: boolean }) => void;
};

export const DialogRoot = ({ onOpenChange, ...rest }: DialogRootProps) => (
  <DialogPrimitive.Root
    onOpenChange={
      onOpenChange ? (open: boolean) => onOpenChange({ open }) : undefined
    }
    {...rest}
  />
);

// Permissive Trigger / Close so Chakra-style style props (height, etc.) don't
// trip TypeScript during the transition. Phase 2-2 (#427) tightens these.
type DialogTriggerProps = ComponentPropsWithoutRef<
  typeof DialogPrimitive.Trigger
> &
  ChakraStyleProps;
export const DialogTrigger = forwardRef<
  ElementRef<typeof DialogPrimitive.Trigger>,
  DialogTriggerProps
>(function DialogTrigger(props, ref) {
  return <DialogPrimitive.Trigger ref={ref} {...props} />;
});

// ActionTrigger in Chakra closes the dialog when the wrapped element is
// activated. Radix's `Close` does the same.
export const DialogActionTrigger = DialogPrimitive.Close;

type DialogContentProps = ComponentPropsWithoutRef<
  typeof DialogPrimitive.Content
> &
  ChakraStyleProps & {
    portalled?: boolean;
    backdrop?: boolean;
  };

export const DialogContent = forwardRef<
  ElementRef<typeof DialogPrimitive.Content>,
  DialogContentProps
>(function DialogContent(
  { children, className, backdrop = true, mx, my, style, ...rest },
  ref,
) {
  // ChakraStyleProps allows `mx` to be `number | string`. The Chakra spacing
  // scale multiplies numbers by 4; strings (e.g. "1rem") pass through.
  const toLen = (v: number | string | undefined) =>
    typeof v === "number" ? `${v * 4}px` : v;
  const inlineStyle = {
    ...(mx != null && {
      marginLeft: toLen(mx),
      marginRight: toLen(mx),
    }),
    ...(my != null && {
      marginTop: toLen(my),
      marginBottom: toLen(my),
    }),
    ...style,
  };
  return (
    <DialogPrimitive.Portal>
      {backdrop && (
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-overlay data-[state=open]:animate-in data-[state=open]:fade-in-0" />
      )}
      <DialogPrimitive.Content
        ref={ref}
        className={cn(
          "fixed left-1/2 top-1/2 z-50 grid w-full max-w-lg -translate-x-1/2 -translate-y-1/2 gap-4 rounded-md bg-surface p-6 shadow-3 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95",
          className,
        )}
        style={inlineStyle}
        {...rest}
      >
        {children}
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
});

type DialogCloseTriggerProps = ComponentPropsWithoutRef<
  typeof DialogPrimitive.Close
>;

export const DialogCloseTrigger = forwardRef<
  ElementRef<typeof DialogPrimitive.Close>,
  DialogCloseTriggerProps
>(function DialogCloseTrigger({ children, className, ...rest }, ref) {
  return (
    <DialogPrimitive.Close
      ref={ref}
      className={cn(
        "absolute right-2 top-2 inline-flex h-8 w-8 items-center justify-center rounded-xs text-text-secondary hover:bg-primary-soft",
        className,
      )}
      {...rest}
    >
      {children ?? "×"}
    </DialogPrimitive.Close>
  );
});

export const DialogHeader = ({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn("flex flex-col gap-1.5 text-left", className)}
    {...props}
  />
);

export const DialogFooter = ({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col-reverse gap-2 sm:flex-row sm:justify-end",
      className,
    )}
    {...props}
  />
);

export const DialogBody = ({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("py-2", className)} {...props} />
);

type DialogTitleProps = ComponentPropsWithoutRef<
  typeof DialogPrimitive.Title
> & {
  fontSize?: string;
  fontWeight?: string | number;
};

export const DialogTitle = forwardRef<
  ElementRef<typeof DialogPrimitive.Title>,
  DialogTitleProps
>(function DialogTitle(
  { className, fontSize, fontWeight, style, ...rest },
  ref,
) {
  const inlineStyle = {
    ...(fontSize && { fontSize }),
    ...(fontWeight != null && { fontWeight }),
    ...style,
  };
  return (
    <DialogPrimitive.Title
      ref={ref}
      className={cn("text-lg font-semibold leading-none", className)}
      style={inlineStyle}
      {...rest}
    />
  );
});

export const DialogDescription = forwardRef<
  ElementRef<typeof DialogPrimitive.Description>,
  ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(function DialogDescription({ className, ...rest }, ref) {
  return (
    <DialogPrimitive.Description
      ref={ref}
      className={cn("text-sm text-text-secondary", className)}
      {...rest}
    />
  );
});

export const DialogBackdrop = ({
  children,
}: {
  children?: ReactNode;
}) => <>{children}</>;
