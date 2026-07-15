import { useTreeInfo } from "hooks/useHats";
import { useActiveWallet } from "hooks/useWallet";
import { type FC, useMemo, useState } from "react";
import { useParams } from "react-router";

import { Breadcrumb } from "~/components/composite/breadcrumb";
import { PageContainer } from "~/components/layout/PageContainer";
import { QuestCreatePickerSheet } from "~/components/quests/QuestCreatePickerSheet";
import { QuestKanban } from "~/components/quests/QuestKanban";
import { WorkspaceHeader } from "~/components/workspace/WorkspaceHeader";

const WorkspaceQuests: FC = () => {
  const { treeId } = useParams();
  const { wallet } = useActiveWallet();
  const me = wallet?.account?.address?.toLowerCase();

  const tree = useTreeInfo(Number(treeId));

  // Role-branch hats only (0001) — kept in sync with the duty list in
  // `$treeId_.role.tsx` so duty-name lookup on each quest card resolves.
  const dutyHats = useMemo(() => {
    if (!tree?.hats) return [];
    return tree.hats.filter(
      (h) =>
        Number(h.levelAtLocalTree) >= 2 &&
        h.prettyId?.startsWith(`${tree.id}.0001`),
    );
  }, [tree]);

  // Viewer must wear at least one duty to spend role share on a new quest.
  const canCreateQuest = useMemo(() => {
    if (!me) return false;
    return dutyHats.some((h) =>
      (h.wearers ?? []).some((w) => w.id?.toLowerCase() === me),
    );
  }, [dutyHats, me]);

  const [pickerOpen, setPickerOpen] = useState(false);

  return (
    <PageContainer className="pt-4 pb-8 md:pt-6">
      <Breadcrumb
        className="mb-3 px-1"
        items={[
          { label: "ホーム", to: `/${treeId}` },
          { label: "クエスト一覧" },
        ]}
      />

      <div className="flex flex-col gap-4">
        <WorkspaceHeader
          title="クエスト"
          subtitle="募集中の依頼と進捗"
          ctaLabel="作成"
          onCtaClick={() => setPickerOpen(true)}
          showCta={canCreateQuest}
        />
        <QuestKanban treeId={treeId} dutyHats={dutyHats} />
      </div>

      <QuestCreatePickerSheet
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        treeId={treeId ?? ""}
        viewerAddress={me}
        dutyHats={dutyHats}
      />
    </PageContainer>
  );
};

export default WorkspaceQuests;
