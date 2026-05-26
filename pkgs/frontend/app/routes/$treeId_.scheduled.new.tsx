import { useAssignableHats } from "hooks/useHats";
import {
  useScheduledDistributor,
  useScheduledDistributorFactory,
} from "hooks/useScheduledDistributor";
import { chainId as currentChainId } from "hooks/useViem";
import { useGetWorkspace } from "hooks/useWorkspace";
import { type FC, useMemo, useState } from "react";
import { LuPlus, LuTrash2 } from "react-icons/lu";
import { Link, useNavigate, useParams } from "react-router";
import { toast } from "sonner";
import {
  type Address,
  type Hex,
  keccak256,
  parseUnits,
  stringToHex,
} from "viem";
import { FieldLabel } from "~/components/composite/field-label";
import { SectionLabel } from "~/components/composite/section-label";
import { StepBar } from "~/components/composite/step-bar";
import { TokenSelector } from "~/components/composite/token-selector";
import { ScreenHeader } from "~/components/layout/ScreenHeader";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import { Checkbox } from "~/components/ui/checkbox";
import { Heading } from "~/components/ui/heading";
import { Input } from "~/components/ui/input";
import { Typography } from "~/components/ui/typography";
import { findTokenPreset } from "~/lib/tokens";

type TokenRow = {
  rowId: string;
  address: string;
  /** Defaults to preset decimals once one is picked. */
  decimals: number;
};

