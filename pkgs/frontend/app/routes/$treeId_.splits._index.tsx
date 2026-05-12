import type { Split } from "@0xsplits/splits-sdk";
import { useQueries } from "@tanstack/react-query";
import dayjs from "dayjs";
import { useCopyToClipboard } from "hooks/useCopyToClipboard";
import { useNamesByAddresses } from "hooks/useENS";
import {
  useSplitsCreatorRelatedSplits,
  useUserEarnings,
} from "hooks/useSplitsCreator";
import { publicClient } from "hooks/useViem";
import { useGetWorkspace } from "hooks/useWorkspace";
import type { NameData } from "namestone-sdk";
import { type FC, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { toast } from "sonner";
import { abbreviateAddress } from "utils/wallet";
import type { Address } from "viem";
import {
  DONUT_PALETTE,
  DonutChart,
  type DonutSlice,
} from "~/components/composite/donut-chart";
import { EmptyState } from "~/components/composite/empty-state";
import { SectionLabel } from "~/components/composite/section-label";
import { MasterDetailLayout } from "~/components/layout/MasterDetailLayout";
import { PageContainer } from "~/components/layout/PageContainer";
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

const toSlices = (recipients: ConsolidatedRecipients): DonutSlice[] =>
  recipients.list.map((r) => ({
    key: r.address,
    percent:
      recipients.totalOwnership > 0
        ? (r.ownership / recipients.totalOwnership) * 100
        : 0,
  }));

const SplitsIndex: FC = () => {
  const { treeId } = useParams();
  const navigate = useNavigate();

  const { data } = useGetWorkspace({ workspaceId: treeId || "" });
  const splitCreatorAddress = data?.workspace?.splitCreator as
    | Address
    | undefined;

  const { splits, isLoading } =
    useSplitsCreatorRelatedSplits(splitCreatorAddress);

  // Newest first — matches the legacy ordering and the design's "最終更新"
  // expectation.
  const sortedSplits = useMemo(
    () =>
      splits
        .slice()
        .sort((a, b) => Number(b.createdBlock) - Number(a.createdBlock)),
    [splits],
  );

  // Resolve ENS-style names for each split's controller address — used as the
  // split name when present, abbreviated address otherwise.
  const splitsAddresses = useMemo(
    () => sortedSplits.map((s) => s.address),
    [sortedSplits],
  );
  const { names } = useNamesByAddresses(splitsAddresses);
  const nameByAddress = useMemo(() => {
    const m = new Map<string, NameData>();
    for (const group of names) {
      const entry = group[0];
      if (entry?.address) m.set(entry.address.toLowerCase(), entry);
    }
    return m;
  }, [names]);

  // Lookup the recipient ENS names so chips render with display names.
  const recipientAddresses = useMemo(() => {
    const set = new Set<string>();
    for (const s of sortedSplits) {
      for (const r of s.recipients) set.add(r.recipient.address.toLowerCase());
    }
    return Array.from(set);
  }, [sortedSplits]);
  const { names: recipientNames } = useNamesByAddresses(recipientAddresses);
  const recipientNameByAddress = useMemo(() => {
    const m = new Map<string, NameData>();
    for (const group of recipientNames) {
      const entry = group[0];
      if (entry?.address) m.set(entry.address.toLowerCase(), entry);
    }
    return m;
  }, [recipientNames]);

  // Fetch the createdBlock timestamps in parallel. publicClient.getBlock is
  // cached at the RPC level; React Query layers a stale-time on top so the
  // user-facing list doesn't refetch between navigations.
  const blockQueries = useQueries({
    queries: sortedSplits.map((s) => ({
      queryKey: ["split-block", s.createdBlock],
      queryFn: async () => {
        const block = await publicClient.getBlock({
          blockNumber: BigInt(s.createdBlock),
        });
        return Number(block.timestamp);
      },
      staleTime: Number.POSITIVE_INFINITY,
    })),
  });

  const items = useMemo(() => {
    return sortedSplits.map((split, i) => {
      const recipients = consolidateRecipients(split);
      const created = blockQueries[i]?.data;
      const ensEntry = nameByAddress.get(split.address.toLowerCase());
      const ensFullName = ensEntry?.name
        ? `${ensEntry.name}.${ensEntry.domain}`
        : undefined;
      const displayName = ensFullName ?? abbreviateAddress(split.address);
      return {
        split,
        recipients,
        displayName,
        ensFullName,
        recipientCount: recipients.list.length,
        createdAt: created
          ? dayjs(created * 1000).format("YYYY/MM/DD")
          : undefined,
      };
    });
  }, [sortedSplits, blockQueries, nameByAddress]);

  const userEarnings = useUserEarnings();
  const activeBalances = useMemo(() => {
    const balances = userEarnings.userEarnings.data?.activeBalances;
    if (!balances) return [];
    return Object.entries(balances).map(([address, balance]) => ({
      address,
      balance,
    }));
  }, [userEarnings.userEarnings.data]);

  const [selectedAddress, setSelectedAddress] = useState<string | undefined>();
  const selectedItem = useMemo(() => {
    if (selectedAddress) {
      const hit = items.find(
        (i) => i.split.address.toLowerCase() === selectedAddress.toLowerCase(),
      );
      if (hit) return hit;
    }
    return items[0];
  }, [items, selectedAddress]);

  const goToDetail = (addr: string) => navigate(`/${treeId}/splits/${addr}`);

  return (
    <>
      {/* Mobile / tablet layout. */}
      <PageContainer className="md:hidden pt-2 pb-10">
        <header className="mb-4 flex items-end justify-between gap-3 px-1">
          <div className="min-w-0">
            <Heading variant="h2" level={1}>
              分配
            </Heading>
            <Typography variant="bodySm" tone="secondary" className="mt-0.5">
              貢献記録から、納得できる分配へ
            </Typography>
          </div>
          <Button asChild size="sm" variant="primary" className="shrink-0">
            <Link to={`/${treeId}/splits/new`}>
              <Icon name="plus" size={16} />
              新規作成
            </Link>
          </Button>
        </header>

        {activeBalances.length > 0 && (
          <UnclaimedRewardsCard
            balances={activeBalances}
            onWithdraw={(addr) => userEarnings.withdraw(addr as Address)}
            isWithdrawing={userEarnings.isWithdrawing}
            className="mx-1 mb-4"
          />
        )}

        <SectionLabel className="px-1">分配ルール</SectionLabel>

        {isLoading && items.length === 0 ? (
          <Card className="mx-1 py-8 text-center">
            <Typography variant="bodySm" tone="secondary">
              読み込み中…
            </Typography>
          </Card>
        ) : items.length === 0 ? (
          <Card className="mx-1">
            <EmptyState
              icon={<Icon name="pie" size={26} />}
              title="まだ分配ルールはありません"
              body="貢献に応じた分配ルールを作成してみましょう。"
              action={
                <Button asChild variant="primary">
                  <Link to={`/${treeId}/splits/new`}>
                    <Icon name="plus" size={16} />
                    分配ルールを作成
                  </Link>
                </Button>
              }
            />
          </Card>
        ) : (
          <div className="flex flex-col gap-3 px-1">
            {items.map((item) => (
              <SplitListCard
                key={item.split.address}
                item={item}
                recipientNameByAddress={recipientNameByAddress}
                onClick={() => goToDetail(item.split.address)}
              />
            ))}
          </div>
        )}
      </PageContainer>

      {/* Desktop master-detail. */}
      <div className="hidden md:block">
        <MasterDetailLayout
          master={
            <div className="flex flex-col gap-3 p-4">
              <Button asChild variant="primary" full>
                <Link to={`/${treeId}/splits/new`}>
                  <Icon name="plus" size={16} />
                  新規作成
                </Link>
              </Button>
              {isLoading && items.length === 0 ? (
                <Typography
                  variant="bodySm"
                  tone="secondary"
                  className="px-2 py-4 text-center"
                >
                  読み込み中…
                </Typography>
              ) : items.length === 0 ? (
                <Typography
                  variant="bodySm"
                  tone="secondary"
                  className="px-2 py-4 text-center"
                >
                  分配ルールはまだありません
                </Typography>
              ) : (
                <ul className="flex flex-col gap-1.5">
                  {items.map((item) => (
                    <li key={item.split.address}>
                      <MasterRow
                        item={item}
                        selected={
                          item.split.address.toLowerCase() ===
                          selectedItem?.split.address.toLowerCase()
                        }
                        onClick={() => setSelectedAddress(item.split.address)}
                      />
                    </li>
                  ))}
                </ul>
              )}
            </div>
          }
          detail={
            <div className="flex flex-col gap-5">
              {activeBalances.length > 0 && (
                <UnclaimedRewardsCard
                  balances={activeBalances}
                  onWithdraw={(addr) => userEarnings.withdraw(addr as Address)}
                  isWithdrawing={userEarnings.isWithdrawing}
                />
              )}
              {selectedItem ? (
                <DesktopDetailPreview
                  item={selectedItem}
                  recipientNameByAddress={recipientNameByAddress}
                  treeId={treeId ?? ""}
                />
              ) : (
                <Card className="py-12 text-center">
                  <Typography variant="bodySm" tone="secondary">
                    分配ルールを選択してください
                  </Typography>
                </Card>
              )}
            </div>
          }
        />
      </div>
    </>
  );
};

export default SplitsIndex;

// ──────────────────────────── Sub-components ────────────────────────────

interface SplitListItem {
  split: Split;
  recipients: ConsolidatedRecipients;
  displayName: string;
  ensFullName?: string;
  recipientCount: number;
  createdAt?: string;
}

const labelFor = (
  address: string,
  byAddress: Map<string, NameData>,
): string => {
  const entry = byAddress.get(address.toLowerCase());
  return entry?.name ?? abbreviateAddress(address as `0x${string}`);
};

interface SplitListCardProps {
  item: SplitListItem;
  recipientNameByAddress: Map<string, NameData>;
  onClick: () => void;
}

// The mobile card wraps itself in a clickable div (not a button) so the
// in-card copy buttons can be real `<button>` elements — nesting buttons in
// HTML is invalid. The outer div carries the role + keyboard handling so the
// whole row still navigates on Enter/Space, matching the previous behaviour.
const SplitListCard: FC<SplitListCardProps> = ({
  item,
  recipientNameByAddress,
  onClick,
}) => {
  const topShares = useMemo(() => {
    if (item.recipients.totalOwnership === 0) return [];
    return item.recipients.list.slice(0, 3).map((r) => ({
      address: r.address,
      label: labelFor(r.address, recipientNameByAddress),
      pct: (r.ownership / item.recipients.totalOwnership) * 100,
    }));
  }, [item.recipients, recipientNameByAddress]);
  const extra = Math.max(0, item.recipients.list.length - topShares.length);
  const slices = useMemo(() => toSlices(item.recipients), [item.recipients]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onClick();
    }
  };

  return (
    // biome-ignore lint/a11y/useSemanticElements: a real <button> would forbid the nested copy buttons (invalid HTML); role=button + keyboard handler keeps it accessible.
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      aria-label={`${item.displayName} の分配詳細を開く`}
      className="cursor-pointer rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
    >
      <Card className="flex-row items-start gap-3.5 px-4 py-4 transition-colors hover:bg-bg">
        <DonutChart slices={slices} size={72} className="mt-0.5" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <Typography
              as="div"
              variant="bodySm"
              weight="bold"
              truncate
              className="min-w-0 text-[15px]"
            >
              {item.displayName}
            </Typography>
            {item.ensFullName && (
              <CopyIconButton
                label="ENS名"
                value={item.ensFullName}
                size="sm"
              />
            )}
          </div>
          <CopyableAddress address={item.split.address} />
          <Typography
            as="div"
            variant="caption"
            tone="secondary"
            className="mt-1"
          >
            {item.recipientCount}人に分配
            {item.createdAt && ` ・ 最終更新: ${item.createdAt}`}
          </Typography>
          {topShares.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {topShares.map((s) => (
                <span
                  key={s.address}
                  className="rounded-full bg-[#F0EBE0] px-2 py-0.5 text-[11px] font-semibold text-text-primary"
                >
                  {s.label} {s.pct.toFixed(1)}%
                </span>
              ))}
              {extra > 0 && (
                <Typography
                  as="span"
                  variant="micro"
                  tone="secondary"
                  className="self-center"
                >
                  +{extra}
                </Typography>
              )}
            </div>
          )}
        </div>
        <Icon
          name="chevron-right"
          size={18}
          className="mt-0.5 shrink-0 text-text-secondary"
        />
      </Card>
    </div>
  );
};

