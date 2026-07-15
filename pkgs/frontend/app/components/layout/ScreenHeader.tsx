import type * as React from "react";

import { Button } from "~/components/ui/button";
import { Heading } from "~/components/ui/heading";
import { Icon } from "~/components/ui/icon";
import { Typography } from "~/components/ui/typography";
import { cn } from "~/lib/utils";

interface ScreenHeaderProps
  extends Omit<React.ComponentProps<"header">, "title"> {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  /** Render a back chevron and call this when pressed. */
  onBack?: () => void;
  /** Trailing slot — usually icon buttons or a dropdown trigger. */
  right?: React.ReactNode;
}

// Toban mobile ScreenHeader — sub-page header with back button, title,
// optional subtitle, and a trailing slot. Mirrors
// `docs/design/handoff/project/primitives.jsx:212-231`.
function ScreenHeader({
  title,
  subtitle,
  onBack,
  right,
  className,
  ...rest
}: ScreenHeaderProps) {
  return (
    <header
      data-slot="screen-header"
      className={cn("flex items-center gap-2 bg-bg px-4 pt-2 pb-3", className)}
      {...rest}
    >
      {onBack && (
        <Button
          size="icon"
          variant="ghost"
          aria-label="戻る"
          onClick={onBack}
          className="-ml-2 size-9"
        >
          <Icon name="chevron-left" size={22} className="text-text-primary" />
        </Button>
      )}
      <div className="min-w-0 flex-1">
        <Heading variant="h4" className="truncate">
          {title}
        </Heading>
        {subtitle && (
          <Typography variant="caption" tone="secondary" truncate>
            {subtitle}
          </Typography>
        )}
      </div>
      {right}
    </header>
  );
}

export { ScreenHeader };
export type { ScreenHeaderProps };