const newTokenRow = (): TokenRow => ({
  rowId: `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
  address: "",
  decimals: 18,
});

type DepositRow = TokenRow & {
  /** Human-readable amount (e.g. "500"). */
  amount: string;
  status: "idle" | "submitting" | "done";
};

const ScheduledNew: FC = () => {
  const { treeId } = useParams();
  const navigate = useNavigate();
  const { data: workspaceData } = useGetWorkspace({
    workspaceId: treeId || "",
  });
  const {
    createScheduledDistributor,
    factoryAddress,
    isLoading: isCreating,
  } = useScheduledDistributorFactory();

  const assignableHats = useAssignableHats(Number(treeId));

  // Wizard step. 0 = schedule form, 1 = deposit, 2 = done.
  const [step, setStep] = useState<0 | 1 | 2>(0);
  const [distributorAddress, setDistributorAddress] = useState<Address | null>(
    null,
  );

  // --- Step 0 state ---
  const [scheduledAt, setScheduledAt] = useState<string>("");
  const [backupWallet, setBackupWallet] = useState<string>("");
  const [tokenRows, setTokenRows] = useState<TokenRow[]>([newTokenRow()]);
  const [selectedHatIds, setSelectedHatIds] = useState<string[]>([]);

  // --- Step 1 state (deposits, seeded from step 0 tokens once created) ---
  const [depositRows, setDepositRows] = useState<DepositRow[]>([]);

  const splitsCreator = workspaceData?.workspace?.splitCreator as
    | Address
    | undefined;

  const eligibleHats = useMemo(() => {
    return (assignableHats ?? []).filter((h) => !!h.id);
  }, [assignableHats]);

  const toggleHat = (id: string) => {
    setSelectedHatIds((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id],
    );
  };

  const updateTokenRow = (rowId: string, patch: Partial<TokenRow>) => {
    setTokenRows((prev) =>
      prev.map((r) => (r.rowId === rowId ? { ...r, ...patch } : r)),
    );
  };

  const removeTokenRow = (rowId: string) => {
    setTokenRows((prev) =>
      prev.length <= 1 ? prev : prev.filter((r) => r.rowId !== rowId),
    );
  };

  // ---------------- Step 0: create ----------------

  const submitCreate = async () => {
    if (!splitsCreator) {
      toast.error("Workspace SplitsCreator が見つかりません");
      return;
    }
    if (!factoryAddress) {
      toast.error("VITE_SCHEDULED_DISTRIBUTOR_FACTORY_ADDRESS が未設定です");
      return;
    }
    if (!scheduledAt) {
      toast.error("締切日時を選択してください");
      return;
    }
    if (!backupWallet || !/^0x[0-9a-fA-F]{40}$/.test(backupWallet)) {
      toast.error("バックアップウォレットのアドレスを入力してください");
      return;
    }
    if (selectedHatIds.length === 0) {
      toast.error("対象ロールを選択してください");
      return;
    }

    const tokens: Address[] = [];
    const seen = new Set<string>();
    for (const row of tokenRows) {
      if (!row.address) {
        toast.error("配布トークンを選択してください");
        return;
      }
      if (!/^0x[0-9a-fA-F]{40}$/.test(row.address)) {
        toast.error(`トークンアドレスが不正です: ${row.address}`);
        return;
      }
      const lc = row.address.toLowerCase();
      if (seen.has(lc)) {
        toast.error("同じトークンを2回指定しています");
        return;
      }
      seen.add(lc);
      tokens.push(lc as Address);
    }

    const scheduledDate = BigInt(
      Math.floor(new Date(scheduledAt).getTime() / 1000),
    );
    const hatIds: bigint[] = [];
    const multiplierTops: bigint[] = [];
    const multiplierBottoms: bigint[] = [];
    const confirmedWearers: Address[][] = [];

    let totalConfirmed = 0;
    for (const hatId of selectedHatIds) {
      const hat = eligibleHats.find((h) => h.id === hatId);
      if (!hat) continue;
      hatIds.push(BigInt(hat.id || "0"));
      multiplierTops.push(1n);
      multiplierBottoms.push(1n);
      const wearers = (hat.wearers || [])
        .map((w) => w.id as Address)
        .filter((a): a is Address => !!a);
      confirmedWearers.push(wearers);
      totalConfirmed += wearers.length;
    }

    if (totalConfirmed < 2) {
      toast.error("確定者は合計2人以上必要です");
      return;
    }

    const salt = keccak256(
      stringToHex(`${treeId}-${Date.now()}-${Math.random()}`),
    ) as Hex;

    const distributor = await createScheduledDistributor({
      splitsCreator,
      tokens,
      depositor: backupWallet as Address,
      backupWallet: backupWallet as Address,
      scheduledDate,
      weights: {
        roleWeight: 1n,
        thanksTokenWeight: 0n,
        thanksTokenReceivedWeight: 95n,
        thanksTokenSentWeight: 5n,
      },
      hatIds,
      multiplierTops,
      multiplierBottoms,
      confirmedWearers,
      salt,
    });

    if (distributor) {
      setDistributorAddress(distributor);
      setDepositRows(
        tokenRows.map((r) => ({ ...r, amount: "", status: "idle" })),
      );
      setStep(1);
    }
  };

  return (
    <div className="pb-8">
      <ScreenHeader
        title={
          step === 0 ? "予約分配を作成" : step === 1 ? "原資を預ける" : "完了"
        }
        onBack={() => {
          if (step === 0) navigate(`/${treeId}/scheduled`);
          else if (step === 1) {
            // Allow going back to the form before any deposit happens; useful
            // if the user wants to abandon the deposit step.
            if (
              !depositRows.some((r) => r.status === "done") &&
              window.confirm(
                "預け入れをスキップしますか？（あとから詳細画面で預け入れできます）",
              )
            ) {
              setStep(2);
            }
          } else {
            navigate(`/${treeId}/scheduled`);
          }
        }}
      />
      <div className="mx-auto flex max-w-[640px] flex-col gap-4 px-4 pt-4">
        <StepBar total={3} current={step} className="mb-1" />

        {step === 0 && (
          <>
            <SectionLabel>基本</SectionLabel>
            <Card className="gap-4 px-5 py-5">
              <div>
                <FieldLabel htmlFor="scheduled-at">締切日時</FieldLabel>
                <Input
                  id="scheduled-at"
                  type="datetime-local"
                  value={scheduledAt}
                  onChange={(e) => setScheduledAt(e.target.value)}
                />
                <Typography
                  as="div"
                  variant="micro"
                  tone="secondary"
                  className="mt-1"
                >
                  この日時を過ぎると `execute()` が permissionless になります。
                </Typography>
              </div>
              <div>
                <FieldLabel htmlFor="backup">バックアップウォレット</FieldLabel>
                <Input
                  id="backup"
                  placeholder="0x…"
                  value={backupWallet}
                  onChange={(e) => setBackupWallet(e.target.value)}
                />
                <Typography
                  as="div"
                  variant="micro"
                  tone="secondary"
                  className="mt-1"
                >
                  締切後72時間以内に実行されなかった場合、この住所が回収できます。
                </Typography>
              </div>
            </Card>

            <SectionLabel>配布トークン</SectionLabel>
            <Card className="gap-4 px-5 py-5">
              {tokenRows.map((row, i) => (
                <div
                  key={row.rowId}
                  className="flex flex-col gap-2 rounded-[12px] border border-border-muted p-3"
                >
                  <div className="flex items-center justify-between">
                    <Typography variant="micro" tone="secondary">
                      トークン #{i + 1}
                    </Typography>
                    {tokenRows.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeTokenRow(row.rowId)}
                        className="text-text-secondary hover:text-text-primary"
                        aria-label="この行を削除"
                      >
                        <LuTrash2 size={14} />
                      </button>
                    )}
                  </div>
                  <TokenSelector
                    chainId={currentChainId}
                    value={row.address}
                    excludeAddresses={tokenRows
                      .filter((r) => r.rowId !== row.rowId)
                      .map((r) => r.address)
                      .filter(Boolean)}
                    onChange={({ address, preset }) =>
                      updateTokenRow(row.rowId, {
                        address,
                        decimals: preset?.decimals ?? 18,
                      })
                    }
                  />
                </div>
              ))}
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setTokenRows((prev) => [...prev, newTokenRow()])}
                className="self-start"
              >
                <LuPlus size={14} />
                トークンを追加
              </Button>
            </Card>

            <SectionLabel>対象ロール（確定者）</SectionLabel>
            <Card className="gap-3 px-5 py-5">
              {eligibleHats.length === 0 ? (
                <Typography variant="bodySm" tone="secondary">
                  利用可能なロールがありません
                </Typography>
              ) : (
                eligibleHats.map((hat) => {
                  const hatId = hat.id || "";
                  const checkboxId = `hat-checkbox-${hatId}`;
                  return (
                    <div key={hat.id} className="flex items-center gap-3">
                      <Checkbox
                        id={checkboxId}
                        checked={selectedHatIds.includes(hatId)}
                        onCheckedChange={() => toggleHat(hatId)}
                      />
                      <label
                        htmlFor={checkboxId}
                        className="min-w-0 flex-1 cursor-pointer"
                      >
                        <Typography variant="bodySm" as="div" truncate>
                          {(hat as { detailsDecoded?: { name?: string } })
                            .detailsDecoded?.name ??
                            `Hat ${hat.id?.slice(0, 10)}`}
                        </Typography>
                        <Typography variant="micro" tone="secondary" as="div">
                          確定者: {(hat.wearers || []).length}人
                        </Typography>
                      </label>
                    </div>
                  );
                })
              )}
            </Card>

            <Button
              variant="primary"
              onClick={submitCreate}
              disabled={isCreating}
              className="self-end"
            >
              {isCreating ? "作成中…" : "予約を作成して次へ"}
            </Button>
          </>
        )}

        {step === 1 && distributorAddress && (
          <DepositStep
            distributor={distributorAddress}
            rows={depositRows}
            setRows={setDepositRows}
            onDone={() => setStep(2)}
          />
        )}

        {step === 2 && distributorAddress && (
          <DoneStep
            treeId={treeId || ""}
            distributor={distributorAddress}
            depositRows={depositRows}
          />
        )}
      </div>
    </div>
  );
};

// ---------------- Step 1: deposit ----------------

const DepositStep: FC<{
  distributor: Address;
  rows: DepositRow[];
  setRows: React.Dispatch<React.SetStateAction<DepositRow[]>>;
  onDone: () => void;
}> = ({ distributor, rows, setRows, onDone }) => {
  const { deposit, isLoading } = useScheduledDistributor(distributor);

  const updateRow = (rowId: string, patch: Partial<DepositRow>) => {
    setRows((prev) =>
      prev.map((r) => (r.rowId === rowId ? { ...r, ...patch } : r)),
    );
  };

  const handleDeposit = async (row: DepositRow) => {
    if (!row.amount) {
      toast.error("数量を入力してください");
      return;
    }
    let amount: bigint;
    try {
      amount = parseUnits(row.amount, row.decimals);
    } catch {
      toast.error("数量の形式が不正です");
      return;
    }
    if (amount <= 0n) {
      toast.error("正の金額を入力してください");
      return;
    }
    updateRow(row.rowId, { status: "submitting" });
    const result = await deposit(row.address as Address, amount);
    updateRow(row.rowId, { status: result ? "done" : "idle" });
  };

  const allDone = rows.length > 0 && rows.every((r) => r.status === "done");
  const anyDone = rows.some((r) => r.status === "done");

  return (
    <>
      <SectionLabel>原資をデポジット</SectionLabel>
      <Card className="gap-3 px-5 py-5">
        <Typography variant="micro" tone="secondary">
          デポジットしたトークンは締切後の execute 実行時に
          <b>全額</b>分配されます。あとから詳細画面で追加することもできます。
        </Typography>
        {rows.map((row, i) => {
          const preset = findTokenPreset(currentChainId, row.address);
          const symbol = preset?.symbol ?? `Token #${i + 1}`;
          const isDone = row.status === "done";
          const isSubmitting = row.status === "submitting";
          return (
            <div
              key={row.rowId}
              className="flex flex-col gap-2 rounded-[12px] border border-border-muted p-3"
            >
              <div className="flex items-center justify-between">
                <Typography variant="bodySm" weight="bold">
                  {symbol}
                </Typography>
                {isDone && (
                  <Typography variant="micro" tone="success">
                    預入済
                  </Typography>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  inputMode="decimal"
                  placeholder={`数量 (${symbol})`}
                  value={row.amount}
                  disabled={isDone || isSubmitting}
                  onChange={(e) =>
                    updateRow(row.rowId, { amount: e.target.value })
                  }
                  className="flex-1"
                />
                <Button
                  variant="primary"
                  size="sm"
                  disabled={isDone || isSubmitting || isLoading}
                  onClick={() => handleDeposit(row)}
                >
                  {isDone ? "預入済" : isSubmitting ? "送信中…" : "預け入れる"}
                </Button>
              </div>
            </div>
          );
        })}
      </Card>

      <div className="flex justify-end gap-2">
        <Button variant="secondary" onClick={onDone}>
          {anyDone ? "完了" : "スキップ"}
        </Button>
        {allDone && (
          <Button variant="primary" onClick={onDone}>
            次へ
          </Button>
        )}
      </div>
    </>
  );
};