interface MasterRowProps {
  item: SplitListItem;
  selected: boolean;
  onClick: () => void;
}

const MasterRow: FC<MasterRowProps> = ({ item, selected, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className={cn(
      "flex w-full items-center gap-3 rounded-md border border-transparent p-3 text-left transition-colors hover:bg-surface",
      selected && "border-border bg-surface shadow-1",
    )}
  >
    <div className="flex size-9 shrink-0 items-center justify-center rounded-sm bg-[#E5F1FB] text-[#5DADEC]">
      <Icon name="split" size={18} />
    </div>
    <div className="min-w-0 flex-1">
      <Typography as="div" variant="bodySm" weight="bold" truncate>
        {item.displayName}
      </Typography>
      <Typography variant="micro" tone="secondary" as="div" truncate>
        {item.recipientCount}人に分配
        {item.createdAt && ` ・ ${item.createdAt}`}
      </Typography>
    </div>
  </button>
);

interface DesktopDetailPreviewProps {
  item: SplitListItem;
  recipientNameByAddress: Map<string, NameData>;
  treeId: string;
}

// Lightweight right-pane summary for the master-detail desktop view. The
// dedicated `/splits/$splitId` route owns the full detail surface (#441),
// so the preview links into that route for everything beyond the basics.
const DesktopDetailPreview: FC<DesktopDetailPreviewProps> = ({
  item,
  recipientNameByAddress,
  treeId,
}) => {
  const slices = useMemo(() => toSlices(item.recipients), [item.recipients]);
  const previewRows = useMemo(() => {
    if (item.recipients.totalOwnership === 0) return [];
    return item.recipients.list.slice(0, 5).map((r) => ({
      address: r.address,
      label: labelFor(r.address, recipientNameByAddress),
      pct: (r.ownership / item.recipients.totalOwnership) * 100,
    }));
  }, [item.recipients, recipientNameByAddress]);
  const extra = Math.max(0, item.recipients.list.length - previewRows.length);

  return (
    <Card className="gap-5 px-6 py-5">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <Heading variant="h3" level={2} className="min-w-0 truncate">
              {item.displayName}
            </Heading>
            {item.ensFullName && (
              <CopyIconButton label="ENS名" value={item.ensFullName} />
            )}
          </div>
          <CopyableAddress address={item.split.address} className="mt-1" />
          <Typography variant="bodySm" tone="secondary" className="mt-1">
            合計 100% ・ 対象 {item.recipientCount}人
            {item.createdAt && ` ・ 作成日 ${item.createdAt}`}
          </Typography>
        </div>
        <Button asChild variant="secondary" size="sm">
          <Link to={`/${treeId}/splits/${item.split.address}`}>
            詳細
            <Icon name="chevron-right" size={14} />
          </Link>
        </Button>
      </div>
      <div className="flex flex-wrap items-center gap-6">
        <DonutChart
          slices={slices}
          size={140}
          center={
            <>
              <span className="text-[26px] font-extrabold leading-none">
                {item.recipientCount}
              </span>
              <span className="mt-1 text-[10px] font-bold text-text-secondary">
                人
              </span>
            </>
          }
        />
        <ul className="flex min-w-[200px] flex-1 flex-col gap-1.5">
          {previewRows.map((r, i) => (
            <li key={r.address} className="flex items-center gap-2 text-[12px]">
              <span
                aria-hidden
                className="size-2.5 shrink-0 rounded-full"
                style={{
                  backgroundColor: slicesPaletteColor(i, slices, r.address),
                }}
              />
              <Typography
                as="span"
                variant="bodySm"
                truncate
                className="min-w-0 flex-1"
              >
                {r.label}
              </Typography>
              <Typography
                as="span"
                variant="bodySm"
                weight="bold"
                className="tabular-nums"
              >
                {r.pct.toFixed(1)}%
              </Typography>
            </li>
          ))}
          {extra > 0 && (
            <li>
              <Typography
                as="span"
                variant="micro"
                tone="secondary"
                className="mt-0.5"
              >
                +{extra}人
              </Typography>
            </li>
          )}
        </ul>
      </div>
    </Card>
  );
};

// Resolve the colour shown next to a legend row to match the DonutChart
// segment for the same slice. The palette wraps modulo `DONUT_PALETTE.length`,
// so we look up the slice index — falling back to the row index if the slice
// list is shorter (defensive; shouldn't trigger in practice).
const slicesPaletteColor = (
  index: number,
  slices: DonutSlice[],
  address: string,
): string => {
  const idx = slices.findIndex(
    (s) => s.key.toLowerCase() === address.toLowerCase(),
  );
  const i = idx >= 0 ? idx : index;
  return DONUT_PALETTE[i % DONUT_PALETTE.length];
};

interface UnclaimedRewardsCardProps {
  balances: {
    address: string;
    balance: { formattedAmount: string; symbol: string };
  }[];
  onWithdraw: (address: string) => void;
  isWithdrawing: boolean;
  className?: string;
}

const UnclaimedRewardsCard: FC<UnclaimedRewardsCardProps> = ({
  balances,
  onWithdraw,
  isWithdrawing,
  className,
}) => (
  <Card
    className={cn(
      "gap-3 border-primary/30 bg-primary-soft/40 px-4 py-4",
      className,
    )}
  >
    <Typography as="div" variant="bodySm" weight="bold">
      未回収の報酬があります
    </Typography>
    <ul className="flex flex-col gap-2">
      {balances.map((b) => (
        <li key={b.address} className="flex items-center justify-between gap-2">
          <Typography as="span" variant="bodySm">
            {Number(b.balance.formattedAmount).toFixed(4)} {b.balance.symbol}
          </Typography>
          <Button
            size="sm"
            variant="primary"
            onClick={() => onWithdraw(b.address)}
            disabled={isWithdrawing}
          >
            引き出す
          </Button>
        </li>
      ))}
    </ul>
  </Card>
);

// ─── Copy helpers ──────────────────────────────────────────────────────────
//
// Tiny duplicates of the ones in `$treeId_.splits.$splitId.tsx` — both routes
// need the same UX (icon-only ENS copy + mono address row with copy icon).
// Each button stops propagation so it can live inside the mobile card's
// clickable wrapper without triggering navigation.

interface CopyIconButtonProps {
  label: string;
  value: string;
  size?: "sm" | "md";
}

const CopyIconButton: FC<CopyIconButtonProps> = ({
  label,
  value,
  size = "md",
}) => {
  const { copyToClipboardAction } = useCopyToClipboard(value);
  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    event.preventDefault();
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
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full text-text-secondary transition-colors hover:bg-bg hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40",
        size === "sm" ? "size-6" : "size-7",
      )}
    >
      <Icon name="copy" size={size === "sm" ? 12 : 14} />
    </button>
  );
};

interface CopyableAddressProps {
  address: string;
  className?: string;
}

const CopyableAddress: FC<CopyableAddressProps> = ({ address, className }) => {
  const { copyToClipboardAction } = useCopyToClipboard(address);
  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    event.preventDefault();
    copyToClipboardAction().then(
      () => toast.success("アドレスをコピーしました"),
      () => toast.error("コピーに失敗しました"),
    );
  };
  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label="アドレスをコピー"
      className={cn(
        "group inline-flex max-w-full items-center gap-1.5 rounded-sm text-text-secondary transition-colors hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40",
        className,
      )}
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
