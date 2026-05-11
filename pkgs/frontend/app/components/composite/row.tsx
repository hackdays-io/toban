import type * as React from "react";

import { Typography } from "~/components/ui/typography";
import { cn } from "~/lib/utils";

interface RowProps extends Omit<React.ComponentProps<"div">, "title"> {
  /** Optional leading slot — usually an `Avatar` or `Icon`. */
  left?: React.ReactNode;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  /** Trailing slot — chevron, action button, badge, etc. */
  right?: React.ReactNode;
  /** Render as a clickable button when `onClick` is supplied. */
  onClick?: React.MouseEventHandler<HTMLDivElement>;
}

// Toban Row — horizontal list row with optional left/right slots.
// Mirrors `docs/design/handoff/project/primitives.jsx:191-204`.
function Row({
  left,
  title,
  subtitle,
  right,
  onClick,
  className,
  ...rest
}: RowProps) {
  return (
    <div
      data-slot="row"
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onClick(
                  e as unknown as React.MouseEvent<HTMLDivElement, MouseEvent>,
                );
              }
            }
          : undefined
      }
      className={cn(
        "flex w-full items-center gap-3 px-4 py-3",
        onClick && "cursor-pointer transition-colors hover:bg-bg",
        className,
      )}
      {...rest}
    >
      {left}
      <div className="min-w-0 flex-1">
        <Typography
          as="div"
          variant="body"
          weight="semibold"
          className="leading-tight"
        >
          {title}
        </Typography>
        {subtitle && (
          <Typography
            as="div"
            variant="caption"
            tone="secondary"
            truncate
            className="mt-0.5"
          >
            {subtitle}
          </Typography>
        )}
      </div>
      {right}
    </div>
  );
}

export { Row };
export type { RowProps };
