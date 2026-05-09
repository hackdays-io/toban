import type * as React from "react";

import { cn } from "~/lib/utils";

interface EmptyStateProps extends Omit<React.ComponentProps<"div">, "title"> {
  /** Decorative icon shown inside a soft circular plate. */
  icon?: React.ReactNode;
  title: React.ReactNode;
  body?: React.ReactNode;
  /** Optional CTA — typically a `<Button>` rendered below the body. */
  action?: React.ReactNode;
}

// Toban EmptyState — centred icon + title + body + action panel for empty
// list / error placeholders. Mirrors
// `docs/design/handoff/project/primitives.jsx:318-329`.
function EmptyState({
  icon,
  title,
  body,
  action,
  className,
  ...rest
}: EmptyStateProps) {
  return (
    <div
      data-slot="empty-state"
      className={cn("px-6 py-12 text-center", className)}
      {...rest}
    >
      {icon && (
        <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-primary-soft text-[#A07310] [&_svg]:size-[26px]">
          {icon}
        </div>
      )}
      <div className="text-[15px] font-bold text-text-primary">{title}</div>
      {body && (
        <div className="mt-1.5 text-[13px] leading-relaxed text-text-secondary">
          {body}
        </div>
      )}
      {action && <div className="mt-5 flex justify-center">{action}</div>}
    </div>
  );
}

export { EmptyState };
export type { EmptyStateProps };
