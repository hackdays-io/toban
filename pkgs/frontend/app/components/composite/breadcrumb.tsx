import type * as React from "react";
import { Link } from "react-router";

import { Icon } from "~/components/ui/icon";
import { Typography } from "~/components/ui/typography";
import { cn } from "~/lib/utils";

interface BreadcrumbItem {
  label: React.ReactNode;
  /** Optional href. The last item is always rendered as a disabled link so the
   *  layout/baseline stays identical to the linked items above it. */
  to?: string;
}

interface BreadcrumbProps
  extends Omit<React.ComponentProps<"nav">, "children"> {
  items: BreadcrumbItem[];
}

// Toban Breadcrumb — left-aligned chain of links + chevron separators that
// doubles as the back-navigation control for nested duty/holder pages.
// Every crumb is wrapped in a `<Link>` so the rendered element (and therefore
// the text baseline) is consistent across the row. The current page is marked
// disabled via `aria-disabled` + `pointer-events-none` so it isn't clickable.
function Breadcrumb({ items, className, ...rest }: BreadcrumbProps) {
  return (
    <nav
      aria-label="breadcrumb"
      data-slot="breadcrumb"
      className={cn("w-full", className)}
      {...rest}
    >
      <ol className="flex flex-wrap items-center gap-1">
        {items.map((item, i) => {
          const isLast = i === items.length - 1;
          const disabled = isLast || !item.to;
          return (
            <li
              key={`${i}-${typeof item.label === "string" ? item.label : i}`}
              className="flex min-w-0 items-center gap-1"
            >
              <Link
                to={item.to ?? "."}
                aria-disabled={disabled ? "true" : undefined}
                tabIndex={disabled ? -1 : undefined}
                onClick={disabled ? (e) => e.preventDefault() : undefined}
                className={cn(
                  "min-w-0 focus-visible:rounded-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40",
                  disabled && "pointer-events-none cursor-default",
                )}
              >
                <Typography
                  as="span"
                  variant="caption"
                  tone={isLast ? "primary" : "secondary"}
                  truncate
                  aria-current={isLast ? "page" : undefined}
                  className={cn(
                    !disabled && "transition-colors hover:text-text-primary",
                  )}
                >
                  {item.label}
                </Typography>
              </Link>
              {!isLast && (
                <Icon
                  name="chevron-right"
                  size={12}
                  className="shrink-0 text-text-secondary"
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

export { Breadcrumb };
export type { BreadcrumbItem, BreadcrumbProps };
