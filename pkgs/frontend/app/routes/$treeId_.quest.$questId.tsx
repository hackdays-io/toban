import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { useNamesByAddresses } from "hooks/useENS";
import { useTreeInfo } from "hooks/useHats";
import {
  useApproveQuest,
  useCancelQuest,
  useRejectQuestSubmission,
  useSubmitQuestCompletion,
  useWithdrawQuestSubmission,
} from "hooks/useHatsQuestModule";
import { useQuestMetadata } from "hooks/useQuestMetadata";
import { type QuestDetail, useQuest } from "hooks/useQuests";
import { useActiveWallet } from "hooks/useWallet";
import { useGetWorkspace } from "hooks/useWorkspace";
import { type FC, useMemo } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { toast } from "sonner";
import type { HatsDetailSchama } from "types/hats";
import { ipfs2https } from "utils/ipfs";
import { abbreviateAddress } from "utils/wallet";
import type { Address } from "viem";
import { PageContainer } from "~/components/layout/PageContainer";
import { ScreenHeader } from "~/components/layout/ScreenHeader";
import { QuestApprovalProgress } from "~/components/quests/QuestApprovalProgress";
import { QuestStateBadge } from "~/components/quests/QuestStateBadge";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import { Heading } from "~/components/ui/heading";
import { Icon } from "~/components/ui/icon";
import { Typography } from "~/components/ui/typography";

const APPROVAL_THRESHOLD = 2;

