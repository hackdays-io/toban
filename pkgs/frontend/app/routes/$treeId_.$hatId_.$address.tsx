import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import dayjs from "dayjs";
import { useNamesByAddresses } from "hooks/useENS";
import {
  useFractionToken,
  useGetBalanceOfFractionTokens,
} from "hooks/useFractionToken";
import { useTreeInfo } from "hooks/useHats";
import {
  useActiveState,
  useDeactivate,
  useHasAuthority,
  useReactivate,
  useRenounceHatFromTimeFrameModule,
} from "hooks/useHatsTimeFrameModule";
import { useQuests } from "hooks/useQuests";
import { useActiveWallet } from "hooks/useWallet";
import { useGetWorkspace } from "hooks/useWorkspace";
import { type FC, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { toast } from "sonner";
import type { HatsDetailSchama } from "types/hats";
import { ipfs2https } from "utils/ipfs";
import { abbreviateAddress } from "utils/wallet";
import type { Address } from "viem";
import { AssistCreditSendSheet } from "~/components/assistcredit/AssistCreditSendSheet";
import { Breadcrumb } from "~/components/composite/breadcrumb";
import { SectionLabel } from "~/components/composite/section-label";
import {
  SHARE_PALETTE,
  ShareDistribution,
} from "~/components/composite/share-distribution";
import { PageContainer } from "~/components/layout/PageContainer";
import { QuestPanel } from "~/components/quests/QuestPanel";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import { Heading } from "~/components/ui/heading";
import { Icon } from "~/components/ui/icon";
import { Typography } from "~/components/ui/typography";
import { cn } from "~/lib/utils";

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

const HolderDetail: FC = () => {
  const { treeId, hatId, address } = useParams();
  const navigate = useNavigate();
  const { wallet } = useActiveWallet();
  const me = wallet?.account?.address?.toLowerCase();
  const isMe = !!me && me === address?.toLowerCase();

  const tree = useTreeInfo(Number(treeId));
  const hat = useMemo(() => {
    if (!tree?.hats) return;
    return tree.hats.find((h) => h.id === hatId);
  }, [tree, hatId]);
  const detail = useHatDetail(hat?.details);
  const dutyName = detail?.data?.name ?? "当番";
  const imageUrl = ipfs2https(hat?.imageUri);

  // ── HatsTimeFrameModule (active / wore time / renounce) ────
  const { data: workspaceData } = useGetWorkspace({
    workspaceId: treeId || "",
  });
  const hatsTimeFrameModuleAddress = workspaceData?.workspace
    ?.hatsTimeFrameModule as Address | undefined;

  const { isActive, woreTime, wearingElapsedTime, refetch } = useActiveState(
    hatsTimeFrameModuleAddress,
    hatId,
    address,
  );

  // Contract also allows admins / wearers of the module's `minterHatId` to
  // pause / resume / renounce, not just the wearer themselves.
  const hasModuleAuthority = useHasAuthority(hatsTimeFrameModuleAddress, me);
  const canManage = isMe || hasModuleAuthority;

  const formattedWoreTime = useMemo(
    () => (woreTime ? dayjs.unix(woreTime).format("YYYY/MM/DD") : undefined),
    [woreTime],
  );
  const formattedDays = useMemo(
    () =>
      wearingElapsedTime ? Math.floor(wearingElapsedTime / 86400) : undefined,
    [wearingElapsedTime],
  );

  const { reactivate, isLoading: isReactivating } = useReactivate(
    hatsTimeFrameModuleAddress,
  );
  const { deactivate, isLoading: isDeactivating } = useDeactivate(
    hatsTimeFrameModuleAddress,
  );
  const { renounceHat, isLoading: isRenouncing } =
    useRenounceHatFromTimeFrameModule(hatsTimeFrameModuleAddress as Address);

  // ── Wearer name + avatar ───────────────────────────────────
  const addresses = useMemo(() => (address ? [address] : undefined), [address]);
  const { names: wearerNames } = useNamesByAddresses(addresses);
  const wearer = useMemo(() => wearerNames.flat()[0], [wearerNames]);
  const wearerName = wearer?.name ?? abbreviateAddress(address || "");
  const wearerAvatar = ipfs2https(wearer?.text_records?.avatar);

  // ── Holders for this (wearer, hat) shard ────────────────────
  const { data: balanceOfFractionTokens, refetch: refetchBalances } =
    useGetBalanceOfFractionTokens({
      where: {
        wearer: address?.toLowerCase(),
        hatId: BigInt(hatId || 0).toString(10),
      },
    });

  // Subgraph has zero balance entries only when `mintInitialSupply` has
  // never run for this (hat, wearer) shard — the contract always pushes
  // the wearer into `tokenRecipients` on initial mint.
  const notYetMinted =
    !!balanceOfFractionTokens &&
    balanceOfFractionTokens.balanceOfFractionTokens.length === 0;

  const { mintInitialSupplyFractionToken, isLoading: isInitialMinting } =
    useFractionToken(treeId || "");
  const holderAddresses = useMemo(
    () =>
      balanceOfFractionTokens?.balanceOfFractionTokens.map((d) =>
        d.owner.toLowerCase(),
      ) ?? [],
    [balanceOfFractionTokens],
  );
  const { names: holderNames } = useNamesByAddresses(holderAddresses);
  const holderDetails = useMemo(
    () =>
      holderNames.flat().map((n) => {
        const lower = n.address.toLowerCase();
        const balanceStr =
          balanceOfFractionTokens?.balanceOfFractionTokens.find(
            ({ owner }) => owner.toLowerCase() === lower,
          )?.balance;
        // FractionToken is ERC-1155 — balances are raw integer counts, not
        // 18-decimal wei. Do not formatEther here.
        const balance = balanceStr ? Number(balanceStr) : 0;
        return {
          address: lower,
          name: n.name ?? abbreviateAddress(lower),
          avatar: ipfs2https(n.text_records?.avatar),
          balance,
        };
      }),
    [balanceOfFractionTokens, holderNames],
  );

  // The logged-in user's holdings of THIS wearer's (hat, wearer) shard.
  // FractionToken is ERC-1155 — balances are raw integer counts, no
  // formatEther. Returns `undefined` whenever the value shouldn't be a
  // numeric "0": still loading, not logged in, or the shard hasn't been
  // minted yet (no balance entries at all). A real "0" only shows when
  // other people hold this shard but the current user doesn't.
  const ownBalance = useMemo<number | undefined>(() => {
    if (!me || !balanceOfFractionTokens) return undefined;
    const entries = balanceOfFractionTokens.balanceOfFractionTokens;
    if (entries.length === 0) return undefined;
    const mine = entries.find((b) => b.owner.toLowerCase() === me);
    if (!mine) return 0;
    return Number(mine.balance);
  }, [balanceOfFractionTokens, me]);

  const [sendSheetOpen, setSendSheetOpen] = useState(false);

  // Quests scoped to this (hatId, wearer) shard. The role-share tokenId is
  // keccak256(hatId, wearer), so each holder page filters by *both* — the
  // duty page (no wearer in the URL) shows the full hat's quests instead.
  const hatIdBig = useMemo(() => {
    if (!hatId) return undefined;
    try {
      return BigInt(hatId);
    } catch {
      return undefined;
    }
  }, [hatId]);
  const wearerLower = useMemo(() => address?.toLowerCase(), [address]);
  const { quests, isLoading: questsLoading } = useQuests(treeId, {
    first: 100,
  });
  const dutyQuests = useMemo(() => {
    if (hatIdBig === undefined || !wearerLower) return [];
    return quests.filter((q) => {
      // Subgraph returns hatId as a decimal-string BigInt. Compare numerically
      // so any leading-zero / hex-vs-decimal mismatch in the URL still matches.
      try {
        if (BigInt(q.hatId) !== hatIdBig) return false;
      } catch {
        return false;
      }
      return q.wearer.toLowerCase() === wearerLower;
    });
  }, [quests, hatIdBig, wearerLower]);

  // Care-point variant — three legacy workspaces show ケアポイント copy.
  const isCarePoint = ["144", "175", "780"].includes(treeId || "");
  const shareTitle = isCarePoint ? "ケアポイント" : "ロールシェア";

  // ロールシェアの保有率 — sort by balance desc, then map to percent of total.
  const shareItems = useMemo(() => {
    const total = holderDetails.reduce((acc, h) => acc + h.balance, 0);
    if (total <= 0) return [];
    const sorted = [...holderDetails].sort((a, b) => b.balance - a.balance);
    return sorted.map((h, i) => ({
      key: h.address,
      percent: (h.balance / total) * 100,
      color: SHARE_PALETTE[i % SHARE_PALETTE.length],
      leading: (
        <Avatar size="sm" className="size-6">
          {h.avatar && <AvatarImage src={h.avatar} alt="" />}
          <AvatarFallback seed={h.name} />
        </Avatar>
      ),
      label: h.name,
    }));
  }, [holderDetails]);

  const breadcrumbItems = [
    { label: "当番一覧", to: `/${treeId}/role` },
    { label: dutyName, to: `/${treeId}/${hatId}` },
    { label: wearerName },
  ];

  if (!hat) {
    return (
      <PageContainer className="pt-2 pb-8">
        <Breadcrumb className="mb-3 px-1" items={breadcrumbItems} />
        <Card className="mt-3 py-12 text-center">
          <Typography variant="bodySm" tone="secondary">
            担当者情報が見つかりませんでした
          </Typography>
        </Card>
      </PageContainer>
    );
  }

  const headerBlock = (
    <div className="flex items-center gap-3.5">
      <DutyIcon imageUrl={imageUrl} />
      <div className="min-w-0 flex-1">
        <Typography
          as="div"
          variant="caption"
          tone="secondary"
          truncate
          className="mb-0.5"
        >
          {dutyName}
        </Typography>
        <div className="flex items-center gap-2">
          <Avatar size="sm" className="size-6">
            {wearerAvatar && <AvatarImage src={wearerAvatar} alt="" />}
            <AvatarFallback seed={wearerName} />
          </Avatar>
          <Heading variant="h4" level={1} className="truncate">
            {wearerName}
          </Heading>
        </div>
        <Typography
          variant="micro"
          tone="secondary"
          as="div"
          className="mt-0.5"
        >
          {abbreviateAddress(address || "")}
        </Typography>
      </div>
      <Badge kind={isActive ? "lead" : "supporter"}>
        {isActive ? "アクティブ" : "休止中"}
      </Badge>
    </div>
  );

  const statsBlock = (
    <Card className="px-4 py-4">
      <div className="grid grid-cols-3 gap-3">
        <Stat label="活動開始日" value={formattedWoreTime ?? "—"} />
        <Stat
          label="総活動日数"
          value={formattedDays !== undefined ? `${formattedDays}日` : "—"}
        />
        <Stat
          label={`あなたの${shareTitle}`}
          value={ownBalance !== undefined ? ownBalance.toLocaleString() : "—"}
        />
      </div>
    </Card>
  );

  const sendButton =
    me && !notYetMinted ? (
      <Button variant="secondary" full onClick={() => setSendSheetOpen(true)}>
        <Icon name="send" size={16} />
        {shareTitle}を送る
      </Button>
    ) : null;

  const initialMintButton =
    isMe && notYetMinted ? (
      <Button
        variant="primary"
        full
        disabled={isInitialMinting}
        onClick={async () => {
          if (!hatId || !address) return;
          try {
            await mintInitialSupplyFractionToken({
              hatId: BigInt(hatId),
              account: address as Address,
            });
            await refetchBalances();
            toast.success(`${shareTitle}を初期発行しました`);
          } catch (error) {
            console.error(error);
            toast.error("初期発行に失敗しました");
          }
        }}
      >
        {isInitialMinting ? "初期発行中…" : `${shareTitle}を初期発行する`}
      </Button>
    ) : null;

  const shareDistributionBlock = (
    <section className="flex flex-col gap-2">
      <SectionLabel className="px-0">{shareTitle}の保有率</SectionLabel>
      <Card className="px-4 py-4">
        <ShareDistribution
          items={shareItems}
          emptyLabel="シェアはまだ配布されていません"
        />
      </Card>
    </section>
  );

  const authorizedActionsBlock =
    canManage && hatsTimeFrameModuleAddress ? (
      <div className="flex flex-col gap-2 pt-2">
        {isActive ? (
          <Button
            variant="secondary"
            full
            disabled={isDeactivating}
            onClick={async () => {
              if (!hatId || !address) return;
              try {
                await deactivate(hatId, address);
                await refetch();
                toast.success("一時休止しました");
              } catch (error) {
                console.error(error);
                toast.error("一時休止に失敗しました");
              }
            }}
          >
            {isDeactivating ? "一時休止中…" : "一時休止"}
          </Button>
        ) : (
          <Button
            variant="primary"
            full
            disabled={isReactivating}
            onClick={async () => {
              if (!hatId || !address) return;
              try {
                await reactivate(hatId, address);
                await refetch();
                toast.success("当番を再開しました");
              } catch (error) {
                console.error(error);
                toast.error("再開に失敗しました");
              }
            }}
          >
            {isReactivating ? "再開中…" : "再開する"}
          </Button>
        )}
        <Button
          variant="danger"
          full
          disabled={isRenouncing}
          onClick={async () => {
            if (!hatId || !address) return;
            try {
              await renounceHat(BigInt(hatId), address as Address);
            } catch (error) {
              console.error(error);
              return;
            }
            navigate(`/${treeId}/${hatId}`);
          }}
        >
          {isRenouncing ? "剥奪中…" : "当番を剥奪"}
        </Button>
      </div>
    ) : null;

  const questBlock = (
    <QuestPanel
      quests={dutyQuests}
      loading={questsLoading}
      treeId={treeId}
      hatId={hatId}
      wearerAddress={address}
      canCreate={ownBalance !== undefined && ownBalance > 0}
    />
  );

  return (
    <>
      <PageContainer className="pt-2 pb-10">
        <Breadcrumb className="mb-3 px-1" items={breadcrumbItems} />

        {/* Mobile: single column */}
        <div className="md:hidden flex flex-col gap-4 px-1 pt-1">
          {headerBlock}
          {statsBlock}
          {initialMintButton}
          {sendButton}
          {shareDistributionBlock}
          {questBlock}
          {authorizedActionsBlock}
        </div>

        {/* Desktop: 60/40 split — quests live on the side panel */}
        <div className="hidden md:grid grid-cols-[3fr_2fr] gap-6 pt-2">
          <div className="flex flex-col gap-4 min-w-0">
            {headerBlock}
            {statsBlock}
            {initialMintButton}
            {sendButton}
            {shareDistributionBlock}
            {authorizedActionsBlock}
          </div>
          <aside className="flex flex-col gap-4">{questBlock}</aside>
        </div>
      </PageContainer>

      {treeId && hatId && address && (
        <AssistCreditSendSheet
          open={sendSheetOpen}
          onOpenChange={setSendSheetOpen}
          treeId={treeId}
          hatId={BigInt(hatId)}
          wearer={address as Address}
        />
      )}
    </>
  );
};

export default HolderDetail;

const DutyIcon: FC<{ imageUrl?: string }> = ({ imageUrl }) => (
  <div
    className={cn(
      "flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-md bg-[#F2EAD9]",
    )}
  >
    {imageUrl ? (
      <img src={imageUrl} alt="" className="size-full object-cover" />
    ) : (
      <Icon name="duty" size={28} className="text-[#7A5A2E]" />
    )}
  </div>
);

const Stat: FC<{ label: React.ReactNode; value: React.ReactNode }> = ({
  label,
  value,
}) => (
  <div className="flex flex-col gap-1">
    <Typography variant="micro" tone="secondary" as="span" weight="semibold">
      {label}
    </Typography>
    <Typography variant="bodySm" as="span" weight="bold">
      {value}
    </Typography>
  </div>
);
