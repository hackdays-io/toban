import type { FC } from "react";

import { Typography } from "~/components/ui/typography";
import { cn } from "~/lib/utils";

interface QuestApprovalProgressProps {
  count: number;
  /** Threshold required for completion. Defaults to 2 (two distinct
   *  workspace-member approvals); a single creator approval also completes
   *  but is reflected on-chain as count == 2 once accepted. */
  threshold?: number;
  /** Render against the primary-soft card background (true) or against
   *  surface (false, default). Controls the bar background contrast. */
  onSoftBackground?: boolean;
  className?: string;
}

// Approval progress bar + n / threshold caption. Reused on the quest detail
// card and (optionally) on a creator's approve action surface.
const QuestApprovalProgress: FC<QuestApprovalProgressProps> = ({
  count,
  threshold = 2,
  onSoftBackground = false,
  className,
}) => {
  const ratio = Math.max(0, Math.min(1, count / threshold));
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <div
        className={cn(
          "h-1.5 flex-1 overflow-hidden rounded-full",
          onSoftBackground ? "bg-white/70" : "bg-border",
        )}
      >
        <div
          className="h-full bg-primary transition-[width] duration-300 ease-out"
          style={{ width: `${ratio * 100}%` }}
        />
      </div>
      <Typography
        as="span"
        variant="bodySm"
        weight="bold"
        className={onSoftBackground ? "text-[#7A5A2E]" : undefined}
      >
        {count} / {threshold}
      </Typography>
    </div>
  );
};

export { QuestApprovalProgress };
export type { QuestApprovalProgressProps };
