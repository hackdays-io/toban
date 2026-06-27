import { useId } from "react";
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
// Radio + label tabs; globals.css ::after on labels keeps pointer over glyphs.
// The outer wrapper sets body cursor while hovered (Brave).
function Segmented<T extends string>({
  options,
  value,
  onChange,
  className,
  getOptionAriaLabel,
  style,
  ...rest
}: SegmentedProps<T>) {
  const groupId = useId();

  return (
    <div
      className={cn("relative z-[2]", className)}
      onPointerEnter={() => {
        document.body.style.cursor = "pointer";
      }}
      onPointerLeave={() => {
        document.body.style.cursor = "";
      }}
    >
      <div
        data-slot="segmented"
        role="radiogroup"
        className="grid rounded-full bg-[#F0EBE0] p-1 text-[13px] font-semibold"
        style={{
          gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))`,
          ...style,
        }}
        {...rest}
      >
        {options.map((opt) => {
          const isActive = opt.value === value;
          return (
            <label
              key={opt.value}
              data-active={isActive ? "" : undefined}
              className={cn(
                "flex h-9 w-full min-w-0 cursor-pointer select-none items-center justify-center whitespace-nowrap rounded-full px-3 transition-colors",
                isActive
                  ? "bg-surface text-text-primary shadow-1"
                  : "bg-transparent text-text-secondary hover:text-text-primary",
              )}
            >
              <input
                type="radio"
                name={groupId}
                value={opt.value}
                checked={isActive}
                onChange={() => onChange(opt.value)}
                className="sr-only"
                aria-label={getOptionAriaLabel?.(opt)}
              />
              <span>{opt.label}</span>
            </label>
          );
        })}
      </div>
    </div>
  );
}

export { Segmented };
export type { SegmentedOption, SegmentedProps };
