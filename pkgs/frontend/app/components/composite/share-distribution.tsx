import type * as React from "react";

import { Typography } from "~/components/ui/typography";
import { cn } from "~/lib/utils";

// Deterministic palette for share segments. Mirrors
// `docs/design/handoff/project/quests.jsx:67`.
const SHARE_PALETTE = [
  "#D6B995",
  "#65C98A",
  "#5DADEC",
  "#F5B82E",
  "#B696E0",
  "#E48F4F",
  "#E48ABF",
] as const;

interface ShareItem {
  /** Stable key per row. Usually the holder's address. */
  key: string;
  /** Display label — name + abbreviated address etc. */
  label: React.ReactNode;
  /** Optional avatar slot rendered between the colour dot and the label. */
  leading?: React.ReactNode;
  /** Percentage of the whole (0–100). */
  percent: number;
  /** Override the palette colour for this row + bar segment. */
  color?: string;
}

interface ShareDistributionProps extends React.ComponentProps<"div"> {
  items: ShareItem[];
  /** Hide the bar height when there's only one item — design's choice. */
  barHeight?: number;
  /** Message shown when there are no items to distribute. */
  emptyLabel?: React.ReactNode;
}

// Toban ShareDistribution — stacked horizontal bar + legend rows showing each
// participant's share percentage. Mirrors
// `docs/design/handoff/project/quests.jsx:65-88` and the desktop variant at
// `docs/design/handoff/project/desktop.jsx:485-500`.
function ShareDistribution({
  items,
  barHeight = 12,
  emptyLabel = "シェアを持つメンバーがいません",
  className,
  ...rest
}: ShareDistributionProps) {
  if (items.length === 0) {
    return (
      <div
        data-slot="share-distribution"
        className={cn("py-4 text-center", className)}
        {...rest}
      >
        <Typography variant="bodySm" tone="secondary">
          {emptyLabel}
        </Typography>
      </div>
    );
  }

  return (
    <div
      data-slot="share-distribution"
      className={cn("flex flex-col gap-3", className)}
      {...rest}
    >
      <div
        className="flex overflow-hidden rounded-xs bg-[#F0EBE0]"
        style={{ height: barHeight }}
      >
        {items.map((s, i) => (
          <div
            key={s.key}
            title={
              typeof s.label === "string"
                ? `${s.label}: ${s.percent}%`
                : undefined
            }
            style={{
              width: `${Math.max(0, Math.min(100, s.percent))}%`,
              backgroundColor:
                s.color ?? SHARE_PALETTE[i % SHARE_PALETTE.length],
            }}
          />
        ))}
      </div>

      <ul className="flex flex-col gap-2">
        {items.map((s, i) => {
          const color = s.color ?? SHARE_PALETTE[i % SHARE_PALETTE.length];
          return (
            <li key={s.key} className="flex items-center gap-2.5">
              <span
                aria-hidden
                className="size-2 shrink-0 rounded-full"
                style={{ backgroundColor: color }}
              />
              {s.leading}
              <Typography
                as="div"
                variant="bodySm"
                weight="semibold"
                truncate
                className="min-w-0 flex-1"
              >
                {s.label}
              </Typography>
              <Typography
                as="span"
                variant="bodySm"
                weight="bold"
                className="tabular-nums"
              >
                {Math.round(s.percent)}
                <Typography
                  as="span"
                  variant="micro"
                  tone="secondary"
                  className="ml-0.5"
                >
                  %
                </Typography>
              </Typography>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export { ShareDistribution, SHARE_PALETTE };
export type { ShareDistributionProps, ShareItem };
