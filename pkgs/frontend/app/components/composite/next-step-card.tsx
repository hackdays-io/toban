import type * as React from "react";

import { Icon, type IconName } from "~/components/ui/icon";
import { Typography } from "~/components/ui/typography";
import { cn } from "~/lib/utils";

interface NextStepCardProps
  extends Omit<React.ComponentProps<"button">, "title"> {
  /** Leading icon name from the shared `Icon` registry. */
  icon: IconName;
  /** Row label / call-to-action title. */
  label: React.ReactNode;
}

// Toban NextStepCard — list-row used on completion screens to point users at
// the next sensible action (e.g. invite, create duty). Mirrors
// `docs/design/handoff/project/edit-screens.jsx:411-418`.
function NextStepCard({
  icon,
  label,
  className,
  type = "button",
  ...rest
}: NextStepCardProps) {
  return (
    <button
      type={type}
      data-slot="next-step-card"
      className={cn(
        "flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-bg",
        className,
      )}
      {...rest}
    >
      <span
        aria-hidden
        className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary-soft text-[#7A5A2E]"
      >
        <Icon name={icon} size={16} />
      </span>
      <Typography
        as="span"
        variant="bodySm"
        weight="semibold"
        className="flex-1"
      >
        {label}
      </Typography>
      <Icon
        name="chevron-right"
        size={16}
        className="text-text-secondary"
        aria-hidden
      />
    </button>
  );
}

export { NextStepCard };
export type { NextStepCardProps };
