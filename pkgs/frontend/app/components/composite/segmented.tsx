import type * as React from "react";

import { cn } from "~/lib/utils";

interface SegmentedOption<T extends string> {
  value: T;
  label: React.ReactNode;
}

interface SegmentedProps<T extends string>
  extends Omit<React.ComponentProps<"div">, "onChange"> {
  options: ReadonlyArray<SegmentedOption<T>>;
  value: T;
  onChange: (next: T) => void;
  /** Per-option aria-label override. Defaults to the option's label. */
  getOptionAriaLabel?: (opt: SegmentedOption<T>) => string;
}

// Toban Segmented control — pill background with a sliding active surface.
// Mirrors `docs/design/handoff/project/primitives.jsx:171-188`.
function Segmented<T extends string>({
  options,
  value,
  onChange,
  className,
  getOptionAriaLabel,
  ...rest
}: SegmentedProps<T>) {
  return (
    <div
      data-slot="segmented"
      role="tablist"
      className={cn(
        "inline-flex items-stretch gap-0.5 rounded-full bg-[#F0EBE0] p-1 text-[13px] font-semibold",
        className,
      )}
      {...rest}
    >
      {options.map((opt) => {
        const isActive = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            role="tab"
            aria-selected={isActive}
            aria-label={getOptionAriaLabel?.(opt)}
            onClick={() => onChange(opt.value)}
            data-active={isActive ? "" : undefined}
            className={cn(
              "inline-flex h-9 flex-1 items-center justify-center rounded-full px-3 transition-colors",
              isActive
                ? "bg-surface text-text-primary shadow-1"
                : "bg-transparent text-text-secondary hover:text-text-primary",
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

export { Segmented };
export type { SegmentedOption, SegmentedProps };
