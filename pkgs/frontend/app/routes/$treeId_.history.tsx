import { MintThanksToken_OrderBy, OrderDirection } from "gql/graphql";
import { useNamesByAddresses } from "hooks/useENS";
import { useGetMintThanksTokens } from "hooks/useThanksToken";
import { type FC, type ReactNode, useMemo, useState } from "react";
import type { DateRange } from "react-day-picker";
import { Link, useNavigate, useParams } from "react-router";
import type { NameData } from "types/ens";
import { ipfs2https } from "utils/ipfs";
import { abbreviateAddress } from "utils/wallet";
import { hexToString } from "viem";
import { DateRangePicker } from "~/components/composite/date-range-picker";
import { EmptyState } from "~/components/composite/empty-state";
import { Segmented } from "~/components/composite/segmented";
import { PageContainer } from "~/components/layout/PageContainer";
import { ScreenHeader } from "~/components/layout/ScreenHeader";
import { SquarifiedTreemap } from "~/components/thankstoken/SquarifiedTreemap";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Card } from "~/components/ui/card";
import { Icon } from "~/components/ui/icon";
import { Typography } from "~/components/ui/typography";
import { cn } from "~/lib/utils";

type Tab = "list" | "graph" | "friends";
type FriendSort = "amount" | "count";

const TABS: Array<{ value: Tab; label: string }> = [
  { value: "list", label: "リスト" },
  { value: "graph", label: "グラフ" },
  { value: "friends", label: "フレンドシップ" },
];

const DEFAULT_RANGE_DAYS = 30;
const startOfDay = (d: Date) => {
  const c = new Date(d);
  c.setHours(0, 0, 0, 0);
  return c;
};
const endOfDay = (d: Date) => {
  const c = new Date(d);
  c.setHours(23, 59, 59, 999);
  return c;
};

interface Mint {
  id: string;
  from: string;
  to: string;
  amount: number;
  message: string;
  timestamp: number;
}

const LIST_CAP = 30;
const FRIENDSHIP_CAP = 24;

