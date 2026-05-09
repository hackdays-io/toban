import type * as React from "react";

import { Icon, type IconName } from "~/components/ui/icon";
import { cn } from "~/lib/utils";

interface BottomNavItem {
  key: string;
  label: string;
  icon: IconName;
}

const DEFAULT_ITEMS: ReadonlyArray<BottomNavItem> = [
  { key: "home", label: "ホーム", icon: "home" },
  { key: "duties", label: "当番", icon: "duty" },
  { key: "splits", label: "分配", icon: "split" },
  { key: "members", label: "メンバー", icon: "members" },
  { key: "wallet", label: "ウォレット", icon: "wallet" },
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
  items = DEFAULT_ITEMS,
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

export { BottomNav, DEFAULT_ITEMS as DEFAULT_BOTTOM_NAV_ITEMS };
export type { BottomNavProps, BottomNavItem };
