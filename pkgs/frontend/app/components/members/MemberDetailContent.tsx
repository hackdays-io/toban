import type { Hat, Tree } from "@hatsprotocol/sdk-v1-subgraph";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { MintThanksToken_OrderBy, OrderDirection } from "gql/graphql";
import { useIdentity } from "hooks/useENS";
import { useGetBalanceOfFractionTokens } from "hooks/useFractionToken";
import { useGetMintThanksTokens } from "hooks/useThanksToken";
import { useActiveWallet } from "hooks/useWallet";
import { type FC, useMemo, useState } from "react";
import { Link } from "react-router";
import type { HatsDetailSchama } from "types/hats";
import { ipfs2https } from "utils/ipfs";
import { abbreviateAddress } from "utils/wallet";
import { formatEther } from "viem";
import { Divider } from "~/components/composite/divider";
import { Row } from "~/components/composite/row";
import { SectionLabel } from "~/components/composite/section-label";
import { StatCard } from "~/components/composite/stat-card";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import { Heading } from "~/components/ui/heading";
import { Icon } from "~/components/ui/icon";
import { Typography } from "~/components/ui/typography";
import { MemberProfileEditDialog } from "./MemberProfileEditDialog";

// IPFS-backed Hat metadata. Shares the `["hats-detail", url]` cache key with
// the rest of the app so bouncing between duty screens doesn't refetch.
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

type MemberRole = "lead" | "supporter" | "member";

const ROLE_LABEL: Record<MemberRole, string> = {
  lead: "当番リード",
  supporter: "サポーター",
  member: "メンバー",
};

interface MemberDetailContentProps {
  treeId: string;
  address: string;
  /** Workspace tree — owned by the parent route so it isn't refetched here. */
  tree: Tree | undefined;
  /** Semantic level for the member name heading — `1` on the detail route,
   * `2` when embedded in the member list's desktop pane. */
  nameLevel?: 1 | 2 | 3;
}