const ActivityScreen: FC = () => {
  const { treeId } = useParams();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("list");
  const [friendSort, setFriendSort] = useState<FriendSort>("amount");

  // Default to the last 30 days so the screen lands on a non-empty view on
  // first paint. Users can widen with the DateRangePicker (or clear it for
  // 全期間).
  const [range, setRange] = useState<DateRange | undefined>(() => {
    const to = new Date();
    const from = new Date();
    from.setDate(from.getDate() - (DEFAULT_RANGE_DAYS - 1));
    return { from, to };
  });

  // Pull all mints for the workspace, then filter client-side by range —
  // the workspace-wide mint count is bounded enough (<= a few thousand)
  // that this avoids an extra per-range round-trip every time the user
  // moves the picker.
  const { data, loading } = useGetMintThanksTokens({
    where: { workspaceId: treeId },
    orderBy: MintThanksToken_OrderBy.BlockTimestamp,
    orderDirection: OrderDirection.Desc,
    first: 1000,
  });

  const allMints = useMemo<Mint[]>(() => {
    if (!data?.mintThanksTokens) return [];
    return data.mintThanksTokens.map((m) => ({
      id: m.id,
      from: m.from.toLowerCase(),
      to: m.to.toLowerCase(),
      amount: Number(m.amount),
      message: m.data ? hexToString(m.data) : "",
      timestamp: Number(m.blockTimestamp),
    }));
  }, [data]);

  const filteredMints = useMemo(() => {
    if (!range?.from) return allMints;
    const fromTs = Math.floor(startOfDay(range.from).getTime() / 1000);
    const toTs = Math.floor(endOfDay(range.to ?? range.from).getTime() / 1000);
    return allMints.filter((m) => m.timestamp >= fromTs && m.timestamp <= toTs);
  }, [allMints, range]);

  // Resolve names once for every counter-party that appears in *any* period
  // bucket — that way switching chips never re-fires ENS lookups.
  const allAddresses = useMemo(() => {
    const set = new Set<string>();
    for (const m of allMints) {
      set.add(m.from);
      set.add(m.to);
    }
    return Array.from(set);
  }, [allMints]);
  const { names } = useNamesByAddresses(allAddresses);
  const namesByAddress = useMemo(() => {
    const map = new Map<string, NameData>();
    for (const group of names ?? []) {
      const entry = group[0];
      if (entry?.address) map.set(entry.address.toLowerCase(), entry);
    }
    return map;
  }, [names]);

  // Summary stats reflect the active period.
  const sendCount = filteredMints.length;
  const totalThx = useMemo(
    () => filteredMints.reduce((s, m) => s + m.amount, 0),
    [filteredMints],
  );
  const participantCount = useMemo(() => {
    const set = new Set<string>();
    for (const m of filteredMints) {
      set.add(m.from);
      set.add(m.to);
    }
    return set.size;
  }, [filteredMints]);

  if (!treeId) {
    return (
      <PageContainer className="pt-4">
        <Typography variant="bodySm" tone="secondary">
          Workspace not found
        </Typography>
      </PageContainer>
    );
  }

  const initialLoading = loading && allMints.length === 0;

  return (
    <PageContainer className="px-0 pt-2 pb-8">
      <ScreenHeader
        title="アクティビティ"
        onBack={() => navigate(`/${treeId}`)}
      />

      <div className="px-4 pb-3">
        <DateRangePicker value={range} onChange={setRange} />
      </div>

      <div className="px-4 pb-3">
        <Card className="gap-0 px-0 py-3.5">
          <div className="grid grid-cols-[1fr_1px_1fr_1px_1fr]">
            <SummaryStat
              label="送付件数"
              value={sendCount.toLocaleString()}
              unit="件"
            />
            <div className="bg-border" />
            <SummaryStat
              label="合計"
              value={totalThx.toLocaleString()}
              unit="THX"
              accent="#2F8B58"
            />
            <div className="bg-border" />
            <SummaryStat
              label="参加者"
              value={participantCount.toLocaleString()}
              unit="人"
            />
          </div>
        </Card>
      </div>

      <TabStrip value={tab} onChange={setTab} />

      <div className="mt-3">
        {tab === "list" && (
          <ListTab
            treeId={treeId}
            mints={filteredMints}
            loading={initialLoading}
            namesByAddress={namesByAddress}
          />
        )}
        {tab === "graph" && (
          <GraphTab
            mints={filteredMints}
            loading={initialLoading}
            namesByAddress={namesByAddress}
          />
        )}
        {tab === "friends" && (
          <FriendsTab
            treeId={treeId}
            mints={filteredMints}
            loading={initialLoading}
            namesByAddress={namesByAddress}
            sort={friendSort}
            onSortChange={setFriendSort}
          />
        )}
      </div>
    </PageContainer>
  );
};

export default ActivityScreen;

// ─── Tab strip ────────────────────────────────────────────────

const TabStrip: FC<{ value: Tab; onChange: (t: Tab) => void }> = ({
  value,
  onChange,
}) => (
  <div className="border-b border-border">
    <nav className="flex gap-6 px-4" role="tablist">
      {TABS.map((t) => {
        const active = value === t.value;
        return (
          <button
            key={t.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(t.value)}
            className={cn(
              // -mb-px lets the active-state underline overlap the
              // container's 1px border-b, instead of doubling it.
              "relative -mb-px py-3 text-[14px] outline-none transition-colors focus-visible:text-text-primary",
              active
                ? "font-bold text-text-primary"
                : "font-medium text-text-secondary hover:text-text-primary",
            )}
          >
            {t.label}
            {active && (
              <span
                aria-hidden="true"
                className="absolute inset-x-0 -bottom-px h-0.5 bg-text-primary"
              />
            )}
          </button>
        );
      })}
    </nav>
  </div>
);

// ─── Summary card stat ────────────────────────────────────────

const SummaryStat: FC<{
  label: ReactNode;
  value: ReactNode;
  unit: string;
  accent?: string;
}> = ({ label, value, unit, accent }) => (
  <div className="px-2 text-center">
    <Typography variant="micro" tone="secondary" weight="semibold" as="div">
      {label}
    </Typography>
    <div
      className="mt-0.5 flex items-baseline justify-center gap-1"
      style={accent ? { color: accent } : undefined}
    >
      <Typography
        as="span"
        variant="statMd"
        className="text-[22px]"
        style={accent ? { color: accent } : undefined}
      >
        {value}
      </Typography>
      <Typography as="span" variant="micro" tone="secondary" weight="semibold">
        {unit}
      </Typography>
    </div>
  </div>
);

