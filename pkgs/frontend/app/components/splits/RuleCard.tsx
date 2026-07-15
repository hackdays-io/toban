import type { FC } from "react";

import { Divider } from "~/components/composite/divider";
import { WeightBar } from "~/components/composite/weight-bar";
import { Card } from "~/components/ui/card";
import { Typography } from "~/components/ui/typography";

// Weights captured at split creation time. Normalised to plain `number` so the
// same component renders both the live form state (numbers from sliders) and
// the on-chain values recovered from decoded calldata (bigint → number).
export interface WeightInfo {
  roleWeight: number;
  thanksTokenWeight: number;
  thanksTokenReceivedWeight: number;
  thanksTokenSentWeight: number;
}

export interface RuleCardProps {
  weights?: WeightInfo | null;
  loading?: boolean;
}

// Toban split "分配ルール" card — `WeightBar`s for the top-level toban/thanks
// split + a stat pair for the thanks-internal received/sent weight. Used both
// on the split detail screen (#441) and the create-flow preview (#442) so the
// rule shape stays identical between authoring and viewing.
export const RuleCard: FC<RuleCardProps> = ({ weights, loading }) => {
  if (loading) {
    return (
      <Card className="px-4 py-6 text-center">
        <Typography variant="bodySm" tone="secondary">
          ルールを読み込み中…
        </Typography>
      </Card>
    );
  }
  if (!weights) {
    return (
      <Card className="px-4 py-6 text-center">
        <Typography variant="bodySm" tone="secondary">
          ルール情報を取得できませんでした
        </Typography>
      </Card>
    );
  }

  const total = weights.roleWeight + weights.thanksTokenWeight;
  const dutyPct =
    total > 0 ? Math.round((weights.roleWeight / total) * 100) : 0;
  const thanksPct =
    total > 0 ? Math.round((weights.thanksTokenWeight / total) * 100) : 0;
  const recvTotal =
    weights.thanksTokenReceivedWeight + weights.thanksTokenSentWeight;
  const recvPct =
    recvTotal > 0
      ? Math.round((weights.thanksTokenReceivedWeight / recvTotal) * 100)
      : 0;
  const sentPct =
    recvTotal > 0
      ? Math.round((weights.thanksTokenSentWeight / recvTotal) * 100)
      : 0;

  return (
    <Card className="gap-4 px-4 py-4">
      <WeightBar label="当番ベース" pct={dutyPct} color="var(--color-role)" />
      <WeightBar
        label="サンクスベース"
        pct={thanksPct}
        color="var(--color-contrib)"
      />
      <Divider />
      <div>
        <Typography
          as="div"
          variant="caption"
          tone="secondary"
          weight="semibold"
          className="mb-2"
        >
          サンクス内の重み
        </Typography>
        <div className="flex gap-2.5">
          <RuleStat
            label="受け取り"
            value={recvPct}
            color="var(--color-contrib)"
          />
          <RuleStat label="送付" value={sentPct} color="var(--color-primary)" />
        </div>
      </div>
    </Card>
  );
};

const RuleStat: FC<{ label: string; value: number; color: string }> = ({
  label,
  value,
  color,
}) => (
  <div className="flex flex-1 flex-col items-center gap-1 rounded-sm bg-bg px-3 py-3 text-center">
    <Typography variant="micro" tone="secondary" as="span">
      {label}
    </Typography>
    <Typography
      as="span"
      variant="statMd"
      className="tabular-nums"
      style={{ color }}
    >
      {value}%
    </Typography>
  </div>
);
