import type { Hat } from "@hatsprotocol/sdk-v1-subgraph";
import { type Quest, type QuestStatus, useQuests } from "hooks/useQuests";
import { type FC, useState } from "react";

import { QuestCard } from "~/components/quests/QuestCard";
import { QuestStateBadge } from "~/components/quests/QuestStateBadge";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import { Typography } from "~/components/ui/typography";

const PAGE_SIZE = 20;

interface QuestKanbanColumnProps {
  status: QuestStatus;
  title: string;
  treeId?: string;
  /** Decimal-keyed map of hats (questId.hatId is decimal) used for duty-name
   *  lookup on each card. */
  hatByDecimalId: Map<string, Hat>;
}

// Single status column for the workspace quest kanban. Owns its own paginated
// `useQuests` call so each column can be advanced independently. Pagination
// uses a "もっと見る" button — IntersectionObserver-based auto-load doesn't
// play well with the horizontally-scrolling parent on desktop.
const QuestKanbanColumn: FC<QuestKanbanColumnProps> = ({
  status,
  title,
  treeId,
  hatByDecimalId,
}) => {
  const { quests, isLoading, loadMore } = useQuests(treeId, {
    statuses: [status],
    first: PAGE_SIZE,
  });

  // We learn we hit the tail only when a fetchMore returns fewer rows than
  // requested. Until that happens, assume more rows may exist whenever the
  // initial batch saturated PAGE_SIZE.
  const [reachedEnd, setReachedEnd] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const hasMore = !reachedEnd && quests.length >= PAGE_SIZE;
  const countLabel = hasMore ? `${quests.length}+` : `${quests.length}`;

  const onLoadMore = async () => {
    setLoadingMore(true);
    try {
      const fetched = await loadMore(PAGE_SIZE);
      if (fetched < PAGE_SIZE) setReachedEnd(true);
    } finally {
      setLoadingMore(false);
    }
  };

  return (
    <section className="flex min-w-0 flex-col gap-2.5">
      <ColumnHeader title={title} status={status} countLabel={countLabel} />
      <ColumnBody
        quests={quests}
        treeId={treeId}
        hatByDecimalId={hatByDecimalId}
        isLoading={isLoading}
      />
      {hasMore && (
        <Button
          variant="secondary"
          size="sm"
          full
          onClick={onLoadMore}
          disabled={loadingMore}
        >
          {loadingMore ? "読み込み中…" : "もっと見る"}
        </Button>
      )}
    </section>
  );
};

interface ColumnHeaderProps {
  title: string;
  status: QuestStatus;
  countLabel: string;
}

// `title` is rendered visually-hidden — the QuestStateBadge already carries
// the status name (募集中 / 確認待ち / …), so showing it again as text would
// be duplicative. We keep it in the DOM as an `sr-only` heading so screen
// readers still announce a labelled column.
const ColumnHeader: FC<ColumnHeaderProps> = ({ title, status, countLabel }) => (
  <div className="flex items-center gap-2 px-1">
    <span className="sr-only">{title}</span>
    <QuestStateBadge status={status} />
    <Typography
      as="span"
      variant="micro"
      tone="secondary"
      weight="semibold"
      className="ml-auto tabular-nums"
    >
      {countLabel}
    </Typography>
  </div>
);

interface ColumnBodyProps {
  quests: Quest[];
  treeId?: string;
  hatByDecimalId: Map<string, Hat>;
  isLoading: boolean;
}

const ColumnBody: FC<ColumnBodyProps> = ({
  quests,
  treeId,
  hatByDecimalId,
  isLoading,
}) => {
  if (isLoading && quests.length === 0) {
    return (
      <Card className="py-6 text-center">
        <Typography variant="bodySm" tone="secondary">
          読み込み中…
        </Typography>
      </Card>
    );
  }
  if (quests.length === 0) {
    return (
      <Card className="py-6 text-center">
        <Typography variant="bodySm" tone="secondary">
          該当なし
        </Typography>
      </Card>
    );
  }
  return (
    <div className="flex flex-col gap-2">
      {quests.map((q) => (
        <QuestCard
          key={q.id}
          quest={q}
          hat={hatByDecimalId.get(q.hatId)}
          treeId={treeId}
        />
      ))}
    </div>
  );
};

export { QuestKanbanColumn };
export type { QuestKanbanColumnProps };
