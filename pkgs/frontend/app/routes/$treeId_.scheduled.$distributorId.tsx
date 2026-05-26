import { useQuery } from "@tanstack/react-query";
import dayjs from "dayjs";
import {
  type ScheduledDistributorRule,
  useScheduledDistributor,
  useScheduledDistributorDetail,
} from "hooks/useScheduledDistributor";
import { chainId as currentChainId } from "hooks/useViem";
import { type FC, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { toast } from "sonner";
import { abbreviateAddress } from "utils/wallet";
import { type Address, formatUnits, parseUnits } from "viem";
import { SectionLabel } from "~/components/composite/section-label";
import { ScreenHeader } from "~/components/layout/ScreenHeader";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import { Heading } from "~/components/ui/heading";
import { Input } from "~/components/ui/input";
import { Typography } from "~/components/ui/typography";
import { findTokenPreset } from "~/lib/tokens";

const STATUS_LABEL: Record<string, string> = {
  Pending: "予約中",
  Executed: "実行済み",
  Reclaimed: "回収済み",
};

const tokenLabel = (address: string) => {
  const preset = findTokenPreset(currentChainId, address);
  return preset
    ? `${preset.symbol}`
    : abbreviateAddress(address as `0x${string}`);
};

const tokenDecimals = (address: string) =>
  findTokenPreset(currentChainId, address)?.decimals ?? 18;

const formatRaw = (raw: bigint | string, address: string) => {
  try {
    const b = typeof raw === "bigint" ? raw : BigInt(raw);
    return formatUnits(b, tokenDecimals(address));
  } catch {
    return String(raw);
  }
};

const ScheduledDetail: FC = () => {
  const { treeId, distributorId } = useParams();
  const navigate = useNavigate();
  const id = (distributorId || "").toLowerCase();
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

  const isPast = useMemo(() => {
    if (!rule) return false;
    return BigInt(Math.floor(Date.now() / 1000)) >= rule.scheduledDate;
  }, [rule]);

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
    await deposit(activeDepositToken as Address, amount);
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
    await execute(wearersByHat);
    ruleQuery.refetch();
    detail.refetch();
  };

  const handleReclaim = async () => {
    await reclaim();
    ruleQuery.refetch();
    detail.refetch();
  };

  return (
    <div className="pb-8">
      <ScreenHeader
        title="予約分配"
        onBack={() => navigate(`/${treeId}/scheduled`)}
      />
      <div className="mx-auto flex max-w-[640px] flex-col gap-4 px-4 pt-4">
        <Card className="gap-3 px-5 py-5">
          <Heading variant="h3" level={2}>
            {abbreviateAddress((id || "0x0") as `0x${string}`)}
          </Heading>
          {sd && (
            <Typography as="div" variant="bodySm" tone="secondary">
              {STATUS_LABEL[sd.status] ?? sd.status} ・ 締切{" "}
              {dayjs(Number(sd.scheduledDate) * 1000).format(
                "YYYY/MM/DD HH:mm",
              )}
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

        <SectionLabel>確定者</SectionLabel>
        <Card className="gap-2 px-5 py-5">
          {rule ? (
            rule.confirmedWearers.map((group, i) => (
              <div key={`${rule.hatIds[i]?.toString() ?? i}`}>
                <Typography as="div" variant="micro" tone="secondary">
                  Hat #{rule.hatIds[i]?.toString().slice(0, 12)}…
                </Typography>
                <ul className="mt-1 flex flex-wrap gap-1.5">
                  {group.map((addr) => (
                    <li
                      key={addr}
                      className="rounded-full bg-[#F0EBE0] px-2 py-0.5 text-[11px] font-semibold text-text-primary"
                    >
                      {abbreviateAddress(addr)}
                    </li>
                  ))}
                </ul>
              </div>
            ))
          ) : (
            <Typography variant="bodySm" tone="secondary">
              読み込み中…
            </Typography>
          )}
        </Card>

        <SectionLabel>ライブプレビュー</SectionLabel>
        <Card className="gap-2 px-5 py-5">
          {previewQuery.isLoading ? (
            <Typography variant="bodySm" tone="secondary">
              計算中…
            </Typography>
          ) : previewQuery.data ? (
            (() => {
              const [recipients, allocations, total] = previewQuery.data;
              return (
                <ul className="flex flex-col gap-1">
                  {recipients.map((addr, i) => (
                    <li
                      key={`${addr}-${allocations[i]?.toString() ?? ""}`}
                      className="flex items-center justify-between text-[12px]"
                    >
                      <Typography variant="bodySm" as="span" truncate>
                        {abbreviateAddress(addr)}
                      </Typography>
                      <Typography
                        as="span"
                        variant="bodySm"
                        weight="bold"
                        className="tabular-nums"
                      >
                        {total > 0n
                          ? (
                              (Number(allocations[i]) / Number(total)) *
                              100
                            ).toFixed(2)
                          : "0.00"}
                        %
                      </Typography>
                    </li>
                  ))}
                </ul>
              );
            })()
          ) : (
            <Typography variant="bodySm" tone="secondary">
              プレビューを取得できませんでした
            </Typography>
          )}
        </Card>

        {sd && sd.deposits.length > 0 && (
          <>
            <SectionLabel>デポジット履歴</SectionLabel>
            <Card className="gap-2 px-5 py-4">
              <ul className="flex flex-col gap-1">
                {sd.deposits.map((d) => (
                  <li
                    key={d.id}
                    className="flex items-center justify-between text-[12px]"
                  >
                    <Typography variant="micro" tone="secondary">
                      {dayjs(Number(d.blockTimestamp) * 1000).format(
                        "MM/DD HH:mm",
                      )}{" "}
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
          </>
        )}

        {rule && !rule.executed && !rule.reclaimed && tokens.length > 0 && (
          <>
            <SectionLabel>原資を預ける</SectionLabel>
            <Card className="gap-3 px-5 py-5">
              <Typography variant="micro" tone="secondary">
                ⚠️ 預け入れた合計額は、締切後の execute 実行時に
                <b>全額</b>
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
              <Button
                variant="primary"
                onClick={handleDeposit}
                disabled={isLoading}
              >
                預け入れ
              </Button>
            </Card>
          </>
        )}

        {rule && !rule.executed && !rule.reclaimed && isPast && (
          <Card className="gap-2 px-5 py-5">
            <Heading variant="h5" level={3}>
              実行
            </Heading>
            <Typography variant="bodySm" tone="secondary">
              締切を過ぎました。確定者リストを渡して分配を実行します。
            </Typography>
            <Button
              variant="primary"
              onClick={handleExecute}
              disabled={isLoading}
            >
              実行
            </Button>
          </Card>
        )}

        {rule && !rule.executed && !rule.reclaimed && isPast && (
          <Card className="gap-2 px-5 py-5">
            <Heading variant="h5" level={3}>
              回収
            </Heading>
            <Typography variant="bodySm" tone="secondary">
              締切＋72時間が経過すると、スケジューラまたはバックアップウォレットが原資を回収できます。
            </Typography>
            <Button
              variant="secondary"
              onClick={handleReclaim}
              disabled={isLoading}
            >
              回収を試みる
            </Button>
          </Card>
        )}
      </div>
    </div>
  );
};

export default ScheduledDetail;
