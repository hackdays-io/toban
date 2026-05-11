import type * as React from "react";

import { Button } from "~/components/ui/button";
import { Heading } from "~/components/ui/heading";
import { Icon } from "~/components/ui/icon";
import { Typography } from "~/components/ui/typography";
import { cn } from "~/lib/utils";

interface TopBarProps extends Omit<React.ComponentProps<"header">, "title"> {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  /** Optional placeholder for the search pill. Hides search if undefined. */
  searchPlaceholder?: string;
  searchValue?: string;
  onSearchChange?: (next: string) => void;
  onNotificationsPress?: () => void;
  hasNotifications?: boolean;
  /** Trailing slot before the primary CTA. */
  right?: React.ReactNode;
  /** Primary CTA — e.g. "サンクスを送る". Hidden when omitted. */
  primaryAction?: {
    label: React.ReactNode;
    onClick?: () => void;
    icon?: React.ReactNode;
  };
}

// Toban desktop TopBar — page title, search pill, bell and a primary CTA.
// Mirrors `docs/design/handoff/project/desktop.jsx:134-155`.
function TopBar({
  title,
  subtitle,
  searchPlaceholder,
  searchValue,
  onSearchChange,
  onNotificationsPress,
  hasNotifications,
  right,
  primaryAction,
  className,
  ...rest
}: TopBarProps) {
  return (
    <header
      data-slot="top-bar"
      className={cn(
        "flex h-[72px] items-center gap-4 border-b bg-surface px-7",
        className,
      )}
      {...rest}
    >
      <div className="min-w-0 flex-1">
        <Heading variant="h2" className="truncate">
          {title}
        </Heading>
        {subtitle && (
          <Typography
            variant="caption"
            tone="secondary"
            truncate
            className="mt-0.5"
          >
            {subtitle}
          </Typography>
        )}
      </div>
      {searchPlaceholder !== undefined && (
        <div className="flex w-[280px] items-center gap-2 rounded-full bg-bg px-3.5 py-2">
          <Icon name="search" size={16} className="text-text-secondary" />
          <input
            type="search"
            placeholder={searchPlaceholder}
            value={searchValue}
            onChange={(e) => onSearchChange?.(e.target.value)}
            className="w-full border-0 bg-transparent text-[13px] outline-none placeholder:text-text-secondary"
          />
        </div>
      )}
      <Button
        size="icon"
        variant="ghost"
        aria-label="通知"
        onClick={onNotificationsPress}
        className="relative size-10"
      >
        <Icon name="bell" size={18} className="text-text-secondary" />
        {hasNotifications && (
          <span className="absolute top-2 right-2 size-2 rounded-full border-2 border-surface bg-danger" />
        )}
      </Button>
      {right}
      {primaryAction && (
        <Button onClick={primaryAction.onClick}>
          {primaryAction.icon}
          {primaryAction.label}
        </Button>
      )}
    </header>
  );
}

export { TopBar };
export type { TopBarProps };