const QuestDetailRoute: FC = () => {
  const { treeId, questId } = useParams();
  const navigate = useNavigate();
  const { wallet } = useActiveWallet();
  const me = wallet?.account?.address?.toLowerCase();

  const { data: workspace } = useGetWorkspace({ workspaceId: treeId ?? "" });
  const questModuleAddress = workspace?.workspace?.hatsQuestModule as
    | Address
    | undefined;
  const subgraphId = useMemo(() => {
    if (!questModuleAddress || !questId) return undefined;
    return `${questModuleAddress.toLowerCase()}-${questId}`;
  }, [questModuleAddress, questId]);

  const { quest, isLoading, refetch } = useQuest(subgraphId);
  const { data: meta } = useQuestMetadata(quest?.metadataHash);

  const tree = useTreeInfo(Number(treeId));
  const hat = useMemo(() => {
    if (!quest?.hatId || !tree?.hats) return undefined;
    let hatHex: string;
    try {
      hatHex = `0x${BigInt(quest.hatId).toString(16).padStart(64, "0")}`;
    } catch {
      return undefined;
    }
    return tree.hats.find((h) => h.id?.toLowerCase() === hatHex);
  }, [quest?.hatId, tree?.hats]);

  const hatDetailsUrl = useMemo(() => ipfs2https(hat?.details), [hat?.details]);
  const { data: dutyDetail } = useQuery({
    queryKey: ["hats-detail", hatDetailsUrl],
    queryFn: async (): Promise<HatsDetailSchama | undefined> => {
      if (!hatDetailsUrl) return;
      const { data } = await axios.get<HatsDetailSchama>(hatDetailsUrl);
      return data;
    },
    enabled: !!hatDetailsUrl,
    staleTime: 1000 * 60 * 60,
  });
  const dutyName = dutyDetail?.data?.name ?? "当番";

  // Viewer membership: any hat in this tree they wear satisfies the on-chain
  // `_requireWorkspaceMember` check. Pick the first such hat as the
  // `membershipHatId` we pass to submitCompletion / approve.
  const membershipHatIdHex = useMemo(() => {
    if (!me || !tree?.hats) return undefined;
    const h = tree.hats.find((h) =>
      h.wearers?.some((w) => w.id?.toLowerCase() === me),
    );
    return h?.id?.toLowerCase();
  }, [me, tree?.hats]);
  const membershipHatId = useMemo(() => {
    if (!membershipHatIdHex) return undefined;
    try {
      return BigInt(membershipHatIdHex);
    } catch {
      return undefined;
    }
  }, [membershipHatIdHex]);

  // Resolve names for creator + (latest) submitter.
  const addressesToResolve = useMemo(() => {
    const set = new Set<string>();
    if (quest?.creator) set.add(quest.creator.toLowerCase());
    if (quest?.submitter) set.add(quest.submitter.toLowerCase());
    return Array.from(set);
  }, [quest?.creator, quest?.submitter]);
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
    const lc = addr.toLowerCase();
    return nameByAddress.get(lc) ?? abbreviateAddress(addr as `0x${string}`);
  };

  // ── Write hooks ───────────────────────────────────────────────
  const { submitCompletion, isLoading: isSubmitting } =
    useSubmitQuestCompletion(questModuleAddress);
  const { withdrawSubmission, isLoading: isWithdrawing } =
    useWithdrawQuestSubmission(questModuleAddress);
  const { rejectSubmission, isLoading: isRejecting } =
    useRejectQuestSubmission(questModuleAddress);
  const { approve, isLoading: isApproving } =
    useApproveQuest(questModuleAddress);
  const { cancel, isLoading: isCancelling } =
    useCancelQuest(questModuleAddress);

  const txInFlight =
    isSubmitting || isWithdrawing || isRejecting || isApproving || isCancelling;

  // ── Actions ──────────────────────────────────────────────────
  const onSubmitCompletion = async () => {
    if (!quest || !membershipHatId) return;
    try {
      await submitCompletion({
        questId: BigInt(quest.questId),
        membershipHatId,
      });
      toast.success("完了申請を送りました");
      await refetch();
    } catch (err) {
      console.error(err);
      toast.error("完了申請に失敗しました");
    }
  };

  const onWithdraw = async () => {
    if (!quest) return;
    try {
      await withdrawSubmission(BigInt(quest.questId));
      toast.success("申請を取り下げました");
      await refetch();
    } catch (err) {
      console.error(err);
      toast.error("取り下げに失敗しました");
    }
  };

  const onReject = async () => {
    if (!quest) return;
    try {
      await rejectSubmission(BigInt(quest.questId));
      toast.success("申請を却下しました");
      await refetch();
    } catch (err) {
      console.error(err);
      toast.error("却下に失敗しました");
    }
  };

  const onApprove = async () => {
    if (!quest || !membershipHatId) return;
    try {
      await approve({
        questId: BigInt(quest.questId),
        membershipHatId,
      });
      toast.success("承認しました");
      await refetch();
    } catch (err) {
      console.error(err);
      toast.error("承認に失敗しました");
    }
  };

  const onCancel = async () => {
    if (!quest) return;
    try {
      await cancel(BigInt(quest.questId));
      toast.success("クエストをキャンセルしました");
      await refetch();
    } catch (err) {
      console.error(err);
      toast.error("キャンセルに失敗しました");
    }
  };

  // ── Render ───────────────────────────────────────────────────
  // Prefer the actual previous entry so deep-linked detail pages return to
  // their original context (duty page, workspace home, etc.). When the user
  // arrived here directly (`window.history.length === 1` in a fresh tab),
  // fall back to the workspace home — `/role` is too narrow to assume.
  const onBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      navigate(-1);
      return;
    }
    navigate(treeId ? `/${treeId}` : "/");
  };

  if (isLoading && !quest) {
    return (
      <PageContainer className="pt-4 pb-8 md:pt-6">
        <ScreenHeader title="クエスト" onBack={onBack} />
        <Card className="mx-1 mt-3 py-8 text-center">
          <Typography variant="bodySm" tone="secondary">
            読み込み中…
          </Typography>
        </Card>
      </PageContainer>
    );
  }

  if (!quest) {
    return (
      <PageContainer className="pt-4 pb-8 md:pt-6">
        <ScreenHeader title="クエスト" onBack={onBack} />
        <Card className="mx-1 mt-3 py-8 text-center">
          <Typography variant="bodySm" tone="secondary">
            クエストが見つかりません
          </Typography>
        </Card>
      </PageContainer>
    );
  }

  const isCreator = !!me && me === quest.creator.toLowerCase();
  const isSubmitter =
    !!me && !!quest.submitter && me === quest.submitter.toLowerCase();
  const isMember = !!membershipHatIdHex;
  const hasApproved =
    isMember && !!me
      ? (quest.attempts?.[0]?.approvals?.some(
          (a) => a.approver?.toLowerCase() === me,
        ) ?? false)
      : false;

  const shareAmount = shareAmountOf(quest.amount);
  const title = meta?.title ?? `Quest #${quest.questId}`;
  const description = meta?.description;

  return (
    <PageContainer className="pt-4 pb-8 md:pt-6">
      <ScreenHeader title="クエスト" onBack={onBack} />

      <div className="px-1 pb-3">
        <Card className="gap-3 px-5 py-5">
          <QuestStateBadge status={quest.status} />
          <Heading variant="h3" level={1} className="mt-2 leading-tight">
            {title}
          </Heading>
          {description && (
            <Typography
              as="p"
              variant="bodySm"
              tone="secondary"
              className="leading-relaxed whitespace-pre-wrap"
            >
              {description}
            </Typography>
          )}

          <div className="mt-2 flex gap-3 border-t border-b py-3">
            <DutyValue
              label="紐づく当番"
              value={
                treeId && hat?.id ? (
                  <Link
                    to={`/${treeId}/${hat.id}`}
                    className="text-text-primary underline-offset-2 hover:underline"
                  >
                    {dutyName}
                  </Link>
                ) : (
                  dutyName
                )
              }
            />
            <div className="w-px self-stretch bg-border" />
            <ShareValue label="もらえるシェア" value={shareAmount} />
          </div>

          <CreatorSubmitterRow
            creator={quest.creator}
            submitter={quest.submitter ?? undefined}
            resolveName={resolveName}
            status={quest.status}
          />

          {quest.status === "PendingReview" && (
            <ApprovalProgressCard count={quest.approvalCount} />
          )}

          {quest.status === "Completed" && (
            <CompletedCard
              dutyName={dutyName}
              shareAmount={shareAmount}
              submitterName={resolveName(quest.submitter)}
            />
          )}

          {quest.status === "Cancelled" && (
            <Card className="border-0 bg-bg py-3 text-center">
              <Typography variant="bodySm" tone="secondary">
                作成者がキャンセルしました
              </Typography>
            </Card>
          )}
        </Card>
      </div>

      {/* State-appropriate actions */}
      <ActionZone
        quest={quest}
        me={me}
        isCreator={isCreator}
        isSubmitter={isSubmitter}
        isMember={isMember}
        hasApproved={hasApproved}
        txInFlight={txInFlight}
        onSubmitCompletion={onSubmitCompletion}
        onWithdraw={onWithdraw}
        onReject={onReject}
        onApprove={onApprove}
        onCancel={onCancel}
      />
    </PageContainer>
  );
};

