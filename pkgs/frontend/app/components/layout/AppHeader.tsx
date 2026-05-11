import type * as React from "react";

import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Icon } from "~/components/ui/icon";
import { Typography } from "~/components/ui/typography";
import { cn } from "~/lib/utils";

interface AppHeaderProps extends React.ComponentProps<"header"> {
  /** Workspace name shown inside the switcher pill. */
  workspaceName: string;
  /** Optional avatar source for the workspace icon. */
  workspaceImageUrl?: string;
  /** Called when the user taps the workspace pill (open the switcher Sheet). */
  onWorkspacePress?: () => void;
  /** Optional trailing slot (extra icon buttons / user avatar dropdown). */
  right?: React.ReactNode;
}

// Toban mobile AppHeader — workspace switcher pill plus a trailing slot.
// Mirrors `docs/design/handoff/project/screens.jsx:91-117`.
function AppHeader({
  workspaceName,
  workspaceImageUrl,
  onWorkspacePress,
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
        <Typography
          as="span"
          variant="bodySm"
          weight="bold"
          truncate
          className="flex-1"
        >
          {workspaceName}
        </Typography>
        <Icon name="chevron-down" size={16} className="text-text-secondary" />
      </button>
      {right}
    </header>
  );
}

export { AppHeader };
export type { AppHeaderProps };
