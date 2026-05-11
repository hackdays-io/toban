import type * as React from "react";

import { cn } from "~/lib/utils";
import { AppHeader, type AppHeaderProps } from "./AppHeader";
import { BottomNav, type BottomNavProps } from "./BottomNav";
import { Sidebar } from "./Sidebar";

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
  /** Trailing slot for the AppHeader (e.g. the legacy account dropdown). */
  appHeaderRight?: AppHeaderProps["right"];
  /** Optional override of the BottomNav items list. */
  navItems?: BottomNavProps["items"];
}

// Responsive shell — switches between mobile (AppHeader + BottomNav) and
// desktop (Sidebar only) at the `md:` breakpoint. The desktop sidebar
// is built with `hidden md:flex`, so we render both sets and let CSS pick;
// no JS media-query is needed and SSR stays consistent.
function AppShell({
  workspace,
  active,
  onNavigate,
  onWorkspacePress,
  appHeaderRight,
  navItems,
  className,
  children,
  ...rest
}: AppShellProps) {
  return (
    <div
      data-slot="app-shell"
      className={cn(
        "flex h-dvh flex-col overflow-hidden md:flex-row",
        className,
      )}
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
      />

      {/* Mobile: header at top, bottom nav at bottom. */}
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <div className="md:hidden">
          <AppHeader
            workspaceName={workspace.name}
            workspaceImageUrl={workspace.imageUrl}
            onWorkspacePress={onWorkspacePress}
            right={appHeaderRight}
          />
        </div>

        <main className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto">
          {children}
        </main>

        <div className="md:hidden">
          <BottomNav active={active} onChange={onNavigate} items={navItems} />
        </div>
      </div>
    </div>
  );
}

export { AppShell };
export type { AppShellProps };
