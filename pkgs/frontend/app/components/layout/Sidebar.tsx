import type * as React from "react";

import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Button } from "~/components/ui/button";
import { Icon } from "~/components/ui/icon";
import { Typography } from "~/components/ui/typography";
import { cn } from "~/lib/utils";
import { type BottomNavItem, DEFAULT_BOTTOM_NAV_ITEMS } from "./BottomNav";

interface SidebarUser {
  name: string;
  /** Wallet address or short identifier shown under the name. */
  subtitle?: string;
  imageUrl?: string;
}

interface SidebarProps extends React.ComponentProps<"aside"> {
  workspaceName: string;
  workspaceImageUrl?: string;
  onWorkspacePress?: () => void;
  active: string;
  onNavigate: (key: string) => void;
  items?: ReadonlyArray<BottomNavItem>;
  user?: SidebarUser;
  onSettingsPress?: () => void;
}

// Toban desktop Sidebar — 260 px column with brand mark, workspace
// switcher, primary nav, and a user footer.
// Mirrors `docs/design/handoff/project/desktop.jsx:56-125`.
function Sidebar({
  workspaceName,
  workspaceImageUrl,
  onWorkspacePress,
  active,
  onNavigate,
  items = DEFAULT_BOTTOM_NAV_ITEMS,
  user,
  onSettingsPress,
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
      <div className="flex items-center gap-2.5 border-b px-4 pt-5 pb-3.5">
        <span className="inline-flex size-8 items-center justify-center rounded-md bg-text-primary text-base font-extrabold text-[#FFD668]">
          と
        </span>
        <div>
          <Typography
            as="div"
            variant="body"
            weight="bold"
            className="leading-tight"
          >
            Toban
          </Typography>
          <Typography as="div" variant="micro" tone="secondary">
            あたたかい当番帳
          </Typography>
        </div>
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

      {user && (
        <div className="mt-auto border-t p-3">
          <div className="flex items-center gap-2.5">
            <Avatar>
              {user.imageUrl && (
                <AvatarImage src={user.imageUrl} alt={user.name} />
              )}
              <AvatarFallback seed={user.name} />
            </Avatar>
            <div className="min-w-0 flex-1">
              <Typography as="div" variant="bodySm" weight="bold" truncate>
                {user.name}
              </Typography>
              {user.subtitle && (
                <Typography as="div" variant="mono" tone="secondary" truncate>
                  {user.subtitle}
                </Typography>
              )}
            </div>
            <Button
              size="icon-sm"
              variant="ghost"
              aria-label="設定"
              onClick={onSettingsPress}
            >
              <Icon name="gear" size={16} />
            </Button>
          </div>
        </div>
      )}
    </aside>
  );
}

export { Sidebar };
export type { SidebarProps, SidebarUser };
