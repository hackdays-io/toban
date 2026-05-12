import { useQuestMetadata } from "hooks/useQuestMetadata";
import type { Quest, QuestStatus } from "hooks/useQuests";
import { type FC, Fragment } from "react";
import { Link } from "react-router";
import { abbreviateAddress } from "utils/wallet";

import { SectionLabel } from "~/components/composite/section-label";
import { QuestStateBadge } from "~/components/quests/QuestStateBadge";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import { Icon } from "~/components/ui/icon";
import { Typography } from "~/components/ui/typography";

interface QuestPanelProps {
  quests: Quest[];
  loading: boolean;
  treeId?: string;
  hatId?: string;
  /** Only render the "クエストを作成" CTA when the viewer actually holds role
   *  share — quest creation requires spending share, so the button would be
   *  a dead-end otherwise. Defaults to false. */
  canCreate?: boolean;
}

// Toban QuestPanel — labelled section that groups a hat's quests by status
// (Open / PendingReview / Completed) and ends with the "クエストを作成" CTA.
// Shared between the duty detail and holder detail pages.
const QuestPanel: FC<QuestPanelProps> = ({
  quests,
  loading,
  treeId,
  hatId,
  canCreate = false,
}) => {
  const groups: { status: QuestStatus; title: string }[] = [
    { status: "Open", title: "募集中のクエスト" },
    { status: "PendingReview", title: "確認待ち" },
    { status: "Completed", title: "完了" },
    { status: "Cancelled", title: "キャンセル" },
  ];

  const createButton = canCreate ? (
    <Button asChild variant="secondary" full>
      <Link to={`/${treeId}/${hatId}/quest/new`}>
        <Icon name="plus" size={16} />
        クエストを作成
      </Link>
    </Button>
  ) : null;

  return (
    <section className="flex flex-col gap-3">
      <SectionLabel className="px-0">クエスト</SectionLabel>

      {loading && quests.length === 0 ? (
        <Card className="py-8 text-center">
          <Typography variant="bodySm" tone="secondary">
            クエストを読み込み中…
          </Typography>
        </Card>
      ) : quests.length === 0 ? (
        <Card className="py-8 text-center">
          <Typography variant="bodySm" tone="secondary">
            この当番にはまだクエストがありません
          </Typography>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {groups.map((g) => {
            const items = quests.filter((q) => q.status === g.status);
            if (items.length === 0) return null;
            return (
              <Fragment key={g.status}>
                <SectionLabel className="px-0 pt-0">
                  {g.title}（{items.length}）
                </SectionLabel>
                <div className="flex flex-col gap-2">
                  {items.map((q) => (
                    <QuestCard
                      key={q.id}
                      quest={q}
                      treeId={treeId}
                      hatId={hatId}
                    />
                  ))}
                </div>
              </Fragment>
            );
          })}
        </div>
      )}

      {createButton}
    </section>
  );
};

const QuestCard: FC<{ quest: Quest; treeId?: string; hatId?: string }> = ({
  quest,
  treeId,
}) => {
  const { data: meta } = useQuestMetadata(quest.metadataHash);
  const title = meta?.title ?? `Quest #${quest.questId}`;
  const sharePercent = sharePercentOf(quest.amount);

  const card = (
    <Card className="gap-2 px-3.5 py-3 transition-colors hover:bg-bg">
      <div className="flex items-start gap-2.5">
        <div className="min-w-0 flex-1">
          <Typography as="div" variant="bodySm" weight="bold" truncate>
            {title}
          </Typography>
          <div className="mt-1 flex items-center gap-2">
            <QuestStateBadge status={quest.status} />
            <Typography variant="micro" tone="secondary" as="span">
              {questMeta(quest)}
            </Typography>
          </div>
        </div>
        <div className="shrink-0 text-right">
          <Typography variant="micro" tone="secondary" as="div">
            当番シェア
          </Typography>
          <Typography
            as="div"
            variant="statMd"
            className="text-primary tracking-[-0.5px]"
          >
            +{sharePercent}
            <Typography
              as="span"
              variant="micro"
              tone="secondary"
              className="ml-0.5"
            >
              %
            </Typography>
          </Typography>
        </div>
      </div>
    </Card>
  );

  if (treeId) {
    return (
      <Link
        to={`/${treeId}/quest/${quest.questId}`}
        className="block focus-visible:rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
      >
        {card}
      </Link>
    );
  }
  return card;
};

// RoleShare raw units → percent. 10000 raw units == 100% per
// HatsFractionTokenModule.DEFAULT_TOKEN_SUPPLY.
const sharePercentOf = (rawAmount: unknown): string => {
  try {
    const raw = BigInt(rawAmount as string | number | bigint);
    return (Number(raw) / 100).toString();
  } catch {
    return "0";
  }
};

const questMeta = (q: Quest): string => {
  if (q.status === "Open") {
    return `作成者: ${abbreviateAddress(q.creator)}`;
  }
  if (q.status === "PendingReview") {
    return `申請者: ${
      q.submitter ? abbreviateAddress(q.submitter) : "-"
    }・承認 ${q.approvalCount}/2`;
  }
  if (q.status === "Completed") {
    return `${q.submitter ? abbreviateAddress(q.submitter) : "-"} が完了`;
  }
  return "";
};

export { QuestPanel };
export type { QuestPanelProps };
