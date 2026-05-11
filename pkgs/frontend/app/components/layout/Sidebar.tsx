import type * as React from "react";

import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Icon } from "~/components/ui/icon";
import { Typography } from "~/components/ui/typography";
import { cn } from "~/lib/utils";
import { AccountMenu } from "./AccountMenu";
import { type BottomNavItem, DEFAULT_BOTTOM_NAV_ITEMS } from "./BottomNav";

interface SidebarProps extends React.ComponentProps<"aside"> {
  workspaceName: string;
  workspaceImageUrl?: string;
  onWorkspacePress?: () => void;
  active: string;
  onNavigate: (key: string) => void;
  items?: ReadonlyArray<BottomNavItem>;
}

// Toban desktop Sidebar — 260 px column with account header (or Login
// button when signed-out), workspace switcher, and primary nav.
// Mirrors `docs/design/handoff/project/desktop.jsx:56-125`.
function Sidebar({
  workspaceName,
  workspaceImageUrl,
  onWorkspacePress,
  active,
  onNavigate,
  items = DEFAULT_BOTTOM_NAV_ITEMS,
  className,
  ...rest
}: SidebarProps) {
  return (
    <aside
      data-slot="sidebar"
      className={cn(
        "hidden h-screen w-[260px] shrink-0 flex-col border-r bg-bg md:flex",
        className,
      )}
      {...rest}
    >
      <div className="border-b p-3">
        <AccountMenu variant="inline" className="w-full px-3 py-2.5" />
      </div>

      <button
        type="button"
        onClick={onWorkspacePress}
        className="mx-3 mt-3.5 mb-1.5 flex items-center gap-2.5 rounded-sm border bg-surface px-3 py-2.5 text-left transition-colors hover:bg-bg"
      >
        <Avatar size="sm" className="rounded-md">
          {workspaceImageUrl && (
            <AvatarImage src={workspaceImageUrl} alt={workspaceName} />
          )}
          <AvatarFallback seed={workspaceName} className="rounded-md" />
        </Avatar>
        <div className="min-w-0 flex-1">
          <Typography
            as="div"
            variant="micro"
            tone="secondary"
            weight="semibold"
            className="tracking-wide"
          >
            WORKSPACE
          </Typography>
          <Typography as="div" variant="bodySm" weight="bold" truncate>
            {workspaceName}
          </Typography>
        </div>
        <Icon name="chevron-down" size={14} className="text-text-secondary" />
      </button>

      <nav className="flex flex-col gap-0.5 px-2 py-3">
        {items.map((it) => {
          const isActive = it.key === active;
          return (
            <button
              key={it.key}
              type="button"
              onClick={() => onNavigate(it.key)}
              data-active={isActive ? "" : undefined}
              className={cn(
                "flex items-center gap-3 rounded-sm px-3 py-2.5 text-left text-sm transition-colors",
                isActive
                  ? "bg-primary-soft font-bold text-[#7A5A2E]"
                  : "font-medium text-text-primary hover:bg-bg",
              )}
            >
              <Icon
                name={it.icon}
                size={18}
                className={isActive ? "text-primary" : "text-text-secondary"}
              />
              <span>{it.label}</span>
            </button>
          );
        })}
      </nav>
    </aside>
  );
}

export { Sidebar };
export type { SidebarProps };
