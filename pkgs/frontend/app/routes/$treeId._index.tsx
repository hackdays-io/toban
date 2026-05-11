import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { useActiveWalletIdentity, useNamesByAddresses } from "hooks/useENS";
import { useTreeInfo } from "hooks/useHats";
import { type Quest, useQuests } from "hooks/useQuests";
import {
  useThanksToken,
  useThanksTokenActivity,
  useUserThanksTokenBalance,
} from "hooks/useThanksToken";
import { useActiveWallet } from "hooks/useWallet";
import type { NameData } from "namestone-sdk";
import { type FC, Fragment, useMemo } from "react";
import { Link, useNavigate, useParams } from "react-router";
import type { HatsDetailSchama } from "types/hats";
import { ipfs2https } from "utils/ipfs";
import { abbreviateAddress } from "utils/wallet";
import { formatEther, hexToString } from "viem";
import { Divider } from "~/components/composite/divider";
import { SectionLabel } from "~/components/composite/section-label";
import { StatCard } from "~/components/composite/stat-card";
import { PageContainer } from "~/components/layout/PageContainer";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import { Icon } from "~/components/ui/icon";
import { cn } from "~/lib/utils";

const WEEK_SEC = 7 * 24 * 60 * 60;

// Mirrors the "homma さんから / 2 時間前" cadence in the design source. Anything
// older than five weeks falls back to a JP locale date so the row stays scannable.
const formatRelative = (timestampSec: number, nowMs: number): string => {
  const deltaSec = Math.max(0, Math.floor(nowMs / 1000 - timestampSec));
  if (deltaSec < 60) return "今";
  const min = Math.floor(deltaSec / 60);
  if (min < 60) return `${min} 分前`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} 時間前`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day} 日前`;
  const week = Math.floor(day / 7);
  if (week < 5) return `${week} 週間前`;
  return new Date(timestampSec * 1000).toLocaleDateString("ja-JP");
};

// Resolves a Hats `details` IPFS pointer to its parsed metadata. Shares the
// `["hats-detail", url]` cache key with `HatsListItemParser` so duty cards
// don't refetch when the user navigates back from a role detail screen.
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

type Direction = "received" | "sent" | "third-party";

interface ActivityItem {
  id: string;
  direction: Direction;
  counterpartAddress: string;
  counterpartName: string;
  amount: string;
  message?: string;
  relativeTime: string;
}

