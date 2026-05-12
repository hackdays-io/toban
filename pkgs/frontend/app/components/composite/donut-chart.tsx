import type * as React from "react";

import { cn } from "~/lib/utils";

// Donut palette — split-blue family from the design source.
// Mirrors `docs/design/handoff/project/screens.jsx:487`.
const DONUT_PALETTE = [
  "#5DADEC",
  "#F5B82E",
  "#65C98A",
  "#D6B995",
  "#E48F4F",
  "#B696E0",
  "#E48ABF",
  "#7AC2D9",
  "#F2A6A0",
] as const;

interface DonutSlice {
  /** Stable key per slice — usually the recipient address or name. */
  key: string;
  /** Percentage of the whole (0–100). */
  percent: number;
  /** Override palette colour for this slice. */
  color?: string;
}

interface DonutChartProps extends React.ComponentProps<"div"> {
  slices: DonutSlice[];
  /** Pixel size of the SVG container. */
  size?: number;
  /** Optional center content; when omitted shows "{n}人". Pass `null` to hide. */
  center?: React.ReactNode;
  /** Track (background) colour shown when no slice fills the segment. */
  trackColor?: string;
  /** Stroke width relative to size — defaults to `size / 7.2`. */
  thickness?: number;
}

// Toban DonutChart — segmented ring for share distributions. Mirrors
// `docs/design/handoff/project/screens.jsx:493-516`. Designed for the splits
// list cards (size=72) and split-detail cards (size=130/140).
function DonutChart({
  slices,
  size = 80,
  center,
  trackColor = "#F0EBE0",
  thickness,
  className,
  ...rest
}: DonutChartProps) {
  const strokeWidth = thickness ?? Math.max(6, Math.round(size / 7.2));
  const r = size / 2 - strokeWidth / 2 - 2;
  const cx = size / 2;
  const cy = size / 2;
  const circ = 2 * Math.PI * r;

  const sum = slices.reduce((acc, s) => acc + Math.max(0, s.percent), 0);
  const remainder = Math.max(0, 100 - sum);
  const all =
    remainder > 0.5
      ? [...slices, { key: "__other", percent: remainder, color: trackColor }]
      : slices;

  let offset = 0;
  return (
    <div
      data-slot="donut-chart"
      className={cn("relative shrink-0", className)}
      style={{ width: size, height: size }}
      {...rest}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        style={{ transform: "rotate(-90deg)" }}
        aria-hidden
      >
        <title>分配の比率</title>
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke={trackColor}
          strokeWidth={strokeWidth}
        />
        {all.map((s, i) => {
          const pct = Math.max(0, Math.min(100, s.percent));
          const len = (pct / 100) * circ;
          const color = s.color ?? DONUT_PALETTE[i % DONUT_PALETTE.length];
          const segment = (
            <circle
              key={s.key}
              cx={cx}
              cy={cy}
              r={r}
              fill="none"
              stroke={color}
              strokeWidth={strokeWidth}
              strokeDasharray={`${len} ${circ - len}`}
              strokeDashoffset={-offset}
            />
          );
          offset += len;
          return segment;
        })}
      </svg>
      {center !== null && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          {center ?? (
            <span
              className="font-bold text-text-secondary"
              style={{ fontSize: Math.max(10, Math.round(size * 0.16)) }}
            >
              {slices.length}人
            </span>
          )}
        </div>
      )}
    </div>
  );
}

export { DonutChart, DONUT_PALETTE };
export type { DonutChartProps, DonutSlice };
