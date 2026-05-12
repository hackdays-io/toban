import type { Split } from "@0xsplits/splits-sdk";
import { useQuery } from "@tanstack/react-query";
import { SPLITS_CREATOR_ABI } from "abi/splits";
import dayjs from "dayjs";
import { useCopyToClipboard } from "hooks/useCopyToClipboard";
import { useNamesByAddresses } from "hooks/useENS";
import {
  useSplit,
  useSplitsCreatorRelatedSplits,
} from "hooks/useSplitsCreator";
import { alchemyPublicClient, currentChain, publicClient } from "hooks/useViem";
import { useGetWorkspace } from "hooks/useWorkspace";
import type { NameData } from "namestone-sdk";
import { type FC, useMemo } from "react";
import { useNavigate, useParams } from "react-router";
import { toast } from "sonner";
import { ipfs2https } from "utils/ipfs";
import { abbreviateAddress } from "utils/wallet";
import { type Address, decodeFunctionData } from "viem";
import { Breadcrumb } from "~/components/composite/breadcrumb";
import { Divider } from "~/components/composite/divider";
import {
  DONUT_PALETTE,
  DonutChart,
  type DonutSlice,
} from "~/components/composite/donut-chart";
import { SectionLabel } from "~/components/composite/section-label";
import { WeightBar } from "~/components/composite/weight-bar";
import { PageContainer } from "~/components/layout/PageContainer";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import { Heading } from "~/components/ui/heading";
import { Icon } from "~/components/ui/icon";
import { Typography } from "~/components/ui/typography";
import { cn } from "~/lib/utils";

interface ConsolidatedRecipients {
  list: { address: string; ownership: number }[];
  totalOwnership: number;
}

const consolidateRecipients = (
  split: Split | undefined,
): ConsolidatedRecipients => {
  if (!split) return { list: [], totalOwnership: 0 };
  const totals = new Map<string, number>();
  let total = 0;
  for (const r of split.recipients) {
    const addr = r.recipient.address.toLowerCase();
    const value = Number(r.ownership);
    totals.set(addr, (totals.get(addr) ?? 0) + value);
    total += value;
  }
  return {
    list: Array.from(totals.entries())
      .map(([address, ownership]) => ({ address, ownership }))
      .sort((a, b) => b.ownership - a.ownership),
    totalOwnership: total,
  };
};

interface WeightInfo {
  roleWeight: number;
  thanksTokenWeight: number;
  thanksTokenReceivedWeight: number;
  thanksTokenSentWeight: number;
}

// The Toban subgraph doesn't index split creation weights — they exist only as
// `create()` calldata. We recover them by finding the `SplitsCreated` log that
// matches this split's address (around `createdBlock`) and decoding the
// originating transaction's input. We hit the Alchemy-only client directly
// because the fallback `publicClient` rotates through a bare `http()` default
// RPC first and that endpoint is unreliable for `getLogs` — every flake there
// surfaced as "ルール情報を取得できませんでした" on the screen. Cached
// indefinitely by split address since weights are immutable post-creation.
const useSplitWeights = (
  splitsCreatorAddress: Address | undefined,
  split: Split | undefined,
) => {
  return useQuery({
    queryKey: ["split-weights", splitsCreatorAddress, split?.address],
    enabled: !!splitsCreatorAddress && !!split,
    staleTime: Number.POSITIVE_INFINITY,
    retry: 3,
    retryDelay: (attempt) => Math.min(2000, 300 * 2 ** attempt),
    queryFn: async (): Promise<WeightInfo | null> => {
      if (!splitsCreatorAddress || !split) return null;
      const splitAddrLower = split.address.toLowerCase();
      const created = BigInt(split.createdBlock);
      const logs = await alchemyPublicClient.getContractEvents({
        address: splitsCreatorAddress,
        abi: SPLITS_CREATOR_ABI,
        eventName: "SplitsCreated",
        fromBlock: created,
        toBlock: created,
      });
      const log = logs.find(
        (l) => l.args.split?.toLowerCase() === splitAddrLower,
      );
      if (!log) return null;
      const tx = await alchemyPublicClient.getTransaction({
        hash: log.transactionHash,
      });
      const decoded = decodeFunctionData({
        abi: SPLITS_CREATOR_ABI,
        data: tx.input,
      });
      if (decoded.functionName !== "create") return null;
      const weights = decoded.args?.[1] as
        | {
            roleWeight: bigint;
            thanksTokenWeight: bigint;
            thanksTokenReceivedWeight: bigint;
            thanksTokenSentWeight: bigint;
          }
        | undefined;
      if (!weights) return null;
      return {
        roleWeight: Number(weights.roleWeight),
        thanksTokenWeight: Number(weights.thanksTokenWeight),
        thanksTokenReceivedWeight: Number(weights.thanksTokenReceivedWeight),
        thanksTokenSentWeight: Number(weights.thanksTokenSentWeight),
      };
    },
  });
};

