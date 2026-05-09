/**
 * Phase 1-2 Field — issue #420.
 *
 * Lightweight form-field wrapper providing label + helper / error text.
 * Phase 2-1 (#426) introduces FieldLabel / SectionLabel as proper Shadcn
 * primitives.
 */
import { type HTMLAttributes, type ReactNode, forwardRef } from "react";
import type { ChakraStyleProps } from "~/components/chakra-shim";
import { cn } from "~/lib/utils";

export interface FieldProps
  extends HTMLAttributes<HTMLDivElement>,
    ChakraStyleProps {
  label?: ReactNode;
  helperText?: ReactNode;
  errorText?: ReactNode;
  optionalText?: ReactNode;
  invalid?: boolean;
  required?: boolean;
  disabled?: boolean;
}

export const Field = forwardRef<HTMLDivElement, FieldProps>(function Field(
  {
    label,
    children,
    helperText,
    errorText,
    optionalText,
    className,
    invalid,
    required,
    disabled,
    ...rest
  },
  ref,
) {
  return (
    <div
      ref={ref}
      className={cn(
        "flex flex-col gap-1.5",
        disabled && "opacity-60 pointer-events-none",
        className,
      )}
      {...rest}
    >
      {label && (
        // biome-ignore lint/a11y/noLabelWithoutControl: the input lives in
        // {children} below; tying it via htmlFor needs an id we don't own
        // here. #426 introduces FieldLabel as a proper Shadcn primitive
        // that wires this through Radix Form context.
        <span className="text-sm font-semibold text-text-primary">
          {label}
          {required ? (
            <span className="ml-0.5 text-danger">*</span>
          ) : optionalText ? (
            <span className="ml-1 text-xs text-text-secondary">
              {optionalText}
            </span>
          ) : null}
        </span>
      )}
      {children}
      {helperText && (
        <p className="text-xs text-text-secondary">{helperText}</p>
      )}
      {errorText && invalid && (
        <p className="text-xs text-danger">{errorText}</p>
      )}
    </div>
  );
});
