import { useId } from "react";
import type * as React from "react";

import { Switch } from "~/components/ui/switch";
import { cn } from "~/lib/utils";

interface ToggleRowProps extends React.ComponentProps<"div"> {
  label: React.ReactNode;
  /** Smaller helper text shown below the label. */
  sub?: React.ReactNode;
  checked: boolean;
  onCheckedChange: (next: boolean) => void;
  disabled?: boolean;
}

// Toban ToggleRow — list-row with label + optional sub-text and a trailing
// Switch. Mirrors `docs/design/handoff/project/edit-screens.jsx:179-198`.
function ToggleRow({
  label,
  sub,
  checked,
  onCheckedChange,
  disabled,
  className,
  ...rest
}: ToggleRowProps) {
  const id = useId();
  return (
    <div
      data-slot="toggle-row"
      className={cn(
        "flex items-center gap-3 px-4 py-3.5",
        disabled && "opacity-60",
        className,
      )}
      {...rest}
    >
      <div className="min-w-0 flex-1">
        <label
          htmlFor={id}
          className="block text-sm font-semibold text-text-primary"
        >
          {label}
        </label>
        {sub && (
          <div className="mt-0.5 text-[11px] leading-snug text-text-secondary">
            {sub}
          </div>
        )}
      </div>
      <Switch
        id={id}
        checked={checked}
        onCheckedChange={onCheckedChange}
        disabled={disabled}
      />
    </div>
  );
}

export { ToggleRow };
export type { ToggleRowProps };
