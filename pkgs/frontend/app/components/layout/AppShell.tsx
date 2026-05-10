import type * as React from "react";

import { cn } from "~/lib/utils";
import { AppHeader, type AppHeaderProps } from "./AppHeader";
import { BottomNav, type BottomNavProps } from "./BottomNav";
import { Sidebar, type SidebarProps } from "./Sidebar";
import { TopBar, type TopBarProps } from "./TopBar";

interface AppShellProps extends React.ComponentProps<"div"> {
  /** Workspace metadata shared between AppHeader (mobile) and Sidebar (desktop). */
  workspace: {
    name: string;
    imageUrl?: string;
  };
  /** Active nav key — e.g. "home" / "duties" / "splits" / "members" / "wallet". */
  active: string;
  /** Called from BottomNav (mobile) and Sidebar (desktop). */
  onNavigate: (key: string) => void;
  /** Called when the user opens the workspace switcher (Sheet/Popover). */
  onWorkspacePress?: () => void;
  /** TopBar / AppHeader shared inputs. */
  hasNotifications?: boolean;
  onNotificationsPress?: () => void;
  /** Sidebar user footer. */
  user?: SidebarProps["user"];
  /** Per-page TopBar inputs. Title is required to render the desktop TopBar. */
  topBar?: Omit<TopBarProps, "onNotificationsPress" | "hasNotifications">;
  /** Trailing slot for the AppHeader (e.g. the legacy account dropdown). */
  appHeaderRight?: AppHeaderProps["right"];
  /** Optional override of the BottomNav items list. */
  navItems?: BottomNavProps["items"];
  /** When true, the desktop main column drops the TopBar (master-detail pages). */
  hideTopBar?: boolean;
}

// Responsive shell — switches between mobile (AppHeader + BottomNav) and
// desktop (Sidebar + TopBar) at the `md:` breakpoint. The desktop sidebar
// is built with `hidden md:flex`, so we render both sets and let CSS pick;
// no JS media-query is needed and SSR stays consistent.
function AppShell({
  workspace,
  active,
  onNavigate,
  onWorkspacePress,
  hasNotifications,
  onNotificationsPress,
  user,
  topBar,
  appHeaderRight,
  navItems,
  hideTopBar,
  className,
  children,
  ...rest
}: AppShellProps) {
  return (
    <div
      data-slot="app-shell"
      className={cn("flex min-h-dvh flex-col md:flex-row", className)}
      {...rest}
    >
      {/* Desktop: persistent sidebar (hidden under md). */}
      <Sidebar
        workspaceName={workspace.name}
        workspaceImageUrl={workspace.imageUrl}
        onWorkspacePress={onWorkspacePress}
        active={active}
        onNavigate={onNavigate}
        items={navItems}
        user={user}
      />

      {/* Mobile: header at top, bottom nav at bottom. */}
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="md:hidden">
          <AppHeader
            workspaceName={workspace.name}
            workspaceImageUrl={workspace.imageUrl}
            onWorkspacePress={onWorkspacePress}
            hasNotifications={hasNotifications}
            onNotificationsPress={onNotificationsPress}
            right={appHeaderRight}
          />
        </div>

        {!hideTopBar && topBar && (
          <div className="hidden md:block">
            <TopBar
              {...topBar}
              hasNotifications={hasNotifications}
              onNotificationsPress={onNotificationsPress}
            />
          </div>
        )}

        <main className="flex-1 overflow-x-hidden">{children}</main>

        <div className="md:hidden">
          <BottomNav active={active} onChange={onNavigate} items={navItems} />
        </div>
      </div>
    </div>
  );
}

export { AppShell };
export type { AppShellProps };
