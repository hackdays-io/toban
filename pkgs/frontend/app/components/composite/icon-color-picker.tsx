import { useId } from "react";
import type * as React from "react";

import { cn } from "~/lib/utils";

interface IconColorPickerProps extends React.ComponentProps<"div"> {
  /** Currently selected emoji/icon character. */
  icon: string;
  /** Currently selected hex colour, e.g. `#65C98A`. */
  color: string;
  /** Available icon choices (emoji / single-character). */
  iconChoices: ReadonlyArray<string>;
  /** Available colour choices (CSS-acceptable hex strings). */
  colorChoices: ReadonlyArray<string>;
  onIconChange: (next: string) => void;
  onColorChange: (next: string) => void;
  /** Helper copy rendered next to the preview swatch. */
  helper?: React.ReactNode;
}

// Toban IconColorPicker — preview swatch + icon grid + colour swatch row used
// for naming a workspace / role visually. Mirrors
// `docs/design/handoff/project/edit-screens.jsx:351-381`.
//
// Uses real `<input type="radio">` elements (visually hidden) so that screen
// readers and keyboard nav (arrow keys, group focus) work without us having
// to re-implement Radix's RadioGroup for emoji/colour swatches.
function IconColorPicker({
  icon,
  color,
  iconChoices,
  colorChoices,
  onIconChange,
  onColorChange,
  helper,
  className,
  ...rest
}: IconColorPickerProps) {
  const iconGroup = useId();
  const colorGroup = useId();

  return (
    <div
      data-slot="icon-color-picker"
      className={cn(
        "flex flex-col gap-3 rounded-md border border-border bg-surface p-4 shadow-1",
        className,
      )}
      {...rest}
    >
      <div className="flex items-center gap-3.5">
        <div
          aria-hidden
          className="flex size-16 shrink-0 items-center justify-center rounded-md text-3xl text-white"
          style={{ backgroundColor: color }}
        >
          {icon}
        </div>
        {helper && (
          <div className="flex-1 text-xs leading-relaxed text-text-secondary">
            {helper}
          </div>
        )}
      </div>

      <fieldset className="flex flex-wrap gap-2 border-0 p-0">
        <legend className="sr-only">アイコン</legend>
        {iconChoices.map((ic) => {
          const isActive = icon === ic;
          return (
            <label
              key={ic}
              className={cn(
                "flex size-9 cursor-pointer items-center justify-center rounded-sm border-[1.5px] text-lg leading-none transition-colors focus-within:ring-2 focus-within:ring-ring/40",
                isActive
                  ? "border-primary bg-primary-soft"
                  : "border-border bg-bg hover:bg-primary-soft/50",
              )}
            >
              <input
                type="radio"
                name={iconGroup}
                value={ic}
                checked={isActive}
                onChange={() => onIconChange(ic)}
                className="sr-only"
                aria-label={`アイコン ${ic}`}
              />
              <span aria-hidden>{ic}</span>
            </label>
          );
        })}
      </fieldset>

      <fieldset className="flex flex-wrap gap-2 border-0 p-0">
        <legend className="sr-only">カラー</legend>
        {colorChoices.map((c) => {
          const isActive = color === c;
          return (
            <label
              key={c}
              className={cn(
                "block size-7 cursor-pointer rounded-full border-[3px] transition-shadow focus-within:ring-2 focus-within:ring-ring/40",
                isActive ? "border-white" : "border-transparent",
              )}
              style={{
                backgroundColor: c,
                boxShadow: isActive ? `0 0 0 2px ${c}` : undefined,
              }}
            >
              <input
                type="radio"
                name={colorGroup}
                value={c}
                checked={isActive}
                onChange={() => onColorChange(c)}
                className="sr-only"
                aria-label={`カラー ${c}`}
              />
            </label>
          );
        })}
      </fieldset>
    </div>
  );
}

export { IconColorPicker };
export type { IconColorPickerProps };
