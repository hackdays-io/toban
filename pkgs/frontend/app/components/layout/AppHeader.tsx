import type * as React from "react";

import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Button } from "~/components/ui/button";
import { Icon } from "~/components/ui/icon";
import { cn } from "~/lib/utils";

interface AppHeaderProps extends React.ComponentProps<"header"> {
  /** Workspace name shown inside the switcher pill. */
  workspaceName: string;
  /** Optional avatar source for the workspace icon. */
  workspaceImageUrl?: string;
  /** Called when the user taps the workspace pill (open the switcher Sheet). */
  onWorkspacePress?: () => void;
  /** Show a small dot on the bell icon. */
  hasNotifications?: boolean;
  /** Called when the user taps the bell. */
  onNotificationsPress?: () => void;
  /** Optional trailing slot (extra icon buttons / user avatar dropdown). */
  right?: React.ReactNode;
}

// Toban mobile AppHeader — workspace switcher pill + notification bell.
// Mirrors `docs/design/handoff/project/screens.jsx:91-117`.
function AppHeader({
  workspaceName,
  workspaceImageUrl,
  onWorkspacePress,
  hasNotifications,
  onNotificationsPress,
  right,
  className,
  ...rest
}: AppHeaderProps) {
  return (
    <header
      data-slot="app-header"
      className={cn("flex items-center gap-2.5 px-4 pt-3.5 pb-2", className)}
      {...rest}
    >
      <button
        type="button"
        onClick={onWorkspacePress}
        className="flex min-w-0 flex-1 items-center gap-2 rounded-full border border-border bg-surface py-1.5 pr-2.5 pl-1.5 text-left transition-colors hover:bg-bg"
      >
        <Avatar size="sm" data-size="sm">
          {workspaceImageUrl && (
            <AvatarImage src={workspaceImageUrl} alt={workspaceName} />
          )}
          <AvatarFallback seed={workspaceName} />
        </Avatar>
        <span className="flex-1 truncate text-sm font-bold text-text-primary">
          {workspaceName}
        </span>
        <Icon name="chevron-down" size={16} className="text-text-secondary" />
      </button>
      <Button
        size="icon"
        variant="secondary"
        aria-label="通知"
        onClick={onNotificationsPress}
        className="relative size-10"
      >
        <Icon name="bell" size={20} />
        {hasNotifications && (
          <span className="absolute top-1.5 right-1.5 size-2 rounded-full border-2 border-surface bg-danger" />
        )}
      </Button>
      {right}
    </header>
  );
}

export { AppHeader };
export type { AppHeaderProps };
