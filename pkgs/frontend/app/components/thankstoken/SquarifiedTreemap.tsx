import { type FC, useLayoutEffect, useMemo, useRef, useState } from "react";

import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Typography } from "~/components/ui/typography";

export interface TreemapDatum {
  name: string;
  value: number;
  /** Optional resolved avatar URL for the tile owner. */
  avatarUrl?: string;
}

interface SquarifiedTreemapProps {
  /** Already-sorted (desc by value) tiles. */
  data: TreemapDatum[];
  /** Tile fill colour. */
  fill: string;
  /** Aspect ratio (width / height); the rendered height comes from this. */
  aspectRatio?: number;
  /** Min container height in pixels. */
  minHeight?: number;
}

interface PlacedRect extends TreemapDatum {
  x: number;
  y: number;
  w: number;
  h: number;
}

function squarify(
  values: TreemapDatum[],
  x: number,
  y: number,
  w: number,
  h: number,
): PlacedRect[] {
  const total = values.reduce((s, v) => s + v.value, 0);
  if (total <= 0 || values.length === 0) return [];
  const items = values.map((v) => ({ ...v, area: (v.value / total) * w * h }));
  const result: PlacedRect[] = [];
  let remaining = items.slice();
  let rect = { x, y, w, h };

  const worst = (row: typeof items, length: number) => {
    const sum = row.reduce((s, r) => s + r.area, 0);
    let max = 0;
    let min = Number.POSITIVE_INFINITY;
    for (const r of row) {
      max = Math.max(max, r.area);
      min = Math.min(min, r.area);
    }
    return Math.max(
      (length * length * max) / (sum * sum),
      (sum * sum) / (length * length * min),
    );
  };

  const layoutRow = (row: typeof items, length: number, into: typeof rect) => {
    const sum = row.reduce((s, r) => s + r.area, 0);
    const isHoriz = into.w >= into.h;
    const sideLen = sum / length;
    let off = 0;
    for (const r of row) {
      const sz = r.area / sideLen;
      if (isHoriz) {
        result.push({
          name: r.name,
          value: r.value,
          avatarUrl: r.avatarUrl,
          x: into.x,
          y: into.y + off,
          w: sideLen,
          h: sz,
        });
        off += sz;
      } else {
        result.push({
          name: r.name,
          value: r.value,
          avatarUrl: r.avatarUrl,
          x: into.x + off,
          y: into.y,
          w: sz,
          h: sideLen,
        });
        off += sz;
      }
    }
    if (isHoriz) {
      return { x: into.x + sideLen, y: into.y, w: into.w - sideLen, h: into.h };
    }
    return { x: into.x, y: into.y + sideLen, w: into.w, h: into.h - sideLen };
  };

  while (remaining.length > 0) {
    const length = Math.min(rect.w, rect.h);
    if (length <= 0) break;
    let row: typeof items = [];
    let bestRatio = Number.POSITIVE_INFINITY;
    while (remaining.length > 0) {
      const next = [...row, remaining[0]];
      const r = worst(next, length);
      if (row.length === 0 || r < bestRatio) {
        row = next;
        bestRatio = r;
        remaining = remaining.slice(1);
      } else break;
    }
    rect = layoutRow(row, length, rect);
  }
  return result;
}

// Custom squarified treemap. Renders each tile as an absolutely positioned
// div over a measured container so it scales with the parent width, and
// embeds a user Avatar in tiles that are large enough to show one. We use
// HTML rather than chart.js + chartjs-chart-treemap (also a dependency)
// because the design calls for an avatar image inside each tile, which
// chart.js's canvas renderer can't draw without a custom plugin.
export const SquarifiedTreemap: FC<SquarifiedTreemapProps> = ({
  data,
  fill,
  aspectRatio = 1.5,
  minHeight = 180,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(360);

  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const update = () => setWidth(el.clientWidth);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const height = Math.max(minHeight, width / aspectRatio);

  const rects = useMemo(
    () => squarify(data, 0, 0, width, height),
    [data, width, height],
  );

  if (data.length === 0) {
    return (
      <div
        ref={containerRef}
        className="flex items-center justify-center rounded-md border border-dashed border-border bg-bg"
        style={{ height }}
      >
        <Typography variant="bodySm" tone="secondary">
          表示できるデータがありません
        </Typography>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="relative w-full overflow-hidden rounded-md"
      style={{ height }}
    >
      {rects.map((r, i) => {
        const minSide = Math.min(r.w, r.h);
        // Hide everything (avatar + name) on very small tiles to avoid
        // cluttering them with cropped artifacts.
        const labelHidden = r.w < 36 || r.h < 26;
        // Avatar slot scales with the tile but stays within a sane band.
        const showAvatar = !labelHidden && minSide >= 56;
        const avatarSize = Math.round(
          Math.max(20, Math.min(48, minSide * 0.34)),
        );
        const fontSize = Math.round(Math.min(Math.max(minSide * 0.16, 9), 13));
        // Fade later tiles slightly so the visual hierarchy reads from large
        // to small. Matches the design source's `opacity` curve.
        const opacity = 0.78 + 0.22 * (1 - i / Math.max(rects.length - 1, 1));
        return (
          <div
            key={`${r.name}-${i}`}
            title={`${r.name}: ${r.value.toLocaleString()} THX`}
            className="absolute flex flex-col items-center justify-center gap-1 overflow-hidden whitespace-nowrap rounded-[4px] font-semibold text-white"
            style={{
              left: r.x + 1,
              top: r.y + 1,
              width: Math.max(r.w - 2, 0),
              height: Math.max(r.h - 2, 0),
              background: fill,
              opacity,
              fontSize,
              padding: 4,
            }}
          >
            {showAvatar && (
              <Avatar
                className="border-2 border-white/70 shadow-sm"
                style={{ width: avatarSize, height: avatarSize }}
              >
                {r.avatarUrl && <AvatarImage src={r.avatarUrl} alt={r.name} />}
                <AvatarFallback seed={r.name} />
              </Avatar>
            )}
            {!labelHidden && (
              <span className="max-w-full overflow-hidden text-ellipsis">
                {r.name}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
};