const SplitDetailPage: FC = () => {
  const { treeId, splitId } = useParams();
  const navigate = useNavigate();

  const { data: workspaceData } = useGetWorkspace({
    workspaceId: treeId || "",
  });
  const splitsCreatorAddress = workspaceData?.workspace?.splitCreator as
    | Address
    | undefined;

  const { splits, isLoading } =
    useSplitsCreatorRelatedSplits(splitsCreatorAddress);
  const split = useMemo(() => {
    if (!splitId) return undefined;
    return splits.find(
      (s) => s.address.toLowerCase() === splitId.toLowerCase(),
    );
  }, [splits, splitId]);

  const recipients = useMemo(() => consolidateRecipients(split), [split]);

  // Resolve names for split + recipients in a single Namestone batch.
  const splitAddrArray = useMemo(() => (split ? [split.address] : []), [split]);
  const recipientAddresses = useMemo(
    () => recipients.list.map((r) => r.address),
    [recipients],
  );
  const { names: splitNames } = useNamesByAddresses(splitAddrArray);
  const { names: recipientNames } = useNamesByAddresses(recipientAddresses);

  const splitEnsEntry = splitNames[0]?.[0];
  const displayName = splitEnsEntry?.name
    ? `${splitEnsEntry.name}.${splitEnsEntry.domain}`
    : split
      ? abbreviateAddress(split.address)
      : "";
  const ensFullName = splitEnsEntry?.name
    ? `${splitEnsEntry.name}.${splitEnsEntry.domain}`
    : undefined;

  const recipientNameByAddress = useMemo(() => {
    const m = new Map<string, NameData>();
    for (const group of recipientNames) {
      const entry = group[0];
      if (entry?.address) m.set(entry.address.toLowerCase(), entry);
    }
    return m;
  }, [recipientNames]);

  const createdAtSec = useQuery({
    queryKey: ["split-block", split?.createdBlock],
    enabled: !!split,
    staleTime: Number.POSITIVE_INFINITY,
    queryFn: async () => {
      if (!split) return undefined;
      const block = await publicClient.getBlock({
        blockNumber: BigInt(split.createdBlock),
      });
      return Number(block.timestamp);
    },
  });
  const createdAt = createdAtSec.data
    ? dayjs(createdAtSec.data * 1000).format("YYYY/MM/DD")
    : undefined;

  const weightsQuery = useSplitWeights(splitsCreatorAddress, split);
  const weights = weightsQuery.data;

  // SplitDetail (legacy) handles claimable balances + external splits.org
  // links. We surface the latter directly here too.
  const splitEarnings = useSplit(split?.address as Address | undefined);

  const slices = useMemo<DonutSlice[]>(
    () =>
      recipients.list.map((r) => ({
        key: r.address,
        percent:
          recipients.totalOwnership > 0
            ? (r.ownership / recipients.totalOwnership) * 100
            : 0,
      })),
    [recipients],
  );

  const ranking = useMemo(() => {
    if (recipients.totalOwnership === 0) return [];
    return recipients.list.map((r, i) => {
      const pct = (r.ownership / recipients.totalOwnership) * 100;
      const entry = recipientNameByAddress.get(r.address.toLowerCase());
      const name = entry?.name ?? abbreviateAddress(r.address as `0x${string}`);
      const avatarUrl = ipfs2https(entry?.text_records?.avatar);
      const color = DONUT_PALETTE[i % DONUT_PALETTE.length];
      return {
        address: r.address,
        name,
        avatarUrl,
        pct,
        color,
      };
    });
  }, [recipients, recipientNameByAddress]);

  const goBack = () => navigate(`/${treeId}/splits`);

  if (!split && !isLoading) {
    return (
      <PageContainer className="pt-4 pb-8">
        <Breadcrumb
          className="mb-3 px-1"
          items={[
            { label: "分配", to: `/${treeId}/splits` },
            { label: "分配詳細" },
          ]}
        />
        <Card className="py-12 text-center">
          <Typography variant="bodySm" tone="secondary">
            分配ルールが見つかりませんでした
          </Typography>
          <div className="mt-4 flex justify-center">
            <Button variant="secondary" onClick={goBack}>
              一覧へ戻る
            </Button>
          </div>
        </Card>
      </PageContainer>
    );
  }

  return (
    <PageContainer className="pt-2 pb-10 md:pt-4">
      <Breadcrumb
        className="mb-3 px-1"
        items={[
          { label: "分配", to: `/${treeId}/splits` },
          { label: displayName || "分配詳細" },
        ]}
      />

      {/* Mobile / single column. */}
      <div className="flex flex-col gap-4 px-1 md:hidden">
        <header className="flex flex-col gap-1.5">
          <div className="flex items-center gap-1.5">
            <Heading variant="h3" level={1} className="min-w-0 truncate">
              {displayName || "分配詳細"}
            </Heading>
            {ensFullName && (
              <CopyIconButton label="ENS名" value={ensFullName} />
            )}
          </div>
          {split?.address && <AddressRow address={split.address} />}
          <Typography variant="caption" tone="secondary">
            {createdAt && `作成日: ${createdAt}`}
            {createdAt && " ・ "}
            対象 {recipients.list.length}人
          </Typography>
        </header>

        <div className="grid grid-cols-2 gap-3">
          <DonutSummaryCard
            slices={slices}
            recipientCount={recipients.list.length}
          />
          <RuleCard weights={weights} loading={weightsQuery.isLoading} />
        </div>

        <section className="flex flex-col gap-2">
          <SectionLabel className="px-0">分配結果</SectionLabel>
          <Card className="gap-0 p-0">
            {ranking.length === 0 ? (
              <Typography
                variant="bodySm"
                tone="secondary"
                className="px-4 py-6 text-center"
              >
                分配先がありません
              </Typography>
            ) : (
              ranking.map((row, i) => (
                <div key={row.address}>
                  <RankRow row={row} rank={i + 1} />
                  {i < ranking.length - 1 && <Divider inset={16} />}
                </div>
              ))
            )}
          </Card>
        </section>

        <ClaimableBalancesCard
          balances={splitEarnings.splitEarnings.data?.activeBalances}
          isDistributing={splitEarnings.isDistributing}
          onDistribute={(tokenAddress) =>
            splitEarnings.distribute(tokenAddress as Address)
          }
        />

        <div className="pt-2">
          <Button asChild variant="secondary" full>
            <a
              href={`https://app.splits.org/accounts/${split?.address}/?chainId=${currentChain.id}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              Splits.org で開く
            </a>
          </Button>
        </div>
      </div>

      {/* Desktop layout — 2/3 main + 1/3 side. */}
      <div className="hidden grid-cols-[2fr_1fr] gap-6 pt-2 md:grid">
        <div className="flex min-w-0 flex-col gap-5">
          <header className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <Heading variant="h2" level={1} className="min-w-0 truncate">
                {displayName || "分配詳細"}
              </Heading>
              {ensFullName && (
                <CopyIconButton label="ENS名" value={ensFullName} />
              )}
            </div>
            {split?.address && <AddressRow address={split.address} />}
            <Typography variant="bodySm" tone="secondary">
              合計 100% ・ 対象 {recipients.list.length}人
              {createdAt && ` ・ 作成日 ${createdAt}`}
            </Typography>
          </header>

          <div className="grid grid-cols-2 gap-4 items-stretch">
            <DonutSummaryCard
              slices={slices}
              recipientCount={recipients.list.length}
            />
            <RuleCard weights={weights} loading={weightsQuery.isLoading} />
          </div>

          <section className="flex flex-col gap-2">
            <SectionLabel className="px-0">分配結果</SectionLabel>
            <Card className="gap-0 p-0">
              {ranking.length === 0 ? (
                <Typography
                  variant="bodySm"
                  tone="secondary"
                  className="px-4 py-6 text-center"
                >
                  分配先がありません
                </Typography>
              ) : (
                ranking.map((row, i) => (
                  <div key={row.address}>
                    <RankRow row={row} rank={i + 1} />
                    {i < ranking.length - 1 && <Divider inset={16} />}
                  </div>
                ))
              )}
            </Card>
          </section>
        </div>

        <aside className="flex flex-col gap-4">
          <ClaimableBalancesCard
            balances={splitEarnings.splitEarnings.data?.activeBalances}
            isDistributing={splitEarnings.isDistributing}
            onDistribute={(tokenAddress) =>
              splitEarnings.distribute(tokenAddress as Address)
            }
          />
          <Button asChild variant="secondary">
            <a
              href={`https://app.splits.org/accounts/${split?.address}/?chainId=${currentChain.id}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              Splits.org で開く
            </a>
          </Button>
        </aside>
      </div>
    </PageContainer>
  );
};

export default SplitDetailPage;

// ─── DonutSummaryCard ──────────────────────────────────────────────────────

interface DonutSummaryCardProps {
  slices: DonutSlice[];
  recipientCount: number;
}

const DonutSummaryCard: FC<DonutSummaryCardProps> = ({
  slices,
  recipientCount,
}) => (
  <Card className="h-full items-center justify-center px-5 py-5">
    <DonutChart
      slices={slices}
      size={140}
      center={
        <>
          <span className="text-[28px] font-extrabold leading-none tabular-nums">
            {recipientCount}
          </span>
          <span className="mt-0.5 text-[11px] font-bold text-text-secondary">
            人
          </span>
        </>
      }
    />
  </Card>
);

// ─── RankRow ───────────────────────────────────────────────────────────────

interface RankRowProps {
  row: {
    address: string;
    name: string;
    avatarUrl?: string;
    pct: number;
    color: string;
  };
  rank: number;
}

// Bar width is the recipient's percentage of the whole (0-100). Earlier this
// was scaled to the top recipient so the leader always showed a full bar; the
// design wants an absolute scale so reading "30%" matches a bar a third full.
const RankRow: FC<RankRowProps> = ({ row, rank }) => (
  <div className="flex items-center gap-3 px-4 py-3">
    <Typography
      as="span"
      variant="caption"
      weight="bold"
      tone="secondary"
      className="w-6 shrink-0"
    >
      {rank}
    </Typography>
    <Avatar size="default" className="size-8">
      {row.avatarUrl && <AvatarImage src={row.avatarUrl} alt="" />}
      <AvatarFallback seed={row.name} />
    </Avatar>
    <Typography
      as="div"
      variant="bodySm"
      weight="semibold"
      truncate
      className="min-w-0 flex-1"
    >
      {row.name}
    </Typography>
    <div className="hidden h-1.5 w-20 overflow-hidden rounded-xs bg-[#F0EBE0] sm:block">
      <div
        className="h-full"
        style={{
          width: `${Math.max(0, Math.min(100, row.pct))}%`,
          backgroundColor: row.color,
        }}
      />
    </div>
    <Typography
      as="span"
      variant="bodySm"
      weight="bold"
      className="w-14 shrink-0 text-right tabular-nums"
    >
      {row.pct.toFixed(2)}%
    </Typography>
  </div>
);

// ─── RuleCard ──────────────────────────────────────────────────────────────

interface RuleCardProps {
  weights?: WeightInfo | null;
  loading: boolean;
}

const RuleCard: FC<RuleCardProps> = ({ weights, loading }) => {
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

// ─── AddressRow / CopyIconButton ───────────────────────────────────────────
//
// `AddressRow` shows the full contract address as a single tappable mono-text
// row that copies the address. The ENS sits next to the title as an icon-only
// button (`CopyIconButton`) so it doesn't fight the address line for space.
// Together they replace the old foldable "技術情報" card — the chain identity
// is now always visible.

interface AddressRowProps {
  address: string;
}

const AddressRow: FC<AddressRowProps> = ({ address }) => {
  const { copyToClipboardAction } = useCopyToClipboard(address);
  const onCopy = () => {
    copyToClipboardAction().then(
      () => toast.success("アドレスをコピーしました"),
      () => toast.error("コピーに失敗しました"),
    );
  };
  return (
    <button
      type="button"
      onClick={onCopy}
      className="group inline-flex max-w-full items-center gap-1.5 rounded-sm text-text-secondary transition-colors hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
      aria-label="アドレスをコピー"
    >
      <Typography
        as="span"
        variant="micro"
        truncate
        className="min-w-0 font-mono"
      >
        {address}
      </Typography>
      <Icon
        name="copy"
        size={12}
        className="shrink-0 opacity-70 transition-opacity group-hover:opacity-100"
      />
    </button>
  );
};

interface CopyIconButtonProps {
  /** Used in the aria label + success toast (e.g. "ENS名"). */
  label: string;
  value: string;
  /** Optional click handler to stop propagation when nested in a clickable parent. */
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
}

const CopyIconButton: FC<CopyIconButtonProps> = ({ label, value, onClick }) => {
  const { copyToClipboardAction } = useCopyToClipboard(value);
  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    onClick?.(event);
    copyToClipboardAction().then(
      () => toast.success(`${label}をコピーしました`),
      () => toast.error("コピーに失敗しました"),
    );
  };
  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={`${label}をコピー`}
      className="inline-flex size-7 shrink-0 items-center justify-center rounded-full text-text-secondary transition-colors hover:bg-bg hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
    >
      <Icon name="copy" size={14} />
    </button>
  );
};