// ─── List tab ─────────────────────────────────────────────────

interface CounterPartyProps {
  treeId: string;
  address: string;
  user?: NameData;
  align?: "left" | "right";
}

const CounterParty: FC<CounterPartyProps> = ({
  treeId,
  address,
  user,
  align = "left",
}) => {
  const name = user?.name || abbreviateAddress(address as `0x${string}`);
  const avatarUrl = ipfs2https(user?.text_records?.avatar);
  return (
    <Link
      to={`/${treeId}/member/${address}`}
      className={cn(
        "flex min-w-0 items-center gap-2",
        align === "right" && "justify-end",
      )}
    >
      {align === "left" && (
        <Avatar size="sm">
          {avatarUrl && <AvatarImage src={avatarUrl} alt={name} />}
          <AvatarFallback seed={name} />
        </Avatar>
      )}
      <Typography
        as="span"
        variant="bodySm"
        weight="bold"
        truncate
        className="max-w-[88px]"
      >
        {name}
      </Typography>
      {align === "right" && (
        <Avatar size="sm">
          {avatarUrl && <AvatarImage src={avatarUrl} alt={name} />}
          <AvatarFallback seed={name} />
        </Avatar>
      )}
    </Link>
  );
};

const ListTab: FC<{
  treeId: string;
  mints: Mint[];
  loading: boolean;
  namesByAddress: Map<string, NameData>;
}> = ({ treeId, mints, loading, namesByAddress }) => {
  if (loading) return <ListSkeleton />;
  if (mints.length === 0) {
    return (
      <EmptyState
        icon={<Icon name="heart" />}
        title="この期間にサンクスはまだありません"
        body="期間を広げるか、最初のサンクスを送ってみましょう。"
      />
    );
  }
  const visible = mints.slice(0, LIST_CAP);
  const remaining = Math.max(mints.length - LIST_CAP, 0);
  return (
    <div className="space-y-2 px-4">
      {visible.map((m) => (
        <TxCard
          key={m.id}
          treeId={treeId}
          mint={m}
          fromUser={namesByAddress.get(m.from)}
          toUser={namesByAddress.get(m.to)}
        />
      ))}
      {remaining > 0 && (
        <Typography
          as="div"
          variant="caption"
          tone="secondary"
          className="py-4 text-center"
        >
          残り {remaining.toLocaleString()} 件
        </Typography>
      )}
    </div>
  );
};

const TxCard: FC<{
  treeId: string;
  mint: Mint;
  fromUser?: NameData;
  toUser?: NameData;
}> = ({ treeId, mint, fromUser, toUser }) => {
  return (
    <div
      className="relative rounded-md border bg-[#E8F6EE] p-3"
      style={{ borderColor: "rgba(101,201,138,0.2)" }}
    >
      <div
        className={cn(
          "flex items-center gap-2",
          mint.message ? "mb-1.5" : undefined,
        )}
      >
        <CounterParty treeId={treeId} address={mint.from} user={fromUser} />
        <div className="flex min-w-0 flex-1 items-center gap-1.5 px-1">
          <div className="h-px flex-1 bg-[#65C98A]/40" />
          <Typography
            as="span"
            variant="bodySm"
            weight="bold"
            className="whitespace-nowrap text-[#2F8B58]"
          >
            {mint.amount.toLocaleString()}
            <span className="ml-0.5 text-[10px]">THX</span>
          </Typography>
          <div className="h-px flex-1 bg-[#65C98A]/40" />
          <Icon
            name="chevron-right"
            size={12}
            className="text-[#65C98A] shrink-0"
          />
        </div>
        <CounterParty
          treeId={treeId}
          address={mint.to}
          user={toUser}
          align="right"
        />
      </div>
      {mint.message && (
        <Typography as="div" variant="caption" className="px-9 leading-relaxed">
          {mint.message}
        </Typography>
      )}
      <Typography
        as="div"
        variant="micro"
        tone="secondary"
        className="mt-1.5 px-9"
      >
        {formatTxTime(mint.timestamp)}
      </Typography>
    </div>
  );
};

