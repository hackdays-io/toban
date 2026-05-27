import { useQueries, useQuery } from "@tanstack/react-query";
import axios from "axios";
import dayjs from "dayjs";
import { useNamesByAddresses } from "hooks/useENS";
import { useErc20Meta } from "hooks/useErc20Meta";
import { useGetHats } from "hooks/useHats";
import {
  type ScheduledDistributorRule,
  useScheduledDistributor,
  useScheduledDistributorDetail,
} from "hooks/useScheduledDistributor";
import { useActiveWallet } from "hooks/useWallet";
import type { NameData } from "namestone-sdk";
import { type FC, useMemo, useState } from "react";
import { useParams } from "react-router";
import { toast } from "sonner";
import type { HatsDetailSchama } from "types/hats";
import { ipfs2https } from "utils/ipfs";
import { abbreviateAddress } from "utils/wallet";
import { type Address, formatUnits, parseUnits } from "viem";
import { Breadcrumb } from "~/components/composite/breadcrumb";
import { PageContainer } from "~/components/layout/PageContainer";
import { SplitBreakdownCard } from "~/components/splits/SplitBreakdownCard";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import { Heading } from "~/components/ui/heading";
import { Input } from "~/components/ui/input";
import { Typography } from "~/components/ui/typography";

const STATUS_LABEL: Record<string, string> = {
  Pending: "予約中",
  Executed: "実行済み",
  Reclaimed: "回収済み",
};

