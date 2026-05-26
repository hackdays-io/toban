import { useQueries } from "@tanstack/react-query";
import dayjs from "dayjs";
import { useNamesByAddresses } from "hooks/useENS";
import { useErc20Meta } from "hooks/useErc20Meta";
import {
  type ScheduledDistributorRow,
  previewScheduledDistributorRule,
  readScheduledDistributorRule,
  useScheduledDistributorsByWorkspace,
} from "hooks/useScheduledDistributor";
import type { NameData } from "namestone-sdk";
import { type FC, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { abbreviateAddress } from "utils/wallet";
import { type Address, formatUnits } from "viem";
import { Breadcrumb } from "~/components/composite/breadcrumb";
import {
  DONUT_PALETTE,
  DonutChart,
  type DonutSlice,
} from "~/components/composite/donut-chart";
import { EmptyState } from "~/components/composite/empty-state";
import { SectionLabel } from "~/components/composite/section-label";
import { Segmented } from "~/components/composite/segmented";
import { PageContainer } from "~/components/layout/PageContainer";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import { Heading } from "~/components/ui/heading";
import { Icon } from "~/components/ui/icon";
import { Typography } from "~/components/ui/typography";
import { WorkspaceHeader } from "~/components/workspace/WorkspaceHeader";
import { cn } from "~/lib/utils";

type Status = "Pending" | "Executed" | "Reclaimed";

const STATUS_LABEL: Record<Status, string> = {
  Pending: "予約中",
  Executed: "実行済み",
  Reclaimed: "回収済み",
};

const STATUS_KIND: Record<Status, "info" | "member" | "supporter"> = {
  Pending: "info",
  Executed: "member",
  Reclaimed: "supporter",
};

interface RecipientShare {
  address: string;
  pct: number;
}

const labelFor = (
  address: string,
  byAddress: Map<string, NameData>,
): string => {
  const entry = byAddress.get(address.toLowerCase());
  return entry?.name ?? abbreviateAddress(address as `0x${string}`);
};

const ScheduledIndex: FC = () => {
  const { treeId } = useParams();
  const navigate = useNavigate();
  const { data, loading } = useScheduledDistributorsByWorkspace(treeId);
  const rows = useMemo(() => data?.scheduledDistributors ?? [], [data]);

  // Fetch every row's rule in parallel. Cached for a minute so navigating
  // back doesn't burn another round of RPC.
  const ruleQueries = useQueries({
    queries: rows.map((row) => ({
      queryKey: ["scheduled-distributor-rule", row.id],
      queryFn: () => readScheduledDistributorRule(row.id as Address),
      staleTime: 1000 * 60,
    })),
  });

  // SplitsCreator.preview() for each rule. Same allocations the live preview
  // on the detail page uses — so the list and detail agree.
  const previewQueries = useQueries({
    queries: rows.map((row, i) => {
      const rule = ruleQueries[i]?.data;
      return {
        queryKey: [
          "scheduled-distributor-preview",
          row.id,
          rule?.scheduledDate?.toString(),
        ],
        queryFn: async () => {
          if (!rule) return null;
          return await previewScheduledDistributorRule(
            rule,
            rule.confirmedWearers,
          );
        },
        enabled: !!rule,
        staleTime: 1000 * 60,
      };
    }),
  });

  // Pull symbol+decimals once across every token referenced by any row.
  const tokenAddresses = useMemo(() => {
    const all: string[] = [];
    for (const r of rows) for (const b of r.tokenBalances) all.push(b.token);
    return all;
  }, [rows]);
  const { byAddress: metaByAddress } = useErc20Meta(tokenAddresses);

  const formatBalance = (raw: string, address: string) => {
    const meta = metaByAddress.get(address.toLowerCase());
    try {
      const human = formatUnits(BigInt(raw), meta?.decimals ?? 18);
      return meta
        ? `${human} ${meta.symbol}`
        : `${human} (${abbreviateAddress(address as `0x${string}`)})`;
    } catch {
      return raw;
    }
  };

  // Per-row preview → recipient list (deduped, sorted by share descending).
  const recipientsByRow = useMemo(() => {
    const m = new Map<string, RecipientShare[]>();
    rows.forEach((row, i) => {
      const preview = previewQueries[i]?.data;
      if (!preview) {
        m.set(row.id, []);
        return;
      }
      const [addrs, allocs, total] = preview;
      if (total === 0n) {
        m.set(row.id, []);
        return;
      }
      // The same wearer can hold multiple hats and surface as duplicate
      // entries in the preview — collapse to one row per address.
      const sums = new Map<string, bigint>();
      addrs.forEach((a, j) => {
        const lc = a.toLowerCase();
        sums.set(lc, (sums.get(lc) ?? 0n) + (allocs[j] ?? 0n));
      });
      m.set(
        row.id,
        Array.from(sums.entries())
          .map(([address, alloc]) => ({
            address,
            pct: (Number(alloc) / Number(total)) * 100,
          }))
          .sort((a, b) => b.pct - a.pct),
      );
    });
    return m;
  }, [rows, previewQueries]);

  // Collect every recipient address across rows for a single ENS batch.
  const recipientAddresses = useMemo(() => {
    const set = new Set<string>();
    for (const list of recipientsByRow.values()) {
      for (const r of list) set.add(r.address);
    }
    return Array.from(set);
  }, [recipientsByRow]);
  const { names: recipientNames } = useNamesByAddresses(recipientAddresses);
  const recipientNameByAddress = useMemo(() => {
    const m = new Map<string, NameData>();
    for (const group of recipientNames) {
      const entry = group[0];
      if (entry?.address) m.set(entry.address.toLowerCase(), entry);
    }
    return m;
  }, [recipientNames]);

  // Master-detail selection on desktop.
  const [selectedId, setSelectedId] = useState<string | undefined>();
  const selectedRow = useMemo(() => {
    if (selectedId) {
      const hit = rows.find(
        (r) => r.id.toLowerCase() === selectedId.toLowerCase(),
      );
      if (hit) return hit;
    }
    return rows[0];
  }, [rows, selectedId]);
  const selectedRecipients = selectedRow
    ? (recipientsByRow.get(selectedRow.id) ?? [])
    : [];

  const segmented = (
    <Segmented
      className="flex w-full"
      value="scheduled"
      onChange={(v) => navigate(`/${treeId}/${v}`)}
      options={[
        { value: "splits", label: "分配ルール" },
        { value: "scheduled", label: "予約分配" },
      ]}
    />
  );

  const workspaceHeader = (
    <WorkspaceHeader
      title="予約分配"
      subtitle="規定日に自動で分配"
      ctaLabel="予約を作成"
      ctaTo={`/${treeId}/scheduled/new`}
      showCta
    />
  );

  return (
    <PageContainer className="pt-4 pb-8 md:pt-6">
      <Breadcrumb
        className="mb-3 px-1"
        items={[{ label: "ホーム", to: `/${treeId}` }, { label: "予約分配" }]}
      />

      {/* Mobile single-column. */}
      <div className="md:hidden">
        {workspaceHeader}
        <div className="mt-3 mb-1">{segmented}</div>

        <SectionLabel className="mt-4 px-1">一覧</SectionLabel>
        {loading && rows.length === 0 ? (
          <Card className="mx-1 mt-2 py-8 text-center">
            <Typography variant="bodySm" tone="secondary">
              読み込み中…
            </Typography>
          </Card>
        ) : rows.length === 0 ? (
          <Card className="mx-1 mt-2">
            <EmptyState
              title="予約はまだありません"
              body="日付と原資をコミットして、自動分配のリズムを作りましょう。"
              action={
                <Button asChild variant="primary">
                  <Link to={`/${treeId}/scheduled/new`}>
                    <Icon name="plus" size={16} />
                    予約を作成
                  </Link>
                </Button>
              }
            />
          </Card>
        ) : (
          <ul className="mt-2 flex flex-col gap-3 px-1">
            {rows.map((row) => (
              <li key={row.id}>
                <Link to={`/${treeId}/scheduled/${row.id}`}>
                  <ScheduledListCard
                    row={row}
                    recipients={recipientsByRow.get(row.id) ?? []}
                    recipientNameByAddress={recipientNameByAddress}
                    formatBalance={formatBalance}
                  />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Desktop master-detail — matches the split index layout. */}
      <div className="hidden md:block">
        <div className="grid grid-cols-[320px_1fr] gap-6">
          <aside className="flex flex-col gap-3">
            {workspaceHeader}
            {segmented}
            {loading && rows.length === 0 ? (
              <Card className="py-6 text-center">
                <Typography variant="bodySm" tone="secondary">
                  読み込み中…
                </Typography>
              </Card>
            ) : rows.length === 0 ? (
              <Card className="py-6 text-center">
                <Typography variant="bodySm" tone="secondary">
                  予約はまだありません
                </Typography>
              </Card>
            ) : (
              <ul className="flex flex-col gap-1.5">
                {rows.map((row) => (
                  <li key={row.id}>
                    <MasterRow
                      row={row}
                      selected={
                        row.id.toLowerCase() === selectedRow?.id.toLowerCase()
                      }
                      onClick={() => setSelectedId(row.id)}
                    />
                  </li>
                ))}
              </ul>
            )}
          </aside>
          <section className="flex flex-col gap-5">
            {selectedRow ? (
              <DesktopDetailPreview
                row={selectedRow}
                recipients={selectedRecipients}
                recipientNameByAddress={recipientNameByAddress}
                formatBalance={formatBalance}
                treeId={treeId ?? ""}
              />
            ) : (
              <Card className="py-12 text-center">
                <Typography variant="bodySm" tone="secondary">
                  予約を選択してください
                </Typography>
              </Card>
            )}
          </section>
        </div>
      </div>
    </PageContainer>
  );
};

export default ScheduledIndex;

// ──────────────────────────── Sub-components ────────────────────────────

interface ScheduledListCardProps {
  row: ScheduledDistributorRow;
  recipients: RecipientShare[];
  recipientNameByAddress: Map<string, NameData>;
  formatBalance: (raw: string, address: string) => string;
}

const ScheduledListCard: FC<ScheduledListCardProps> = ({
  row,
  recipients,
  recipientNameByAddress,
  formatBalance,
}) => {
  const status = row.status as Status;

  const slices = useMemo<DonutSlice[]>(
    () => recipients.map((r) => ({ key: r.address, percent: r.pct })),
    [recipients],
  );

  const topShares = useMemo(
    () =>
      recipients.slice(0, 3).map((r) => ({
        address: r.address,
        label: labelFor(r.address, recipientNameByAddress),
        pct: r.pct,
      })),
    [recipients, recipientNameByAddress],
  );
  const extra = Math.max(0, recipients.length - topShares.length);

  return (
    <Card className="flex-row items-start gap-3.5 px-4 py-4 transition-colors hover:bg-bg">
      <DonutChart slices={slices} size={72} className="mt-0.5" />
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <Heading variant="h6" level={3} className="leading-tight">
            {dayjs(Number(row.scheduledDate) * 1000).format("YYYY/MM/DD HH:mm")}
          </Heading>
          <Badge kind={STATUS_KIND[status]}>
            {STATUS_LABEL[status] ?? row.status}
          </Badge>
        </div>
        {row.tokenBalances.length > 0 && (
          <Typography
            as="div"
            variant="caption"
            tone="secondary"
            className="mt-1"
          >
            原資:{" "}
            {row.tokenBalances
              .map((b) => formatBalance(b.totalDeposited, b.token))
              .join(" / ")}
          </Typography>
        )}
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
  );
};

interface MasterRowProps {
  row: ScheduledDistributorRow;
  selected: boolean;
  onClick: () => void;
}

const MasterRow: FC<MasterRowProps> = ({ row, selected, onClick }) => {
  const status = row.status as Status;
  const date = dayjs(Number(row.scheduledDate) * 1000);
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-3 rounded-md border border-transparent p-3 text-left transition-colors hover:bg-surface",
        selected && "border-border bg-surface shadow-1",
      )}
    >
      <div className="flex size-9 shrink-0 items-center justify-center rounded-sm bg-[#E5F1FB] text-[#5DADEC]">
        <Icon name="calendar-clock" size={18} />
      </div>
      <div className="min-w-0 flex-1">
        <Typography as="div" variant="bodySm" weight="bold" truncate>
          {date.format("YYYY/MM/DD HH:mm")}
        </Typography>
        <Typography variant="micro" tone="secondary" as="div" truncate>
          {STATUS_LABEL[status] ?? row.status}
        </Typography>
      </div>
    </button>
  );
};

interface DesktopDetailPreviewProps {
  row: ScheduledDistributorRow;
  recipients: RecipientShare[];
  recipientNameByAddress: Map<string, NameData>;
  formatBalance: (raw: string, address: string) => string;
  treeId: string;
}

const DesktopDetailPreview: FC<DesktopDetailPreviewProps> = ({
  row,
  recipients,
  recipientNameByAddress,
  formatBalance,
  treeId,
}) => {
  const status = row.status as Status;
  const slices = useMemo<DonutSlice[]>(
    () => recipients.map((r) => ({ key: r.address, percent: r.pct })),
    [recipients],
  );
  const previewRows = useMemo(
    () =>
      recipients.slice(0, 5).map((r) => ({
        address: r.address,
        label: labelFor(r.address, recipientNameByAddress),
        pct: r.pct,
      })),
    [recipients, recipientNameByAddress],
  );
  const extra = Math.max(0, recipients.length - previewRows.length);

  return (
    <Card className="gap-5 px-6 py-5">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Heading variant="h3" level={2} className="leading-tight">
              {dayjs(Number(row.scheduledDate) * 1000).format(
                "YYYY/MM/DD HH:mm",
              )}
            </Heading>
            <Badge kind={STATUS_KIND[status]}>
              {STATUS_LABEL[status] ?? row.status}
            </Badge>
          </div>
          {row.tokenBalances.length > 0 && (
            <Typography variant="bodySm" tone="secondary" className="mt-1">
              原資:{" "}
              {row.tokenBalances
                .map((b) => formatBalance(b.totalDeposited, b.token))
                .join(" / ")}
            </Typography>
          )}
          <Typography variant="bodySm" tone="secondary" className="mt-0.5">
            対象 {recipients.length}人
          </Typography>
        </div>
        <Button asChild variant="secondary" size="sm">
          <Link to={`/${treeId}/scheduled/${row.id}`}>
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
                {recipients.length}
              </span>
              <span className="mt-1 text-[10px] font-bold text-text-secondary">
                人
              </span>
            </>
          }
        />
        <ul className="flex min-w-[200px] flex-1 flex-col gap-1.5">
          {previewRows.length > 0 ? (
            previewRows.map((r, i) => (
              <li
                key={r.address}
                className="flex items-center gap-2 text-[12px]"
              >
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
                  {r.pct.toFixed(2)}%
                </Typography>
              </li>
            ))
          ) : (
            <li>
              <Typography variant="bodySm" tone="secondary">
                プレビューを取得中…
              </Typography>
            </li>
          )}
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
// segment for the same slice.
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
