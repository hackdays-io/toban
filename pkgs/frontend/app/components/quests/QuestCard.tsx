import type { Hat } from "@hatsprotocol/sdk-v1-subgraph";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { useQuestMetadata } from "hooks/useQuestMetadata";
import type { Quest } from "hooks/useQuests";
import { type FC, useMemo } from "react";
import { Link } from "react-router";
import type { HatsDetailSchama } from "types/hats";
import { ipfs2https } from "utils/ipfs";

import { Card } from "~/components/ui/card";
import { Typography } from "~/components/ui/typography";

// IPFS-backed Hat metadata. Shares the `["hats-detail", url]` cache key with
// `HatsListItemParser` so the duty-name lookup is dedup'd across surfaces.
const useHatDetail = (detailsUri?: string) => {
  const httpsUri = useMemo(() => ipfs2https(detailsUri), [detailsUri]);
  const { data } = useQuery({
    queryKey: ["hats-detail", httpsUri],
    queryFn: async (): Promise<HatsDetailSchama | undefined> => {
      if (!httpsUri) return;
      const { data } = await axios.get<HatsDetailSchama>(httpsUri);
      return data;
    },
    enabled: !!httpsUri,
    staleTime: 1000 * 60 * 60,
  });
  return data;
};

interface QuestCardProps {
  quest: Quest;
  /** When provided, the duty's display name is rendered above the title. */
  hat?: Hat;
  treeId?: string;
}

// Workspace-wide quest card: duty name + title + state badge + meta + share.
// Used inside the workspace quest kanban. The duty-detail page uses its own
// row variant in `QuestPanel` because it already groups by duty.
const QuestCard: FC<QuestCardProps> = ({ quest, hat, treeId }) => {
  const detail = useHatDetail(hat?.details);
  const dutyName = detail?.data?.name;
  const { data: meta } = useQuestMetadata(quest.metadataHash);
  const title = meta?.title ?? `Quest #${quest.questId}`;
  const shareAmount = (() => {
    try {
      return BigInt(quest.amount).toLocaleString();
    } catch {
      return "0";
    }
  })();

  const description = meta?.description?.trim();
  const card = (
    <Card className="gap-2 px-3.5 py-3 transition-colors hover:bg-bg">
      <div className="flex items-start gap-2.5">
        <div className="min-w-0 flex-1">
          {dutyName && (
            <Typography
              as="div"
              variant="micro"
              tone="secondary"
              weight="bold"
              truncate
              className="mb-0.5"
            >
              {dutyName}
            </Typography>
          )}
          <Typography
            as="div"
            variant="bodySm"
            weight="bold"
            className="line-clamp-2"
          >
            {title}
          </Typography>
          {description && (
            <Typography
              as="div"
              variant="micro"
              tone="secondary"
              className="mt-1 line-clamp-2"
            >
              {description}
            </Typography>
          )}
        </div>
        <div className="shrink-0 text-right">
          <Typography variant="micro" tone="secondary" as="div">
            当番シェア
          </Typography>
          <Typography
            as="div"
            variant="bodySm"
            weight="bold"
            className="text-primary tabular-nums tracking-[-0.3px]"
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

export { QuestCard };
export type { QuestCardProps };
