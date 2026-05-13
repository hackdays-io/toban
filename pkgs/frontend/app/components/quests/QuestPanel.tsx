import { useNamesByAddresses } from "hooks/useENS";
import { useQuestMetadata } from "hooks/useQuestMetadata";
import type { Quest, QuestStatus } from "hooks/useQuests";
import { type FC, Fragment, useMemo } from "react";
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
  /** Wearer that fixes the (hatId, wearer) role-share tokenId the viewer will
   *  spend from. The CTA links to `/<tree>/<hat>/<wearer>/quest/new`, so this
   *  must be set when `canCreate` is true. From the holder detail page it's
   *  the page's `address` param; from the duty detail page it's the viewer
   *  themselves (MVP scope: wearers create quests for their own shard). */
  wearerAddress?: string;
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
  wearerAddress,
  canCreate = false,
}) => {
  const groups: { status: QuestStatus; title: string }[] = [
    { status: "Open", title: "募集中のクエスト" },
    { status: "PendingReview", title: "確認待ち" },
    { status: "Completed", title: "完了" },
    { status: "Cancelled", title: "キャンセル" },
  ];

  const createButton =
    canCreate && wearerAddress ? (
      <Button asChild variant="secondary" full>
        <Link to={`/${treeId}/${hatId}/${wearerAddress}/quest/new`}>
          <Icon name="plus" size={16} />
          クエストを作成
        </Link>
      </Button>
    ) : null;

  // Resolve creator addresses to ENS / Namestone names in a single batch so
  // each row shows a human name instead of a 0x… stub. Submitters are
  // included on the same call since they share the same column in `questMeta`
  // and the lookup cost is dominated by the network round-trip, not by the
  // address count.
  const addressesToResolve = useMemo(() => {
    const set = new Set<string>();
    for (const q of quests) {
      if (q.creator) set.add(q.creator.toLowerCase());
      if (q.submitter) set.add(q.submitter.toLowerCase());
    }
    return Array.from(set);
  }, [quests]);
  const { names } = useNamesByAddresses(addressesToResolve);
  const nameByAddress = useMemo(() => {
    const map = new Map<string, string>();
    for (const group of names) {
      const entry = group[0];
      if (entry?.address && entry.name) {
        map.set(entry.address.toLowerCase(), entry.name);
      }
    }
    return map;
  }, [names]);
  const resolveName = (addr?: string | null): string => {
    if (!addr) return "-";
    return (
      nameByAddress.get(addr.toLowerCase()) ??
      abbreviateAddress(addr as `0x${string}`)
    );
  };

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
                      resolveName={resolveName}
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

const QuestCard: FC<{
  quest: Quest;
  treeId?: string;
  hatId?: string;
  resolveName: (addr?: string | null) => string;
}> = ({ quest, treeId, resolveName }) => {
  const { data: meta } = useQuestMetadata(quest.metadataHash);
  const title = meta?.title ?? `Quest #${quest.questId}`;
  const shareAmount = shareAmountOf(quest.amount);

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
              {questMeta(quest, resolveName)}
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
            +{shareAmount}
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

// RoleShare raw unit count, formatted with thousands separators. The escrow
// stored on-chain by HatsQuestModule is already in raw units (no percent
// conversion happens at any layer).
const shareAmountOf = (rawAmount: unknown): string => {
  try {
    return BigInt(rawAmount as string | number | bigint).toLocaleString();
  } catch {
    return "0";
  }
};

const questMeta = (
  q: Quest,
  resolveName: (addr?: string | null) => string,
): string => {
  if (q.status === "Open") {
    return `作成者: ${resolveName(q.creator)}`;
  }
  if (q.status === "PendingReview") {
    return `申請者: ${resolveName(q.submitter)}・承認 ${q.approvalCount}/2`;
  }
  if (q.status === "Completed") {
    return `${resolveName(q.submitter)} が完了`;
  }
  return "";
};

export { QuestPanel };
export type { QuestPanelProps };