const ScheduledDetail: FC = () => {
  const { treeId, distributorId } = useParams();
  const id = (distributorId || "").toLowerCase();
  const { wallet } = useActiveWallet();
  const detail = useScheduledDistributorDetail(id);
  const { readRule, previewWithRule, deposit, execute, reclaim, isLoading } =
    useScheduledDistributor(id as Address);

  const ruleQuery = useQuery<ScheduledDistributorRule | null>({
    queryKey: ["scheduled-distributor-rule", id],
    enabled: !!id,
    queryFn: () => readRule(),
  });
  const rule = ruleQuery.data;

  const previewQuery = useQuery({
    queryKey: [
      "scheduled-distributor-preview",
      id,
      rule?.scheduledDate?.toString(),
    ],
    enabled: !!rule,
    queryFn: async () => {
      if (!rule) return null;
      return await previewWithRule(rule, rule.confirmedWearers);
    },
  });

  // Selected token for the deposit row defaults to the first configured token.
  const [depositToken, setDepositToken] = useState<string>("");
  const [depositAmount, setDepositAmount] = useState("");

  const sd = detail.data?.scheduledDistributor;

  const tokens = useMemo(() => rule?.tokens ?? [], [rule]);
  const activeDepositToken =
    depositToken || (tokens.length > 0 ? tokens[0] : "");

  // Resolve ticker + decimals on-chain for every token referenced on this page
  // (rule.tokens + deposit history) so custom ERC20s outside the preset list
  // still render the correct symbol and amount.
  const tokenAddressesForMeta = useMemo(() => {
    const set = new Set<string>();
    for (const t of tokens) set.add(t.toLowerCase());
    for (const d of sd?.deposits ?? [])
      if (d.token) set.add(d.token.toLowerCase());
    return Array.from(set);
  }, [tokens, sd?.deposits]);
  const { byAddress: erc20MetaByAddress } = useErc20Meta(tokenAddressesForMeta);

  const tokenDecimals = (address: string) =>
    erc20MetaByAddress.get(address.toLowerCase())?.decimals ?? 18;
  const tokenLabel = (address: string) =>
    erc20MetaByAddress.get(address.toLowerCase())?.symbol ??
    abbreviateAddress(address as `0x${string}`);
  const formatRaw = (raw: bigint | string, address: string) => {
    try {
      const b = typeof raw === "bigint" ? raw : BigInt(raw);
      return formatUnits(b, tokenDecimals(address));
    } catch {
      return String(raw);
    }
  };

  const isPast = useMemo(() => {
    if (!rule) return false;
    return BigInt(Math.floor(Date.now() / 1000)) >= rule.scheduledDate;
  }, [rule]);

  // Reclaim is gated to (scheduledDate + 72h) on-chain. We mirror that
  // here so the button only enables once the contract will accept the call.
  const isReclaimable = useMemo(() => {
    if (!rule) return false;
    const reclaimableAt = rule.scheduledDate + 72n * 3600n;
    return BigInt(Math.floor(Date.now() / 1000)) >= reclaimableAt;
  }, [rule]);

  const isBackupWallet = useMemo(() => {
    const current = wallet?.account?.address?.toLowerCase();
    return !!current && !!rule && current === rule.backupWallet.toLowerCase();
  }, [wallet, rule]);

  // ── Hat names (Hats subgraph + IPFS details) ──
  const hatIdStrings = useMemo(
    () => (rule?.hatIds ?? []).map((h) => h.toString()),
    [rule],
  );
  const { hats } = useGetHats(hatIdStrings);
  const hatDetailsQueries = useQueries({
    queries: (hats ?? []).map((h) => {
      const httpsUri = ipfs2https(h.details);
      return {
        queryKey: ["hats-detail", httpsUri],
        enabled: !!httpsUri,
        staleTime: 1000 * 60 * 60,
        queryFn: async (): Promise<HatsDetailSchama | undefined> => {
          if (!httpsUri) return;
          const { data } = await axios.get<HatsDetailSchama>(httpsUri);
          return data;
        },
      };
    }),
  });
  const hatNameById = useMemo(() => {
    // Hats subgraph returns `id` as a hex `0x…` string, but the contract-side
    // hat id is a bigint (rendered to decimal via `.toString()`). Normalise
    // the map key to the decimal form so lookups by `rule.hatIds[i]` hit.
    const m = new Map<string, string>();
    (hats ?? []).forEach((h, i) => {
      const name = hatDetailsQueries[i]?.data?.data?.name;
      if (h.id && name) m.set(BigInt(h.id).toString(), name);
    });
    return m;
  }, [hats, hatDetailsQueries]);

  // ── Wearer + preview-recipient name resolution (Namestone) ──
  const previewRecipientsRaw = previewQuery.data?.[0] ?? [];
  const allAddresses = useMemo(() => {
    const set = new Set<string>();
    for (const group of rule?.confirmedWearers ?? []) {
      for (const a of group) if (a) set.add(a.toLowerCase());
    }
    for (const a of previewRecipientsRaw) if (a) set.add(a.toLowerCase());
    return Array.from(set);
  }, [rule, previewRecipientsRaw]);
  const { names } = useNamesByAddresses(allAddresses);
  const nameByAddress = useMemo(() => {
    const m = new Map<string, NameData>();
    for (const group of names) {
      const entry = group[0];
      if (entry?.address) m.set(entry.address.toLowerCase(), entry);
    }
    return m;
  }, [names]);
  const breakdownNameByAddress = useMemo(() => {
    const m = new Map<string, { name?: string; avatarUrl?: string }>();
    for (const [addr, entry] of nameByAddress) {
      m.set(addr, {
        name: entry.name,
        avatarUrl: ipfs2https(entry.text_records?.avatar),
      });
    }
    return m;
  }, [nameByAddress]);

  const previewRows = useMemo(() => {
    if (!previewQuery.data) return [];
    const [recipients, allocations, total] = previewQuery.data;
    if (total === 0n) return [];
    // The same wearer can appear in multiple hats; SplitsCreator surfaces them
    // as separate entries in the preview. Collapse to one row per address by
    // summing allocations so the breakdown shows each person once.
    const sums = new Map<string, bigint>();
    recipients.forEach((addr, i) => {
      const lc = addr.toLowerCase();
      sums.set(lc, (sums.get(lc) ?? 0n) + (allocations[i] ?? 0n));
    });
    return Array.from(sums.entries())
      .map(([address, alloc]) => ({
        address,
        pct: (Number(alloc) / Number(total)) * 100,
      }))
      .sort((a, b) => b.pct - a.pct);
  }, [previewQuery.data]);

  const labelFor = (addr: string) =>
    nameByAddress.get(addr.toLowerCase())?.name ??
    abbreviateAddress(addr as `0x${string}`);

  const handleDeposit = async () => {
    if (!rule || !activeDepositToken) return;
    if (!depositAmount) {
      toast.error("数量を入力してください");
      return;
    }
    let amount: bigint;
    try {
      amount = parseUnits(depositAmount, tokenDecimals(activeDepositToken));
    } catch {
      toast.error("数量の形式が不正です");
      return;
    }
    if (amount <= 0n) {
      toast.error("正の金額を入力してください");
      return;
    }
    // The hook catches errors internally and returns undefined on failure
    // (the failure toast comes from the hook). Gate the input-clear + refetch
    // on actual success so a reverted/rejected tx preserves the typed amount.
    const receipt = await deposit(activeDepositToken as Address, amount);
    if (!receipt) return;
    setDepositAmount("");
    ruleQuery.refetch();
    detail.refetch();
  };

  const handleExecute = async () => {
    if (!rule) return;
    // Default: pass back the confirmed wearer set. A more sophisticated UI
    // would let the caller refresh and include newly-eligible wearers.
    const wearersByHat = rule.confirmedWearers.map(
      (group) => group.filter(Boolean) as Address[],
    );
    const receipt = await execute(wearersByHat);
    if (!receipt) return;
    ruleQuery.refetch();
    detail.refetch();
  };

  const handleReclaim = async () => {
    const receipt = await reclaim();
    if (!receipt) return;
    ruleQuery.refetch();
    detail.refetch();
  };

  const headerLabel = sd?.scheduledDate
    ? dayjs(Number(sd.scheduledDate) * 1000).format("YYYY/MM/DD HH:mm")
    : "予約詳細";

  const mainBlock = (
    <Card className="gap-3 px-5 py-5">
      <Heading variant="h3" level={2}>
        {abbreviateAddress((id || "0x0") as `0x${string}`)}
      </Heading>
      {sd && (
        <Typography as="div" variant="bodySm" tone="secondary">
          {STATUS_LABEL[sd.status] ?? sd.status} ・ 締切{" "}
          {dayjs(Number(sd.scheduledDate) * 1000).format("YYYY/MM/DD HH:mm")}
        </Typography>
      )}
      {rule && (
        <div className="grid grid-cols-1 gap-2 pt-2">
          <ul className="flex flex-col gap-1.5">
            {rule.tokens.map((addr, i) => {
              const lc = addr.toLowerCase();
              const subgraphBal = sd?.tokenBalances.find(
                (b) => b.token.toLowerCase() === lc,
              );
              const totalDeposited = subgraphBal?.totalDeposited ?? "0";
              return (
                <li
                  key={addr}
                  className="flex flex-col gap-1 rounded-[10px] bg-[#F0EBE0] px-3 py-2"
                >
                  <div className="flex items-center justify-between">
                    <Typography variant="bodySm" weight="bold">
                      {tokenLabel(addr)}
                    </Typography>
                    <Typography
                      variant="bodySm"
                      weight="bold"
                      className="tabular-nums"
                    >
                      {formatRaw(rule.tokenBalances[i] ?? 0n, addr)}
                    </Typography>
                  </div>
                  <div className="flex items-center justify-between">
                    <Typography variant="micro" tone="secondary">
                      累計デポジット
                    </Typography>
                    <Typography
                      variant="micro"
                      tone="secondary"
                      className="tabular-nums"
                    >
                      {formatRaw(totalDeposited, addr)}
                    </Typography>
                  </div>
                </li>
              );
            })}
          </ul>
          <Typography
            as="div"
            variant="micro"
            tone="secondary"
            className="mt-1"
          >
            バックアップ: {abbreviateAddress(rule.backupWallet)}
          </Typography>
        </div>
      )}
    </Card>
  );

  const confirmedBlock = (
    <Card className="gap-3 px-5 py-5">
      <Heading variant="h5" level={3}>
        受け取り確定メンバー
      </Heading>
      {rule ? (
        rule.confirmedWearers.map((group, i) => {
          const hatId = rule.hatIds[i]?.toString();
          const hatName = hatId
            ? (hatNameById.get(hatId) ?? `Hat #${hatId.slice(0, 12)}…`)
            : `Hat #${i + 1}`;
          // The same wearer can be confirmed twice for one hat (e.g.
          // legacy on-chain state); dedupe so React keys stay unique.
          const uniqueWearers = Array.from(
            new Map(group.map((a) => [a.toLowerCase(), a])).values(),
          );
          return (
            <div key={hatId ?? i}>
              <Typography as="div" variant="bodySm" weight="bold">
                {hatName}
              </Typography>
              {uniqueWearers.length > 0 ? (
                <ul className="mt-1.5 flex flex-wrap gap-1.5">
                  {uniqueWearers.map((addr) => (
                    <li
                      key={addr.toLowerCase()}
                      className="rounded-full bg-[#F0EBE0] px-2 py-0.5 text-[11px] font-semibold text-text-primary"
                    >
                      {labelFor(addr)}
                    </li>
                  ))}
                </ul>
              ) : (
                <Typography
                  as="div"
                  variant="micro"
                  tone="secondary"
                  className="mt-1"
                >
                  確定者なし
                </Typography>
              )}
            </div>
          );
        })
      ) : (
        <Typography variant="bodySm" tone="secondary">
          読み込み中…
        </Typography>
      )}
    </Card>
  );

  const previewBlock = previewQuery.isLoading ? (
    <Card className="gap-2 px-5 py-5">
      <Heading variant="h5" level={3}>
        現時点の分配比率
      </Heading>
      <Typography variant="bodySm" tone="secondary">
        計算中…
      </Typography>
    </Card>
  ) : previewQuery.data ? (
    <SplitBreakdownCard
      title="現時点の分配比率"
      recipients={previewRows}
      nameByAddress={breakdownNameByAddress}
      emptyLabel="分配先がありません"
    />
  ) : (
    <Card className="gap-2 px-5 py-5">
      <Heading variant="h5" level={3}>
        現時点の分配比率
      </Heading>
      <Typography variant="bodySm" tone="secondary">
        プレビューを取得できませんでした
      </Typography>
    </Card>
  );

  const depositHistoryBlock =
    sd && sd.deposits.length > 0 ? (
      <Card className="gap-3 px-5 py-5">
        <Heading variant="h5" level={3}>
          預け入れ履歴
        </Heading>
        <ul className="flex flex-col gap-1">
          {sd.deposits.map((d) => (
            <li
              key={d.id}
              className="flex items-center justify-between text-[12px]"
            >
              <Typography variant="micro" tone="secondary">
                {dayjs(Number(d.blockTimestamp) * 1000).format("MM/DD HH:mm")}{" "}
                ・ {abbreviateAddress(d.from as `0x${string}`)}
              </Typography>
              <Typography
                variant="bodySm"
                weight="bold"
                className="tabular-nums"
              >
                {formatRaw(d.amount, d.token)} {tokenLabel(d.token)}
              </Typography>
            </li>
          ))}
        </ul>
      </Card>
    ) : null;

  const depositFormBlock =
    rule && !rule.executed && !rule.reclaimed && tokens.length > 0 ? (
      <Card className="gap-3 px-5 py-5">
        <Heading variant="h5" level={3}>
          預け入れ
        </Heading>
        <Typography variant="micro" tone="secondary">
          ⚠️ 預け入れた合計額は、締切後の execute 実行時に<b>全額</b>
          分配されます。目標額を超えて入れた場合、超過分も配布対象になります。
        </Typography>
        <select
          value={activeDepositToken}
          onChange={(e) => setDepositToken(e.target.value)}
          className="h-10 rounded-[10px] border border-border bg-surface px-3 text-[14px] text-text-primary outline-none focus:border-primary"
        >
          {tokens.map((t) => (
            <option key={t} value={t}>
              {tokenLabel(t)}
            </option>
          ))}
        </select>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            inputMode="decimal"
            placeholder={`数量 (${tokenLabel(activeDepositToken)})`}
            value={depositAmount}
            onChange={(e) => setDepositAmount(e.target.value)}
            className="flex-1"
          />
          <Typography
            variant="bodySm"
            tone="secondary"
            className="w-16 text-right"
          >
            {tokenLabel(activeDepositToken)}
          </Typography>
        </div>
        <Button variant="primary" onClick={handleDeposit} disabled={isLoading}>
          預け入れ
        </Button>
      </Card>
    ) : null;

  const executeBlock =
    rule && !rule.executed && !rule.reclaimed && isPast ? (
      <Card className="gap-2 px-5 py-5">
        <Heading variant="h5" level={3}>
          分配実行
        </Heading>
        <Typography variant="bodySm" tone="secondary">
          締切を過ぎました。確定者リストを渡して分配を実行します。
          <br />
          誰でも実行できます（ガス代は実行者が負担）。
        </Typography>
        <Button variant="primary" onClick={handleExecute} disabled={isLoading}>
          分配実行
        </Button>
      </Card>
    ) : null;

  const reclaimBlock =
    rule && !rule.executed && !rule.reclaimed && isPast ? (
      <Card className="gap-2 px-5 py-5">
        <Heading variant="h5" level={3}>
          回収
        </Heading>
        <Typography variant="bodySm" tone="secondary">
          締切＋72時間が経過すると、バックアップウォレットが原資を回収できます。
        </Typography>
        <Button
          variant="secondary"
          onClick={handleReclaim}
          disabled={isLoading || !isReclaimable || !isBackupWallet}
        >
          回収を試みる
        </Button>
      </Card>
    ) : null;

  return (
    <PageContainer className="pt-2 pb-10 md:pt-4">
      <Breadcrumb
        className="mb-3 px-1"
        items={[
          { label: "予約分配", to: `/${treeId}/scheduled` },
          { label: headerLabel },
        ]}
      />

      {/* Mobile: single column. */}
      <div className="flex flex-col gap-4 px-1 md:hidden">
        {mainBlock}
        {confirmedBlock}
        {previewBlock}
        {depositHistoryBlock}
        {depositFormBlock}
        {executeBlock}
        {reclaimBlock}
      </div>

      {/* Desktop: 2-column. Main info / data on the left (2fr), action cards on the right (1fr). */}
      <div className="hidden grid-cols-[2fr_1fr] gap-6 pt-2 md:grid">
        <div className="flex min-w-0 flex-col gap-4">
          {mainBlock}
          {confirmedBlock}
          {previewBlock}
          {depositHistoryBlock}
        </div>
        <aside className="flex flex-col gap-4">
          {depositFormBlock}
          {executeBlock}
          {reclaimBlock}
        </aside>
      </div>
    </PageContainer>
  );
};

export default ScheduledDetail;