const WorkspaceHome: FC = () => {
  const { wallet } = useActiveWallet();
  const me = wallet?.account?.address;

  const { treeId } = useParams();
  const navigate = useNavigate();

  const { identity } = useActiveWalletIdentity();
  const greetingName =
    identity?.name ||
    (wallet?.account?.address ? abbreviateAddress(wallet.account.address) : "");

  const tree = useTreeInfo(Number(treeId));
  const myDuties = useMemo(() => {
    const meAddr = me?.toLowerCase();
    if (!tree?.hats || !meAddr) return [];
    return tree.hats.filter(
      (h) =>
        Number(h.levelAtLocalTree) >= 2 &&
        h.wearers?.some((w) => w.id === meAddr),
    );
  }, [tree, me]);

  const { mintableAmount } = useThanksToken(treeId || "");
  const { balance: receivedBalance } = useUserThanksTokenBalance(treeId);
  const { mints, isLoading: isActivityLoading } = useThanksTokenActivity(
    treeId,
    20,
  );
  const recentMints = mints?.mintThanksTokens ?? [];

  const counterpartAddresses = useMemo(() => {
    const set = new Set<string>();
    for (const m of recentMints) {
      if (m.from) set.add(m.from.toLowerCase());
      if (m.to) set.add(m.to.toLowerCase());
    }
    return Array.from(set);
  }, [recentMints]);
  const { names } = useNamesByAddresses(counterpartAddresses);
  const nameByAddress = useMemo(() => {
    const map = new Map<string, NameData>();
    for (const group of names) {
      const entry = group[0];
      if (entry?.address) {
        map.set(entry.address.toLowerCase(), entry);
      }
    }
    return map;
  }, [names]);

  // Weekly stats are derived from the same `recentMints` slice; we don't issue
  // an extra query. Per-user activity is "this week's outgoing thanks" and the
  // delta is a coarse "% change in workspace-wide mints vs the prior week".
  const nowMs = Date.now();
  const nowSec = Math.floor(nowMs / 1000);
  const weeklyStats = useMemo(() => {
    let workspaceThisWeek = 0;
    let workspaceLastWeek = 0;
    let myThisWeek = 0;
    const meAddr = me?.toLowerCase();
    for (const m of recentMints) {
      const ts = Number(m.blockTimestamp);
      if (ts >= nowSec - WEEK_SEC) {
        workspaceThisWeek += 1;
        if (meAddr && m.from?.toLowerCase() === meAddr) myThisWeek += 1;
      } else if (ts >= nowSec - 2 * WEEK_SEC) {
        workspaceLastWeek += 1;
      }
    }
    let delta: string | undefined;
    if (workspaceLastWeek > 0) {
      const pct = Math.round(
        ((workspaceThisWeek - workspaceLastWeek) / workspaceLastWeek) * 100,
      );
      if (pct > 0) delta = `+${pct}% 今週`;
    }
    return { workspaceThisWeek, myThisWeek, delta };
  }, [recentMints, me, nowSec]);

  const { quests } = useQuests(treeId, {
    statuses: ["Open", "PendingReview"],
    first: 3,
  });

  const sendableAmount = useMemo(
    () => Number(formatEther(mintableAmount || 0n)).toLocaleString(),
    [mintableAmount],
  );
  const receivedFormatted = useMemo(
    () => Number(formatEther(BigInt(receivedBalance))).toLocaleString(),
    [receivedBalance],
  );

  const activityItems = useMemo<ActivityItem[]>(() => {
    return recentMints.slice(0, 4).map((m): ActivityItem => {
      const fromAddr = m.from.toLowerCase();
      const toAddr = m.to.toLowerCase();
      const meAddr = me?.toLowerCase();
      const direction: Direction = !meAddr
        ? "third-party"
        : toAddr === meAddr
          ? "received"
          : fromAddr === meAddr
            ? "sent"
            : "third-party";
      const counterpartAddress = direction === "sent" ? toAddr : fromAddr;
      const counterpart = nameByAddress.get(counterpartAddress);
      const counterpartName =
        counterpart?.name ||
        abbreviateAddress(counterpartAddress as `0x${string}`);
      let message: string | undefined;
      try {
        const decoded = hexToString((m.data as `0x${string}`) || "0x");
        message = decoded.trim() || undefined;
      } catch {
        message = undefined;
      }
      return {
        id: m.id,
        direction,
        counterpartAddress,
        counterpartName,
        amount: Number(formatEther(BigInt(m.amount))).toLocaleString(),
        message,
        relativeTime: formatRelative(Number(m.blockTimestamp), nowMs),
      };
    });
  }, [recentMints, me, nameByAddress, nowMs]);

  const goSendThanks = () => {
    if (!treeId) return;
    navigate(`/${treeId}/thankstoken/send`);
  };

  return (
    <PageContainer className="pt-4 pb-8 md:pt-6">
      <header className="mb-4 px-1 md:mb-6">
        {greetingName && (
          <p className="text-[13px] text-text-secondary">
            こんにちは、{greetingName} さん
          </p>
        )}
        <h1 className="mt-0.5 text-[22px] font-extrabold tracking-tight text-text-primary md:text-[24px]">
          今日もおつかれさまです！
        </h1>
      </header>

      {/* Mobile layout — single column. */}
      <div className="flex flex-col gap-6 md:hidden">
        <SendableMobileCard
          sendableAmount={sendableAmount}
          receivedAmount={receivedFormatted}
          deltaLabel={weeklyStats.delta}
          onSend={goSendThanks}
        />

        <section>
          <SectionLabel className="px-1">あなたの当番</SectionLabel>
          {myDuties.length > 0 ? (
            <div className="flex flex-col gap-2.5 px-1">
              {myDuties.map((h) => (
                <MyDutyCard
                  key={h.id}
                  treeId={treeId ?? ""}
                  hatId={h.id as `0x${string}`}
                  imageUri={h.imageUri}
                  detailsUri={h.details}
                  myAddress={(me ?? "0x") as `0x${string}`}
                />
              ))}
            </div>
          ) : (
            <Card className="mx-1 py-6 text-center">
              <p className="text-[13px] text-text-secondary">
                担当中の当番はありません
              </p>
            </Card>
          )}
        </section>

        <section>
          <div className="flex items-baseline justify-between px-1 pb-2">
            <span className="text-xs font-bold tracking-[0.04em] text-text-secondary">
              最近のアクティビティ
            </span>
            {treeId && (
              <Link
                to={`/${treeId}/history`}
                className="inline-flex items-center gap-0.5 text-xs text-text-secondary"
              >
                すべて見る
                <Icon name="chevron-right" size={12} />
              </Link>
            )}
          </div>
          <ActivityList isLoading={isActivityLoading} items={activityItems} />
        </section>
      </div>

      {/* Desktop layout — 2fr / 1fr grid. */}
      <div className="hidden gap-5 md:grid md:grid-cols-[2fr_1fr]">
        <div className="flex flex-col gap-5">
          <div className="grid grid-cols-3 gap-3">
            <StatCard
              label="送れるサンクス"
              value={sendableAmount}
              unit="THX"
              size="wide"
              accent="var(--color-primary)"
              delta={weeklyStats.delta}
            />
            <StatCard
              label="受け取ったサンクス"
              value={receivedFormatted}
              unit="THX"
              size="wide"
              accent="var(--color-contrib)"
            />
            <StatCard
              label="今週の貢献"
              value={weeklyStats.myThisWeek}
              unit="件"
              size="wide"
              accent="var(--color-split)"
            />
          </div>

          <Card className="gap-3 py-5">
            <SectionHeader
              title="あなたの当番"
              actionTo={treeId ? `/${treeId}/role` : undefined}
            />
            {myDuties.length > 0 ? (
              <div className="grid grid-cols-2 gap-2.5 px-5">
                {myDuties.slice(0, 4).map((h) => (
                  <MyDutyCard
                    key={h.id}
                    treeId={treeId ?? ""}
                    hatId={h.id as `0x${string}`}
                    imageUri={h.imageUri}
                    detailsUri={h.details}
                    myAddress={(me ?? "0x") as `0x${string}`}
                    size="sm"
                  />
                ))}
              </div>
            ) : (
              <p className="px-5 text-[13px] text-text-secondary">
                担当中の当番はありません
              </p>
            )}
          </Card>

          <Card className="gap-2 py-5">
            <SectionHeader
              title="最近のアクティビティ"
              actionTo={treeId ? `/${treeId}/history` : undefined}
            />
            <ActivityList
              isLoading={isActivityLoading}
              items={activityItems}
              variant="flat"
            />
          </Card>
        </div>

        <div className="flex flex-col gap-5">
          <WeeklyBalanceCard
            sendableAmount={sendableAmount}
            deltaLabel={weeklyStats.delta}
            onSend={goSendThanks}
          />

          <Card className="gap-3 py-5">
            <SectionHeader title="進行中のクエスト" />
            <div className="px-5">
              {quests.length > 0 ? (
                <div className="flex flex-col gap-2">
                  {quests.slice(0, 3).map((q) => (
                    <QuestRow key={q.id} quest={q} />
                  ))}
                </div>
              ) : (
                <p className="text-[13px] text-text-secondary">
                  進行中のクエストはありません
                </p>
              )}
            </div>
          </Card>

          <Card className="gap-3 py-5">
            <SectionHeader title="原則" />
            <ul className="flex flex-col gap-3 px-5">
              {PRINCIPLES.map((p) => (
                <li key={p.label} className="flex items-center gap-3">
                  <div className="flex size-8 items-center justify-center rounded-xs bg-primary-soft text-sm text-[#7A5A2E]">
                    {p.icon}
                  </div>
                  <div>
                    <div className="text-[13px] font-bold">{p.label}</div>
                    <div className="text-[11px] text-text-secondary">
                      {p.desc}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>
    </PageContainer>
  );
};

export default WorkspaceHome;

const PRINCIPLES = [
  { icon: "♡", label: "Warm", desc: "やさしい人のつながり" },
  { icon: "✺", label: "Clear", desc: "迷わないシンプルさ" },
  { icon: "◍", label: "Community", desc: "みんなで育てる仕組み" },
];

const SectionHeader: FC<{ title: string; actionTo?: string }> = ({
  title,
  actionTo,
}) => (
  <div className="flex items-center justify-between px-5">
    <h2 className="text-[15px] font-bold text-text-primary">{title}</h2>
    {actionTo && (
      <Link
        to={actionTo}
        className="text-xs font-semibold text-text-secondary hover:text-text-primary"
      >
        すべて見る →
      </Link>
    )}
  </div>
);

interface SendableMobileCardProps {
  sendableAmount: string;
  receivedAmount: string;
  deltaLabel?: string;
  onSend: () => void;
}

const SendableMobileCard: FC<SendableMobileCardProps> = ({
  sendableAmount,
  receivedAmount,
  deltaLabel,
  onSend,
}) => (
  <Card className="mx-1 gap-0 overflow-hidden py-0">
    <div className="bg-primary-soft px-[18px] py-[18px]">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="text-xs font-semibold text-[#7A5A2E]">
            送れるサンクス
          </div>
          <div className="mt-1.5 flex items-baseline gap-1.5">
            <span className="text-[40px] font-extrabold leading-none tracking-[-1px] text-text-primary">
              {sendableAmount}
            </span>
            <span className="text-sm font-bold text-[#7A5A2E]">THX</span>
          </div>
        </div>
        <div className="flex size-11 items-center justify-center rounded-full bg-primary text-white">
          <Icon name="sparkle" size={22} />
        </div>
      </div>
      <div className="mt-3 flex items-baseline justify-between text-xs text-[#7A5A2E]">
        <span>
          受け取った:{" "}
          <strong className="text-text-primary">{receivedAmount} THX</strong>
        </span>
        {deltaLabel && <span>{deltaLabel}</span>}
      </div>
    </div>
    <div className="p-3.5">
      <Button variant="primary" full onClick={onSend}>
        <Icon name="send" size={18} />
        サンクスを送る
      </Button>
    </div>
  </Card>
);

interface WeeklyBalanceCardProps {
  sendableAmount: string;
  deltaLabel?: string;
  onSend: () => void;
}

const WeeklyBalanceCard: FC<WeeklyBalanceCardProps> = ({
  sendableAmount,
  deltaLabel,
  onSend,
}) => (
  <Card
    className="gap-4 border-0 py-5 text-[#3D2D14]"
    style={{ background: "linear-gradient(160deg, #FFD668, #F5B82E)" }}
  >
    <div className="px-5">
      <div className="text-xs font-bold opacity-70">今週の残高</div>
      <div className="mt-2.5 mb-1 text-[56px] font-extrabold leading-none tracking-[-2px]">
        {sendableAmount}
        <span className="ml-1.5 text-lg opacity-80">THX</span>
      </div>
      <div className="text-xs opacity-80">
        送付可能量{deltaLabel ? ` ・ ${deltaLabel}` : ""}
      </div>
    </div>
    <div className="px-5">
      <Button
        variant="primary"
        full
        onClick={onSend}
        className="bg-[#3D2D14] text-[#FFD668] hover:brightness-110"
      >
        <Icon name="send" size={16} />
        サンクスを送る
      </Button>
    </div>
  </Card>
);

interface MyDutyCardProps {
  treeId: string;
  hatId: `0x${string}`;
  imageUri?: string;
  detailsUri?: string;
  myAddress: `0x${string}`;
  size?: "lg" | "sm";
}

const MyDutyCard: FC<MyDutyCardProps> = ({
  treeId,
  hatId,
  imageUri,
  detailsUri,
  myAddress,
  size = "lg",
}) => {
  const detail = useHatDetail(detailsUri);
  const imageUrl = ipfs2https(imageUri);
  const isLg = size === "lg";
  const name = detail?.data?.name ?? "当番";
  return (
    <Link
      to={`/${treeId}/${hatId}/${myAddress}`}
      className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 rounded-md"
    >
      <Card
        className={cn(
          "flex-row items-center gap-3 py-0 transition-colors hover:bg-bg",
          isLg
            ? "px-3.5 py-3.5"
            : "border-0 bg-[#FBF8F1] px-4 py-3 shadow-none",
        )}
      >
        <div
          className={cn(
            "flex shrink-0 items-center justify-center overflow-hidden",
            isLg
              ? "size-11 rounded-sm bg-[#F2EAD9]"
              : "size-9 rounded-xs bg-[#D6B995]/30",
          )}
        >
          {imageUrl ? (
            <img src={imageUrl} alt="" className="size-full object-cover" />
          ) : (
            <Icon
              name="duty"
              size={isLg ? 22 : 18}
              className="text-[#7A5A2E]"
            />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div
            className={cn(
              "truncate font-bold text-text-primary",
              isLg ? "text-[15px]" : "text-[13px]",
            )}
          >
            {name}
          </div>
          {isLg && detail?.data?.description && (
            <div className="mt-0.5 truncate text-xs text-text-secondary">
              {detail.data.description}
            </div>
          )}
        </div>
        {isLg ? (
          <Badge kind="lead">担当中</Badge>
        ) : (
          <Icon
            name="chevron-right"
            size={14}
            className="text-text-secondary"
          />
        )}
      </Card>
    </Link>
  );
};

interface ActivityListProps {
  isLoading: boolean;
  items: ActivityItem[];
  variant?: "card" | "flat";
}

const ActivityList: FC<ActivityListProps> = ({
  isLoading,
  items,
  variant = "card",
}) => {
  const isFlat = variant === "flat";
  if (isLoading && items.length === 0) {
    const skeletons = [{ id: "row-a" }, { id: "row-b" }, { id: "row-c" }];
    const skeletonBody = skeletons.map((s, i) => (
      <Fragment key={s.id}>
        <div className="flex items-center gap-3 px-4 py-3">
          <div className="size-9 shrink-0 animate-pulse rounded-full bg-[#F0EBDE]" />
          <div className="min-w-0 flex-1">
            <div className="h-3 w-32 animate-pulse rounded bg-[#F0EBDE]" />
            <div className="mt-2 h-2.5 w-16 animate-pulse rounded bg-[#F0EBDE]" />
          </div>
        </div>
        {i < skeletons.length - 1 && <Divider inset={64} />}
      </Fragment>
    ));
    return isFlat ? (
      <div>{skeletonBody}</div>
    ) : (
      <Card className="mx-1 gap-0 overflow-hidden py-0">{skeletonBody}</Card>
    );
  }
  if (items.length === 0) {
    const empty = (
      <p className="px-5 py-4 text-center text-[13px] text-text-secondary">
        アクティビティはまだありません
      </p>
    );
    return isFlat ? empty : <Card className="mx-1 py-6">{empty}</Card>;
  }
  const rows = items.map((item, i) => (
    <Fragment key={item.id}>
      <ActivityRow item={item} />
      {i < items.length - 1 && <Divider inset={64} />}
    </Fragment>
  ));
  if (isFlat) return <div>{rows}</div>;
  return <Card className="mx-1 gap-0 overflow-hidden py-0">{rows}</Card>;
};

const ActivityRow: FC<{ item: ActivityItem }> = ({ item }) => {
  const isSent = item.direction === "sent";
  const accentClass = isSent ? "text-primary" : "text-contrib";
  const ringClass = isSent ? "ring-primary/20" : "ring-contrib/20";
  const iconName = isSent ? "send" : "heart";
  const counterpartLabel =
    item.direction === "received"
      ? " さんから"
      : item.direction === "sent"
        ? " さんへ"
        : " → ";
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <div
        className={cn(
          "flex size-9 shrink-0 items-center justify-center rounded-full bg-card ring-[1.5px]",
          accentClass,
          ringClass,
        )}
      >
        <Icon name={iconName} size={18} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-[13px] leading-tight text-text-primary">
          <strong className="font-semibold">{item.counterpartName}</strong>
          <span className="text-text-secondary">{counterpartLabel}</span>
        </div>
        {item.message && (
          <div className="mt-0.5 truncate text-xs leading-tight text-text-secondary">
            {item.message}
          </div>
        )}
        <div className="mt-0.5 text-[11px] text-text-secondary">
          {item.relativeTime}
        </div>
      </div>
      <div
        className={cn(
          "text-[13px] font-bold",
          isSent ? "text-text-secondary" : "text-contrib",
        )}
      >
        {isSent ? "−" : "+"}
        {item.amount} THX
      </div>
    </div>
  );
};

const QuestRow: FC<{ quest: Quest }> = ({ quest }) => {
  const amount = (() => {
    try {
      return Number(formatEther(BigInt(quest.amount))).toLocaleString();
    } catch {
      return "0";
    }
  })();
  const isReview = quest.status === "PendingReview";
  return (
    <div className="flex flex-col gap-1.5 rounded-sm border bg-[#FBF8F1] px-3.5 py-3">
      <div className="flex items-center justify-between gap-2">
        <div className="truncate text-[13px] font-bold">
          Quest #{quest.questId}
        </div>
        <div className="text-xs font-bold text-primary">+{amount} THX</div>
      </div>
      <div className="flex items-center gap-2">
        <Badge kind={isReview ? "info" : "lead"}>
          {isReview ? "確認待ち" : "募集中"}
        </Badge>
        {quest.submitter && (
          <span className="text-[11px] text-text-secondary">
            {abbreviateAddress(quest.submitter as `0x${string}`)}
          </span>
        )}
      </div>
    </div>
  );
};
