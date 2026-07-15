import type { FC } from "react";

import { Typography } from "~/components/ui/typography";

interface WeightLabelsProps {
  leftLabel: string;
  leftValue: number;
  leftColor: string;
  rightLabel: string;
  rightValue: number;
  rightColor: string;
}

// Opposing-ends row above a `PercentSlider`: left side hugs the start of the
// track, right side hugs the end. Each side stacks its percentage above the
// label so the colour-coded value sits visually closer to the slider.
const WeightLabels: FC<WeightLabelsProps> = ({
  leftLabel,
  leftValue,
  leftColor,
  rightLabel,
  rightValue,
  rightColor,
}) => (
  <div className="flex items-end justify-between gap-2 text-[13px]">
    <div className="flex flex-col items-start">
      <Typography
        as="span"
        variant="bodySm"
        weight="bold"
        className="tabular-nums leading-none"
        style={{ color: leftColor }}
      >
        {leftValue}%
      </Typography>
      <Typography
        as="span"
        variant="caption"
        weight="semibold"
        className="mt-0.5"
      >
        {leftLabel}
      </Typography>
    </div>
    <div className="flex flex-col items-end">
      <Typography
        as="span"
        variant="bodySm"
        weight="bold"
        className="tabular-nums leading-none"
        style={{ color: rightColor }}
      >
        {rightValue}%
      </Typography>
      <Typography
        as="span"
        variant="caption"
        weight="semibold"
        className="mt-0.5"
      >
        {rightLabel}
      </Typography>
    </div>
  </div>
);

interface PercentSliderProps {
  value: number;
  onChange: (next: number) => void;
  ariaLabel: string;
  /** Colour of the track left of the thumb (the "left label" side). */
  leftColor: string;
  /** Colour of the track right of the thumb (the "right label" side). */
  rightColor: string;
}

// Native range whose track is painted via a linear-gradient — splitting at the
// current value — so each side carries its label's brand colour. The thumb is
// solid white with a dark border so it stays visible against either side of
// the track. (Native `::-webkit-slider-runnable-track` styling is unreliable
// across browsers; a gradient background sidesteps the inconsistency.)
const PercentSlider: FC<PercentSliderProps> = ({
  value,
  onChange,
  ariaLabel,
  leftColor,
  rightColor,
}) => (
  <input
    type="range"
    min={0}
    max={100}
    step={1}
    value={value}
    onChange={(e) => onChange(Number(e.target.value))}
    aria-label={ariaLabel}
    className="h-2 w-full cursor-pointer appearance-none rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring/40 [&::-moz-range-thumb]:size-5 [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border [&::-moz-range-thumb]:border-text-secondary/40 [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:shadow-2 [&::-webkit-slider-thumb]:size-5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border [&::-webkit-slider-thumb]:border-text-secondary/40 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-2"
    style={{
      background: `linear-gradient(to right, ${leftColor} 0%, ${leftColor} ${value}%, ${rightColor} ${value}%, ${rightColor} 100%)`,
    }}
  />
);

export { PercentSlider, WeightLabels };
export type { PercentSliderProps, WeightLabelsProps };
