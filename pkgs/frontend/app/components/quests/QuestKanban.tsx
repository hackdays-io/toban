import type { Hat } from "@hatsprotocol/sdk-v1-subgraph";
import type { QuestStatus } from "hooks/useQuests";
import { useScrollToTop } from "hooks/useScrollToTop";
import { type FC, useMemo, useState } from "react";

import { Segmented } from "~/components/composite/segmented";
import { QuestKanbanColumn } from "~/components/quests/QuestKanbanColumn";

interface QuestKanbanProps {
  treeId?: string;
  /** Workspace's role-branch hats — used to render duty names on each card. */
  dutyHats: Hat[];
}

const COLUMNS: { status: QuestStatus; title: string }[] = [
  { status: "Open", title: "募集中" },
  { status: "PendingReview", title: "確認待ち" },
  { status: "Completed", title: "完了" },
  { status: "Cancelled", title: "キャンセル" },
];

// Workspace-wide quest kanban. Desktop: 4 columns side-by-side, each column
// scrolls + paginates independently. Mobile: column picker (Segmented) +
// single column — full kanban horizontal-scroll is deferred (see #501 spec).
const QuestKanban: FC<QuestKanbanProps> = ({ treeId, dutyHats }) => {
  // Decimal-keyed map of hats. `Quest.hatId` is decimal; `Hat.id` from the
  // Hats subgraph is hex. Convert once here so each card lookup is O(1).
  const hatByDecimalId = useMemo(() => {
    const map = new Map<string, Hat>();
    for (const h of dutyHats) {
      try {
        map.set(BigInt(h.id).toString(), h);
      } catch {
        // ignore non-hex ids
      }
    }
    return map;
  }, [dutyHats]);

  const [mobileStatus, setMobileStatus] = useState<QuestStatus>("Open");
  const mobileColumn = COLUMNS.find((c) => c.status === mobileStatus);
  const mobileRef = useScrollToTop([mobileStatus]);

  return (
    <>
      {/* Mobile: pick one column at a time. */}
      <div ref={mobileRef} className="md:hidden">
        <div className="px-1 pb-3">
          <Segmented<QuestStatus>
            value={mobileStatus}
            onChange={setMobileStatus}
            options={COLUMNS.map((c) => ({ value: c.status, label: c.title }))}
            className="w-full"
          />
        </div>
        {mobileColumn && (
          <div className="px-1">
            <QuestKanbanColumn
              status={mobileColumn.status}
              title={mobileColumn.title}
              treeId={treeId}
              hatByDecimalId={hatByDecimalId}
            />
          </div>
        )}
      </div>

      {/* Desktop: 4 columns side-by-side. Each column scrolls vertically. */}
      <div className="hidden md:grid md:grid-cols-4 md:gap-4">
        {COLUMNS.map((c) => (
          <QuestKanbanColumn
            key={c.status}
            status={c.status}
            title={c.title}
            treeId={treeId}
            hatByDecimalId={hatByDecimalId}
          />
        ))}
      </div>
    </>
  );
};

export { QuestKanban };
export type { QuestKanbanProps };