// Shared member-detail body: profile header, stat cards, involved duties and
// the send-thanks CTA. Reused by the member detail route (#439) and the member
// list's desktop master-detail pane (#438).
export const MemberDetailContent: FC<MemberDetailContentProps> = ({
  treeId,
  address,
  tree,
  nameLevel = 1,
}) => {
  const lowerAddress = address.toLowerCase();
  const { wallet } = useActiveWallet();
  const isMe = wallet?.account?.address?.toLowerCase() === lowerAddress;
  const { identity } = useIdentity(address);
  const [editOpen, setEditOpen] = useState(false);

  // Duty hats (role branch, level >= 2) this member wears.
  const dutyHats = useMemo(
    () => tree?.hats?.filter((h) => Number(h.levelAtLocalTree) >= 2) ?? [],
    [tree],
  );
  const wearerHats = useMemo(
    () =>
      dutyHats.filter((h) =>
        h.wearers?.some((w) => w.id?.toLowerCase() === lowerAddress),
      ),
    [dutyHats, lowerAddress],
  );

  // FractionToken balances — workspace-wide query (Apollo-cached, shared with
  // the member list), filtered down to this member.
  const { data: balanceData } = useGetBalanceOfFractionTokens({
    where: { workspaceId: treeId },
    first: 1000,
  });
  const myBalances = useMemo(() => {
    if (!balanceData) return [];
    return balanceData.balanceOfFractionTokens.filter(
      (b) => b.owner.toLowerCase() === lowerAddress && Number(b.balance) > 0,
    );
  }, [balanceData, lowerAddress]);

  // FractionToken is ERC-1155 — balances are raw integer counts, no formatEther.
  const totalShare = useMemo(
    () => myBalances.reduce((acc, b) => acc + Number(b.balance), 0),
    [myBalances],
  );

  // Duty hats this member supports (holds a share in) but does not wear.
  const wearerHatIds = useMemo(
    () => new Set(wearerHats.map((h) => h.id.toLowerCase())),
    [wearerHats],
  );
  const supporterHats = useMemo(() => {
    const hexIds = new Set<string>();
    for (const b of myBalances) {
      try {
        hexIds.add(`0x${BigInt(b.hatId).toString(16).padStart(64, "0")}`);
      } catch {
        // ignore unparseable hat ids
      }
    }
    return dutyHats.filter(
      (h) =>
        hexIds.has(h.id.toLowerCase()) && !wearerHatIds.has(h.id.toLowerCase()),
    );
  }, [myBalances, dutyHats, wearerHatIds]);

  // Received ThanksToken — `amount` is 18-decimal wei; sum then format.
  const { data: receivedThanks } = useGetMintThanksTokens({
    where: { workspaceId: treeId, to: lowerAddress },
    orderBy: MintThanksToken_OrderBy.BlockTimestamp,
    orderDirection: OrderDirection.Desc,
    first: 1000,
  });
  const receivedThx = useMemo(() => {
    let total = 0n;
    for (const m of receivedThanks?.mintThanksTokens ?? []) {
      try {
        total += BigInt(m.amount);
      } catch {
        // ignore unparseable amounts
      }
    }
    return Math.floor(Number(formatEther(total)));
  }, [receivedThanks]);

  const role: MemberRole =
    wearerHats.length > 0
      ? "lead"
      : supporterHats.length > 0
        ? "supporter"
        : "member";

  const displayName =
    identity?.name ?? abbreviateAddress(address as `0x${string}`);
  const avatarUrl = ipfs2https(identity?.text_records?.avatar);
  const bio = identity?.text_records?.description;

  const involved = useMemo(
    () => [
      ...wearerHats.map((hat) => ({ hat, label: "担当者" })),
      ...supporterHats.map((hat) => ({ hat, label: "サポーター" })),
    ],
    [wearerHats, supporterHats],
  );

  return (
    <div className="flex flex-col gap-5">
      {/* Profile header */}
      <div className="flex flex-col items-center gap-2.5 text-center">
        <Avatar size="xl" className="size-21">
          {avatarUrl && <AvatarImage src={avatarUrl} alt={displayName} />}
          <AvatarFallback seed={displayName} />
        </Avatar>
        <div className="flex flex-col items-center gap-1">
          <Heading variant="h3" level={nameLevel}>
            {displayName}
          </Heading>
          <Typography as="span" variant="mono" tone="secondary">
            {abbreviateAddress(address as `0x${string}`)}
          </Typography>
          <Badge kind={role} className="mt-1">
            {ROLE_LABEL[role]}
          </Badge>
        </div>
        {bio && (
          <Typography
            variant="bodySm"
            tone="secondary"
            className="mt-1 max-w-md leading-relaxed"
          >
            {bio}
          </Typography>
        )}
        {isMe && (
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => setEditOpen(true)}
            className="mt-1"
          >
            <Icon name="edit" size={14} />
            プロフィールを編集
          </Button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-2.5">
        <StatCard
          label="受け取ったサンクス"
          value={receivedThx.toLocaleString()}
          unit="THX"
        />
        <StatCard
          label="保有ロールシェア"
          value={totalShare.toLocaleString()}
        />
      </div>

      {/* Involved duties */}
      <div>
        <SectionLabel className="mb-2 px-1">関わっている当番</SectionLabel>
        {involved.length === 0 ? (
          <Card className="py-8 text-center">
            <Typography variant="bodySm" tone="secondary">
              関わっている当番はまだありません
            </Typography>
          </Card>
        ) : (
          <Card className="gap-0 overflow-hidden p-0">
            {involved.map((item, i) => (
              <div key={item.hat.id}>
                {i > 0 && <Divider inset={64} />}
                <InvolvedDutyRow
                  treeId={treeId}
                  hat={item.hat}
                  label={item.label}
                />
              </div>
            ))}
          </Card>
        )}
      </div>

      {/* Send-thanks CTA — you can't send thanks to yourself. */}
      {!isMe && (
        <Button asChild variant="primary" full>
          <Link to={`/${treeId}/thankstoken/send?to=${address}`}>
            <Icon name="send" size={16} />
            サンクスを送る
          </Link>
        </Button>
      )}

      {isMe && (
        <MemberProfileEditDialog
          open={editOpen}
          onOpenChange={setEditOpen}
          address={address}
          identity={identity}
        />
      )}
    </div>
  );
};

const InvolvedDutyRow: FC<{ treeId: string; hat: Hat; label: string }> = ({
  treeId,
  hat,
  label,
}) => {
  const detail = useHatDetail(hat.details);
  const imageUrl = ipfs2https(hat.imageUri);
  const name = detail?.data?.name ?? "当番";
  return (
    <Link to={`/${treeId}/${hat.id}`} className="block">
      <Row
        className="transition-colors hover:bg-bg"
        left={
          <div className="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-sm bg-[#F2EAD9]">
            {imageUrl ? (
              <img src={imageUrl} alt="" className="size-full object-cover" />
            ) : (
              <Icon name="duty" size={18} className="text-[#7A5A2E]" />
            )}
          </div>
        }
        title={name}
        subtitle={label}
        right={
          <Icon
            name="chevron-right"
            size={16}
            className="text-text-secondary"
          />
        }
      />
    </Link>
  );
};