// ─── ClaimableBalancesCard ─────────────────────────────────────────────────

interface ClaimableBalancesCardProps {
  balances?: Record<
    string,
    { formattedAmount: string; symbol: string } | undefined
  >;
  isDistributing: boolean;
  onDistribute: (tokenAddress: string) => void;
}

// Splits SDK's `formattedAmount` is already a precise decimal string
// (`viem.formatUnits`). The earlier code did `Number(...).toFixed(4)` which
// silently lost precision for large balances and *rounded* — drifting from
// splits.org. We keep the string intact and truncate (never round) the
// fractional tail to `maxDecimals` places so the displayed value matches
// what splits.org shows.
const formatTokenAmount = (formatted: string, maxDecimals = 4): string => {
  if (!formatted.includes(".")) return formatted;
  const [whole, fracRaw = ""] = formatted.split(".");
  if (maxDecimals <= 0) return whole;
  const capped = fracRaw.slice(0, maxDecimals);
  return capped ? `${whole}.${capped}` : whole;
};

const ClaimableBalancesCard: FC<ClaimableBalancesCardProps> = ({
  balances,
  isDistributing,
  onDistribute,
}) => {
  const rows = useMemo(() => {
    if (!balances) return [];
    return Object.entries(balances).filter(
      ([, b]) => b && Number(b.formattedAmount) > 0,
    ) as [string, { formattedAmount: string; symbol: string }][];
  }, [balances]);

  if (rows.length === 0) return null;

  return (
    <Card className="gap-3 border-primary/30 bg-primary-soft/40 px-4 py-4">
      <Typography as="div" variant="bodySm" weight="bold">
        未分配のポイント
      </Typography>
      <ul className="flex flex-col gap-2">
        {rows.map(([tokenAddress, b]) => (
          <li
            key={tokenAddress}
            className="flex items-center justify-between gap-2"
          >
            <Typography as="span" variant="bodySm" className="tabular-nums">
              {formatTokenAmount(b.formattedAmount)} {b.symbol}
            </Typography>
            <Button
              size="sm"
              variant="primary"
              disabled={isDistributing}
              onClick={() => onDistribute(tokenAddress)}
            >
              分配する
            </Button>
          </li>
        ))}
      </ul>
    </Card>
  );
};