export default QuestDetailRoute;

// RoleShare raw unit count, formatted with thousands separators.
const shareAmountOf = (rawAmount: unknown): string => {
  try {
    return BigInt(rawAmount as string | number | bigint).toLocaleString();
  } catch {
    return "0";
  }
};

interface DutyValueProps {
  label: string;
  value: React.ReactNode;
}

const DutyValue: FC<DutyValueProps> = ({ label, value }) => (
  <div className="flex-1">
    <Typography as="div" variant="caption" tone="secondary" weight="semibold">
      {label}
    </Typography>
    <Typography as="div" variant="bodySm" weight="bold" className="mt-1">
      {value}
    </Typography>
  </div>
);

const ShareValue: FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="flex-1">
    <Typography as="div" variant="caption" tone="secondary" weight="semibold">
      {label}
    </Typography>
    <Typography
      as="div"
      variant="statMd"
      className="mt-1 text-primary tracking-[-0.3px]"
    >
      +{value}
      <Typography as="span" variant="caption" tone="secondary" className="ml-1">
        %
      </Typography>
    </Typography>
  </div>
);

interface CreatorSubmitterRowProps {
  creator: string;
  submitter?: string;
  resolveName: (addr?: string | null) => string;
  status: QuestDetail["status"];
}

const CreatorSubmitterRow: FC<CreatorSubmitterRowProps> = ({
  creator,
  submitter,
  resolveName,
  status,
}) => {
  const submitterRoleLabel = status === "PendingReview" ? "申請者" : "参加者";
  return (
    <div className="flex items-center gap-2.5">
      <PersonBlock label="作成者" address={creator} resolveName={resolveName} />
      {submitter && (
        <>
          <Icon
            name="chevron-right"
            size={16}
            className="shrink-0 text-text-secondary"
          />
          <PersonBlock
            label={submitterRoleLabel}
            address={submitter}
            resolveName={resolveName}
          />
        </>
      )}
    </div>
  );
};

const PersonBlock: FC<{
  label: string;
  address: string;
  resolveName: (addr?: string | null) => string;
}> = ({ label, address, resolveName }) => {
  const name = resolveName(address);
  return (
    <div className="flex min-w-0 flex-1 items-center gap-2">
      <Avatar className="size-8">
        <AvatarImage src="" alt="" />
        <AvatarFallback seed={name} />
      </Avatar>
      <div className="min-w-0">
        <Typography as="div" variant="micro" tone="secondary">
          {label}
        </Typography>
        <Typography as="div" variant="caption" weight="bold" truncate>
          {name}
        </Typography>
      </div>
    </div>
  );
};

