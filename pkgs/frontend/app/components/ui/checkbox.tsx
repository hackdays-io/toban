/**
 * Phase 1-2 Checkbox — issue #420.
 *
 * Plain HTML checkbox wrapped in a label so existing call sites keep
 * compiling. Phase 2-1 (#426) replaces this with the Shadcn Checkbox.
 */
import {
  type InputHTMLAttributes,
  type ReactNode,
  type Ref,
  forwardRef,
} from "react";
import { cn } from "~/lib/utils";

export interface CheckboxProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "size"> {
  icon?: ReactNode;
  inputProps?: InputHTMLAttributes<HTMLInputElement>;
  rootRef?: Ref<HTMLLabelElement>;
  size?: string;
  variant?: string;
  colorScheme?: string;
  colorPalette?: string;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  function Checkbox(props, ref) {
    const {
      icon: _icon,
      children,
      inputProps,
      rootRef,
      className,
      size: _size,
      variant: _variant,
      colorScheme: _cs,
      colorPalette: _cp,
      ...rest
    } = props;
    return (
      <label
        ref={rootRef}
        className={cn(
          "inline-flex items-center gap-2 cursor-pointer select-none",
          className,
        )}
      >
        <input
          ref={ref}
          type="checkbox"
          className="size-4 rounded-xs border border-border accent-primary"
          {...rest}
          {...inputProps}
        />
        {children != null && <span>{children}</span>}
      </label>
    );
  },
);