const formatTxTime = (ts: number) => {
  const d = new Date(ts * 1000);
  const m = d.getMonth() + 1;
  const day = d.getDate();
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${m}/${day} ${hh}:${mm}`;
};

const ListSkeleton: FC = () => (
  <div className="space-y-2 px-4">
    {["a", "b", "c", "d"].map((k) => (
      <div
        key={k}
        className="h-[68px] animate-pulse rounded-md bg-[#E8F6EE]/60"
      />
    ))}
  </div>
);

// ─── Graph tab ────────────────────────────────────────────────

const GraphTab: FC<{
  mints: Mint[];
  loading: boolean;
  namesByAddress: Map<string, NameData>;
}> = ({ mints, loading, namesByAddress }) => {
  const heldData = useMemo(
    () => aggregateByParty(mints, "to", namesByAddress),
    [mints, namesByAddress],
  );
  const sentData = useMemo(
    () => aggregateByParty(mints, "from", namesByAddress),
    [mints, namesByAddress],
  );

  if (loading) {
    return (
      <div className="space-y-4 px-4">
        <div className="h-[240px] animate-pulse rounded-md bg-bg" />
        <div className="h-[240px] animate-pulse rounded-md bg-bg" />
      </div>
    );
  }

  if (mints.length === 0) {
    return (
      <EmptyState
        icon={<Icon name="pie" />}
        title="この期間にサンクスはまだありません"
        body="期間を広げてみてください。"
      />
    );
  }

  return (
    <div className="space-y-4 px-4">
      <Card className="gap-3 px-3.5 py-3.5">
        <Typography as="div" variant="lead" weight="bold">
          保有しているサンクストークン
        </Typography>
        <SquarifiedTreemap data={heldData} fill="#5DADEC" />
      </Card>
      <Card className="gap-3 px-3.5 py-3.5">
        <Typography as="div" variant="lead" weight="bold">
          送ったサンクストークン
        </Typography>
        <SquarifiedTreemap data={sentData} fill="#F5B82E" />
      </Card>
      <Card className="gap-2 px-3.5 py-3.5">
        <Typography
          as="div"
          variant="caption"
          tone="secondary"
          weight="semibold"
        >
          読みかた
        </Typography>
        <Typography as="div" variant="bodySm" className="leading-relaxed">
          四角の<strong>面積</strong>
          が、その人の保有量・送付量の大きさを表しています。上段は受け取った合計、下段は送った合計です。
        </Typography>
      </Card>
    </div>
  );
};

const aggregateByParty = (
  mints: Mint[],
  key: "from" | "to",
  namesByAddress: Map<string, NameData>,
) => {
  const totals = new Map<string, number>();
  for (const m of mints) {
    const addr = m[key];
    totals.set(addr, (totals.get(addr) ?? 0) + m.amount);
  }
  return Array.from(totals.entries())
    .map(([addr, value]) => {
      const user = namesByAddress.get(addr);
      return {
        name: user?.name || abbreviateAddress(addr as `0x${string}`),
        value,
        avatarUrl: ipfs2https(user?.text_records?.avatar),
      };
    })
    .sort((a, b) => b.value - a.value);
};

// ─── Friends tab ──────────────────────────────────────────────

interface PairAgg {
  a: string;
  b: string;
  total: number;
  count: number;
}

const FRIEND_PALETTES: Array<{ bg: string; fg: string }> = [
  { bg: "#FFF2CF", fg: "#7A5A2E" },
  { bg: "#EEEEEE", fg: "#5A5A5A" },
  { bg: "#FCE4D8", fg: "#A33C18" },
];
const FRIEND_DEFAULT = { bg: "transparent", fg: "#1F1F1F" };

const FriendsTab: FC<{
  treeId: string;
  mints: Mint[];
  loading: boolean;
  namesByAddress: Map<string, NameData>;
  sort: FriendSort;
  onSortChange: (s: FriendSort) => void;
}> = ({ treeId, mints, loading, namesByAddress, sort, onSortChange }) => {
  const pairs = useMemo(() => {
    const m = new Map<string, PairAgg>();
    for (const t of mints) {
      const [a, b] = [t.from, t.to].sort();
      const key = `${a}|${b}`;
      const cur = m.get(key);
      if (cur) {
        cur.total += t.amount;
        cur.count += 1;
      } else {
        m.set(key, { a, b, total: t.amount, count: 1 });
      }
    }
    const arr = Array.from(m.values());
    arr.sort((x, y) =>
      sort === "amount" ? y.total - x.total : y.count - x.count,
    );
    return arr.slice(0, FRIENDSHIP_CAP);
  }, [mints, sort]);

  return (
    <div className="px-4">
      <Segmented
        value={sort}
        onChange={onSortChange}
        options={[
          { value: "amount", label: "総交換量順" },
          { value: "count", label: "取引回数順" },
        ]}
        className="w-full"
      />

      <div className="mt-3">
        {loading && mints.length === 0 ? (
          <FriendsSkeleton />
        ) : pairs.length === 0 ? (
          <EmptyState
            icon={<Icon name="user" />}
            title="この期間にはサンクスの送付がありません"
            body="期間を広げてみてください。"
          />
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {pairs.map((p, i) => {
              const palette = FRIEND_PALETTES[i] ?? FRIEND_DEFAULT;
              const isPodium = i < 3;
              return (
                <FriendCard
                  key={`${p.a}|${p.b}`}
                  pair={p}
                  palette={palette}
                  isPodium={isPodium}
                  treeId={treeId}
                  fromUser={namesByAddress.get(p.a)}
                  toUser={namesByAddress.get(p.b)}
                  sort={sort}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

const FriendCard: FC<{
  pair: PairAgg;
  palette: { bg: string; fg: string };
  isPodium: boolean;
  treeId: string;
  fromUser?: NameData;
  toUser?: NameData;
  sort: FriendSort;
}> = ({ pair, palette, isPodium, treeId, fromUser, toUser, sort }) => {
  return (
    <div
      className={cn(
        "flex flex-col gap-4 rounded-md px-4 py-5",
        isPodium
          ? "border border-transparent"
          : "border border-border bg-surface",
      )}
      style={isPodium ? { background: palette.bg } : undefined}
    >
      {/* Avatar pair */}
      <div className="flex items-center justify-center gap-6">
        <PairAvatar treeId={treeId} address={pair.a} user={fromUser} />
        <PairAvatar treeId={treeId} address={pair.b} user={toUser} />
      </div>

      {/* Stats — single line: "{total} THX / {count}回". The active sort
          just decides which side is emphasised. */}
      <div
        className="flex items-baseline justify-center gap-1 text-center"
        style={{ color: palette.fg }}
      >
        <Typography
          as="span"
          variant="statMd"
          className="text-[22px]"
          weight={sort === "amount" ? "bold" : "regular"}
          style={{
            color: palette.fg,
            opacity: sort === "amount" ? 1 : 0.7,
          }}
        >
          {pair.total.toLocaleString()}
        </Typography>
        <Typography
          as="span"
          variant="caption"
          weight="bold"
          style={{ color: palette.fg, opacity: 0.85 }}
        >
          THX
        </Typography>
        <Typography
          as="span"
          variant="caption"
          weight="semibold"
          className="mx-1"
          style={{ color: palette.fg, opacity: 0.5 }}
        >
          /
        </Typography>
        <Typography
          as="span"
          variant="statMd"
          className="text-[22px]"
          weight={sort === "count" ? "bold" : "regular"}
          style={{
            color: palette.fg,
            opacity: sort === "count" ? 1 : 0.7,
          }}
        >
          {pair.count.toLocaleString()}
        </Typography>
        <Typography
          as="span"
          variant="caption"
          weight="bold"
          style={{ color: palette.fg, opacity: 0.85 }}
        >
          回
        </Typography>
      </div>
    </div>
  );
};

const PairAvatar: FC<{
  treeId: string;
  address: string;
  user?: NameData;
}> = ({ treeId, address, user }) => {
  const name = user?.name || abbreviateAddress(address as `0x${string}`);
  const avatarUrl = ipfs2https(user?.text_records?.avatar);
  return (
    <Link
      to={`/${treeId}/member/${address}`}
      className="flex min-w-0 flex-col items-center gap-1.5"
    >
      <Avatar size="lg">
        {avatarUrl && <AvatarImage src={avatarUrl} alt={name} />}
        <AvatarFallback seed={name} />
      </Avatar>
      <Typography
        as="span"
        variant="bodySm"
        weight="semibold"
        truncate
        className="max-w-[88px]"
      >
        {name}
      </Typography>
    </Link>
  );
};

const FriendsSkeleton: FC = () => (
  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
    {["a", "b", "c", "d", "e", "f"].map((k) => (
      <div key={k} className="h-[180px] animate-pulse rounded-md bg-bg" />
    ))}
  </div>
);