const ApprovalProgressCard: FC<{ count: number }> = ({ count }) => (
  <Card className="gap-2 border-[#D6B995]/55 bg-primary-soft px-3.5 py-3">
    <Typography
      as="div"
      variant="caption"
      weight="bold"
      className="text-[#7A5A2E]"
    >
      承認状況
    </Typography>
    <QuestApprovalProgress
      count={count}
      threshold={APPROVAL_THRESHOLD}
      onSoftBackground
    />
    <Typography
      as="p"
      variant="caption"
      className="leading-relaxed text-[#7A5A2E]"
    >
      作成者の承認、または当番シェア保有者2人の承認で完了します。
    </Typography>
  </Card>
);

const CompletedCard: FC<{
  dutyName: string;
  shareAmount: string;
  submitterName: string;
}> = ({ dutyName, shareAmount, submitterName }) => (
  <Card className="gap-1 border-[#2F8B58]/55 bg-[#E5F5EC] px-3.5 py-3">
    <Typography
      as="div"
      variant="bodySm"
      weight="bold"
      className="text-[#2F8B58]"
    >
      {submitterName} が完了しました
    </Typography>
    <Typography as="div" variant="caption" className="text-[#2F8B58]">
      {dutyName} の当番シェア +{shareAmount}
    </Typography>
  </Card>
);

interface ActionZoneProps {
  quest: QuestDetail;
  me?: string;
  isCreator: boolean;
  isSubmitter: boolean;
  isMember: boolean;
  hasApproved: boolean;
  txInFlight: boolean;
  onSubmitCompletion: () => void;
  onWithdraw: () => void;
  onReject: () => void;
  onApprove: () => void;
  onCancel: () => void;
}

const ActionZone: FC<ActionZoneProps> = ({
  quest,
  me,
  isCreator,
  isSubmitter,
  isMember,
  hasApproved,
  txInFlight,
  onSubmitCompletion,
  onWithdraw,
  onReject,
  onApprove,
  onCancel,
}) => {
  if (!me) {
    return (
      <div className="px-1 pt-1">
        <Typography
          as="p"
          variant="caption"
          tone="secondary"
          className="px-2 text-center"
        >
          ウォレットを接続するとアクションが表示されます
        </Typography>
      </div>
    );
  }

  if (quest.status === "Open") {
    if (isCreator) {
      return (
        <div className="px-1 pt-1">
          <Button
            variant="secondary"
            full
            onClick={onCancel}
            disabled={txInFlight}
          >
            キャンセル
          </Button>
        </div>
      );
    }
    if (!isMember) {
      return (
        <ActionMessage message="ワークスペースメンバーのみクエストを申請できます" />
      );
    }
    return (
      <div className="px-1 pt-1">
        <Button
          variant="primary"
          full
          onClick={onSubmitCompletion}
          disabled={txInFlight}
        >
          <Icon name="check" size={16} />
          完了申請する
        </Button>
      </div>
    );
  }

  if (quest.status === "PendingReview") {
    if (isSubmitter) {
      return (
        <div className="px-1 pt-1">
          <Button
            variant="secondary"
            full
            onClick={onWithdraw}
            disabled={txInFlight}
          >
            申請を取り下げる
          </Button>
        </div>
      );
    }
    if (isCreator) {
      return (
        <div className="flex flex-col gap-2 px-1 pt-1">
          <Button
            variant="primary"
            full
            onClick={onApprove}
            disabled={txInFlight}
          >
            <Icon name="check" size={16} />
            承認する
          </Button>
          <Button
            variant="secondary"
            full
            onClick={onReject}
            disabled={txInFlight}
          >
            申請を却下する
          </Button>
        </div>
      );
    }
    if (!isMember) {
      return <ActionMessage message="ワークスペースメンバーのみ承認できます" />;
    }
    if (hasApproved) {
      return (
        <div className="px-1 pt-1">
          <Button variant="secondary" full disabled>
            承認済み
          </Button>
        </div>
      );
    }
    return (
      <div className="px-1 pt-1">
        <Button
          variant="primary"
          full
          onClick={onApprove}
          disabled={txInFlight}
        >
          <Icon name="check" size={16} />
          承認する
        </Button>
      </div>
    );
  }

  // Completed / Cancelled — no actions; the body card already explains state.
  return null;
};

const ActionMessage: FC<{ message: string }> = ({ message }) => (
  <Typography
    as="p"
    variant="caption"
    tone="secondary"
    className="px-3 pt-1 text-center"
  >
    {message}
  </Typography>
);
