import type { FC } from "react";

import { abbreviateAddress } from "utils/wallet";
import { Divider } from "~/components/composite/divider";
import { DONUT_PALETTE } from "~/components/composite/donut-chart";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Card } from "~/components/ui/card";
import { Typography } from "~/components/ui/typography";

export interface BreakdownRecipient {
  /** Stable key — usually the recipient address (lowercased). */
  address: string;
  /** Pre-computed percentage of the whole (0-100). */
  pct: number;
}

export interface BreakdownNameInfo {
  name?: string;
  avatarUrl?: string;
}

export interface SplitBreakdownCardProps {
  recipients: BreakdownRecipient[];
  /** Map from lowercased address → display name + avatar. Optional entries. */
  nameByAddress: Map<string, BreakdownNameInfo>;
  /** Message shown when there are no recipients to render. */
  emptyLabel?: string;
}

// Toban split "分配の内訳" card — rank + avatar + name + colour bar + %.
// Shared between the split detail screen (#441) and the create-flow preview
// (#442) so authoring and viewing use the same row shape and palette.
//
// The colour palette matches the DonutChart by index — rank `n` shares its
// colour with the nth slice. Bar width is the recipient's percentage on an
// absolute 0–100 scale (so 30% reads as a third-full bar, not "fullest in
// this list").
export const SplitBreakdownCard: FC<SplitBreakdownCardProps> = ({
  recipients,
  nameByAddress,
  emptyLabel = "分配先がありません",
}) => {
  if (recipients.length === 0) {
    return (
      <Card className="gap-0 p-0">
        <Typography
          variant="bodySm"
          tone="secondary"
          className="px-4 py-6 text-center"
        >
          {emptyLabel}
        </Typography>
      </Card>
    );
  }

  return (
    <Card className="gap-0 p-0">
      {recipients.map((r, i) => {
        const entry = nameByAddress.get(r.address.toLowerCase());
        const name =
          entry?.name ?? abbreviateAddress(r.address as `0x${string}`);
        const color = DONUT_PALETTE[i % DONUT_PALETTE.length];
        return (
          <div key={r.address}>
            <div className="flex items-center gap-3 px-4 py-3">
              <Typography
                as="span"
                variant="caption"
                weight="bold"
                tone="secondary"
                className="w-6 shrink-0"
              >
                {i + 1}
              </Typography>
              <Avatar size="default" className="size-8">
                {entry?.avatarUrl && (
                  <AvatarImage src={entry.avatarUrl} alt="" />
                )}
                <AvatarFallback seed={name} />
              </Avatar>
              <Typography
                as="div"
                variant="bodySm"
                weight="semibold"
                truncate
                className="min-w-0 flex-1"
              >
                {name}
              </Typography>
              <div className="hidden h-1.5 w-20 overflow-hidden rounded-xs bg-[#F0EBE0] sm:block">
                <div
                  className="h-full"
                  style={{
                    width: `${Math.max(0, Math.min(100, r.pct))}%`,
                    backgroundColor: color,
                  }}
                />
              </div>
              <Typography
                as="span"
                variant="bodySm"
                weight="bold"
                className="w-14 shrink-0 text-right tabular-nums"
              >
                {r.pct.toFixed(2)}%
              </Typography>
            </div>
            {i < recipients.length - 1 && <Divider inset={16} />}
          </div>
        );
      })}
    </Card>
  );
};
