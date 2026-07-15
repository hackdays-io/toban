import type { QuestStatus } from "hooks/useQuests";
import type { FC } from "react";

import { cn } from "~/lib/utils";

// Color tokens lifted verbatim from the design source
// (`docs/design/handoff/project/quests.jsx` STATE_LABELS). Status colors are
// quest-specific and unrelated to the generic Badge kinds, so they live here
// rather than in `~/components/ui/badge`.
const STATE_STYLES: Record<QuestStatus, { label: string; className: string }> =
  {
    Open: { label: "募集中", className: "bg-[#FFF2CF] text-[#7A5A2E]" },
    PendingReview: {
      label: "確認待ち",
      className: "bg-[#F2EBF8] text-[#6E4DAA]",
    },
    Completed: { label: "完了", className: "bg-[#E5F5EC] text-[#2F8B58]" },
    Cancelled: {
      label: "キャンセル",
      className: "bg-[#F0EBE0] text-text-secondary",
    },
  };

interface QuestStateBadgeProps {
  status: QuestStatus;
  className?: string;
}

const QuestStateBadge: FC<QuestStateBadgeProps> = ({ status, className }) => {
  const style = STATE_STYLES[status];
  return (
    <span
      data-status={status}
      className={cn(
        "inline-flex w-fit items-center rounded-full px-2.5 py-[3px] text-[11px] font-bold tracking-[0.02em]",
        style.className,
        className,
      )}
    >
      {style.label}
    </span>
  );
};

export { QuestStateBadge };
export type { QuestStateBadgeProps };
