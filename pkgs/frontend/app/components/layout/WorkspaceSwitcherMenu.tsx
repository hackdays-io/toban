import { type ReactNode, useEffect, useState } from "react";
import { toast } from "sonner";
import { Row } from "~/components/composite/row";
import { Icon } from "~/components/ui/icon";
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
} from "~/components/ui/popover";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "~/components/ui/sheet";
import { Typography } from "~/components/ui/typography";

interface WorkspaceSwitcherMenuProps {
  /** Controlled open state — same value drives both Sheet (mobile) and
   *  Popover (desktop) so the trigger can live anywhere in the chrome. */
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Workspace name shown in the menu header. */
  workspaceName: string;
  /** Switch to the workspace list (`/workspace`). */
  onSwitchWorkspace: () => void;
  /** Open workspace settings (`/{treeId}/settings`). */
  onOpenSettings: () => void;
  /** Invite link copied to clipboard — defaults to `window.location.href`. */
  inviteLink?: string;
}

// Toban Workspace Switcher menu.
// - Mobile (`<md`): bottom Sheet anchored to the AppHeader pill.
// - Desktop (`>=md`): Popover anchored near the Sidebar workspace button via
//   a `PopoverAnchor` positioned at the top-left of the viewport (matches the
//   design source `desktop.jsx:72-101`).
// Both surfaces render the same three actions (switch / invite / settings).
// Only one primitive is mounted per viewport — both Popover and Sheet portal
// to the body, so a CSS-only `md:hidden` gate would let both open at once
// and their focus traps would fight (the Sheet flashed shut).
function WorkspaceSwitcherMenu({
  open,
  onOpenChange,
  workspaceName,
  onSwitchWorkspace,
  onOpenSettings,
  inviteLink,
}: WorkspaceSwitcherMenuProps) {
  const [isDesktop, setIsDesktop] = useState<boolean | null>(null);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(min-width: 768px)");
    setIsDesktop(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const handleInvite = async () => {
    const link =
      inviteLink ?? (typeof window !== "undefined" ? window.location.href : "");
    try {
      if (
        typeof navigator !== "undefined" &&
        navigator.clipboard?.writeText &&
        link
      ) {
        await navigator.clipboard.writeText(link);
        toast.success("招待リンクをコピーしました");
      } else {
        toast.error("クリップボードを利用できません");
      }
    } catch (error) {
      console.error("Failed to copy invite link:", error);
      toast.error("招待リンクのコピーに失敗しました");
    }
    onOpenChange(false);
  };

  const items: ReactNode = (
    <div className="flex flex-col">
      <Row
        left={<Icon name="members" />}
        title="ワークスペースを切り替え"
        subtitle="参加中の一覧から選ぶ"
        onClick={() => {
          onSwitchWorkspace();
          onOpenChange(false);
        }}
      />
      <Row
        left={<Icon name="invite" />}
        title="メンバーを招待"
        subtitle="リンクをコピーして共有"
        onClick={handleInvite}
      />
      <Row
        left={<Icon name="gear" />}
        title="ワークスペース設定"
        subtitle="名前・参加・機能設定"
        onClick={() => {
          onOpenSettings();
          onOpenChange(false);
        }}
      />
    </div>
  );

  // First paint (SSR + pre-effect client render): render nothing. The menu is
  // only meaningful once the user opens it — by then `isDesktop` is resolved.
  if (isDesktop === null) return null;

  if (isDesktop) {
    return (
      // Desktop — Popover anchored to a fixed point near the Sidebar's
      // workspace button. The anchor is a 1x1 invisible div so Radix has
      // something to position against without threading a ref through the
      // Sidebar primitive.
      <Popover open={open} onOpenChange={onOpenChange}>
        <PopoverAnchor asChild>
          <div
            aria-hidden
            className="pointer-events-none fixed top-[88px] left-[260px] size-px"
          />
        </PopoverAnchor>
        <PopoverContent
          align="start"
          side="right"
          sideOffset={8}
          className="w-[280px] p-0"
        >
          <Typography
            as="div"
            variant="bodySm"
            weight="bold"
            truncate
            className="border-b px-4 py-3"
          >
            {workspaceName}
          </Typography>
          {items}
        </PopoverContent>
      </Popover>
    );
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom">
        <SheetHeader>
          <SheetTitle>{workspaceName}</SheetTitle>
        </SheetHeader>
        <div className="px-1 pb-2">{items}</div>
      </SheetContent>
    </Sheet>
  );
}

export { WorkspaceSwitcherMenu };
export type { WorkspaceSwitcherMenuProps };
