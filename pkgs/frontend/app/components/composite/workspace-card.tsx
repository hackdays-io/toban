import type * as React from "react";

import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Badge } from "~/components/ui/badge";
import { cn } from "~/lib/utils";

interface WorkspaceCardProps
  extends Omit<React.ComponentProps<"button">, "onClick" | "type"> {
  /** Workspace display name. */
  name: string;
  /** Optional one-line description (truncated to a single line). */
  description?: string;
  /** Optional URL of the workspace icon image (already resolved to https). */
  imageUrl?: string;
  /** Optional member count — rendered with the activity meta line when set. */
  members?: number;
  /** Optional last-activity label, e.g. "2 時間前". */
  lastActive?: string;
  /** When true, renders the "現在" member-kind badge in the trailing slot. */
  current?: boolean;
  /** Tap handler — required because each card navigates to a workspace. */
  onSelect?: () => void;
}

// Toban WorkspaceCard — single card row used in the workspace list (and any
// future "switch workspace" surface). Mirrors `screens.jsx:1158-1175` from
// `docs/design/handoff/project/`. Built from a `<button>` styled with the same
// `bg-card` / `shadow-1` / `rounded-md` tokens the `Card` primitive uses, so
// the surface stays consistent without giving up the native button semantics
// (focus ring, keyboard activation, screen-reader role).
function WorkspaceCard({
  name,
  description,
  imageUrl,
  members,
  lastActive,
  current,
  onSelect,
  className,
  ...rest
}: WorkspaceCardProps) {
  const hasMeta = typeof members === "number" || !!lastActive;
  const seed = name || "?";
  return (
    <button
      type="button"
      data-slot="workspace-card"
      data-current={current ? "true" : undefined}
      onClick={onSelect}
      className={cn(
        "flex w-full items-center gap-3 rounded-md border bg-card px-4 py-3 text-left text-card-foreground shadow-1 transition-[transform,background-color] hover:bg-bg active:scale-[0.99] focus-visible:ring-[3px] focus-visible:ring-ring/40 focus-visible:outline-none",
        className,
      )}
      {...rest}
    >
      <Avatar size="lg" className="rounded-md">
        {imageUrl && <AvatarImage src={imageUrl} alt="" />}
        <AvatarFallback seed={seed} className="rounded-md" />
      </Avatar>
      <div className="min-w-0 flex-1">
        <div className="truncate text-base font-bold text-text-primary">
          {name}
        </div>
        {description && (
          <div className="mt-0.5 truncate text-xs text-text-secondary">
            {description}
          </div>
        )}
        {hasMeta && (
          <div className="mt-1.5 truncate text-[11px] text-text-secondary">
            {typeof members === "number" && <span>{members}人</span>}
            {typeof members === "number" && lastActive && <span> ・ </span>}
            {lastActive && <span>最近の活動: {lastActive}</span>}
          </div>
        )}
      </div>
      {current && <Badge kind="member">現在</Badge>}
    </button>
  );
}

export { WorkspaceCard };
export type { WorkspaceCardProps };
