import type * as React from "react";

import { Icon, type IconName } from "~/components/ui/icon";
import { cn } from "~/lib/utils";

interface BottomNavItem {
  key: string;
  label: string;
  icon: IconName;
}

// Mobile bottom nav — caps at 5 tabs to fit a phone width. アクティビティ is
// surfaced as a bell-icon button in the AppHeader instead so the new クエスト
// tab can land here without overflow.
const MOBILE_NAV_ITEMS: ReadonlyArray<BottomNavItem> = [
  { key: "home", label: "ホーム", icon: "home" },
  { key: "duties", label: "当番", icon: "duty" },
  { key: "quests", label: "クエスト", icon: "quest" },
  { key: "splits", label: "分配", icon: "split" },
  { key: "members", label: "メンバー", icon: "members" },
];

// Desktop sidebar nav — has room for the activity item, so we keep it in the
// primary nav rather than mirroring the mobile bell-icon shortcut.
const DESKTOP_NAV_ITEMS: ReadonlyArray<BottomNavItem> = [
  ...MOBILE_NAV_ITEMS,
  { key: "activity", label: "アクティビティ", icon: "bell" },
];

interface BottomNavProps extends Omit<React.ComponentProps<"nav">, "onChange"> {
  active: string;
  onChange: (key: string) => void;
  items?: ReadonlyArray<BottomNavItem>;
}

// Toban mobile BottomNav — 5-tab bar with a primary-soft pill behind the
// active item. Mirrors `docs/design/handoff/project/primitives.jsx:234-273`.
function BottomNav({
  active,
  onChange,
  items = MOBILE_NAV_ITEMS,
  className,
  ...rest
}: BottomNavProps) {
  return (
    <nav
      data-slot="bottom-nav"
      className={cn(
        "flex justify-around border-t bg-surface px-2 pt-2 pb-[calc(0.875rem+env(safe-area-inset-bottom))]",
        className,
      )}
      {...rest}
    >
      {items.map((it) => {
        const isActive = it.key === active;
        return (
          <button
            key={it.key}
            type="button"
            onClick={() => onChange(it.key)}
            aria-label={it.label}
            data-active={isActive ? "" : undefined}
            className={cn(
              "flex flex-1 flex-col items-center gap-1 py-1.5",
              isActive ? "text-primary" : "text-text-secondary",
            )}
          >
            <span
              className={cn(
                "flex h-7 w-11 items-center justify-center rounded-full transition-colors",
                isActive ? "bg-primary-soft" : "bg-transparent",
              )}
            >
              <Icon
                name={it.icon}
                size={20}
                className={isActive ? "text-[#A07310]" : "text-text-secondary"}
              />
            </span>
            <span
              className={cn(
                "text-[10px]",
                isActive ? "font-bold" : "font-medium",
              )}
            >
              {it.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}

export {
  BottomNav,
  MOBILE_NAV_ITEMS as DEFAULT_BOTTOM_NAV_ITEMS,
  DESKTOP_NAV_ITEMS,
};
export type { BottomNavProps, BottomNavItem };