// ---------------- Step 2: done ----------------

const DoneStep: FC<{
  treeId: string;
  distributor: Address;
  depositRows: DepositRow[];
}> = ({ treeId, distributor, depositRows }) => {
  const depositedRows = depositRows.filter((r) => r.status === "done");
  return (
    <Card className="gap-3 px-5 py-6 text-center">
      <Heading variant="h3" level={2}>
        予約分配を作成しました
      </Heading>
      <Typography as="div" variant="bodySm" tone="secondary">
        締切日時を過ぎると、誰でも `execute()` を呼び出して分配を実行できます。
      </Typography>

      {depositedRows.length > 0 && (
        <div className="mt-2 flex flex-col gap-1.5">
          <Typography variant="micro" tone="secondary">
            預け入れたトークン
          </Typography>
          <ul className="flex flex-col gap-1">
            {depositedRows.map((row) => {
              const preset = findTokenPreset(currentChainId, row.address);
              return (
                <li
                  key={row.rowId}
                  className="flex items-center justify-between rounded-[10px] bg-[#F0EBE0] px-3 py-1.5"
                >
                  <Typography variant="bodySm" weight="bold">
                    {preset?.symbol ?? row.address.slice(0, 8)}
                  </Typography>
                  <Typography
                    variant="bodySm"
                    weight="bold"
                    className="tabular-nums"
                  >
                    {row.amount}
                  </Typography>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <div className="mt-4 flex justify-center gap-2">
        <Button asChild variant="primary">
          <Link to={`/${treeId}/scheduled/${distributor}`}>詳細を見る</Link>
        </Button>
        <Button asChild variant="secondary">
          <Link to={`/${treeId}/scheduled`}>一覧に戻る</Link>
        </Button>
      </div>
    </Card>
  );
};

export default ScheduledNew;
