import { type DutyOption, useDutyDetails } from "hooks/useDutyDetails";
import { useNamesByAddresses } from "hooks/useENS";
import { useErc20Meta } from "hooks/useErc20Meta";
import { useAssignableHats } from "hooks/useHats";
import {
  useScheduledDistributor,
  useScheduledDistributorFactory,
} from "hooks/useScheduledDistributor";
import { chainId as currentChainId } from "hooks/useViem";
import { useActiveWallet } from "hooks/useWallet";
import { useGetWorkspace } from "hooks/useWorkspace";
import { type FC, useEffect, useMemo, useState } from "react";
import { LuPlus, LuTrash2 } from "react-icons/lu";
import { Link, useNavigate, useParams } from "react-router";
import { toast } from "sonner";
import { ipfs2https } from "utils/ipfs";
import { DEFAULT_MULTIPLIER, packMultipliers } from "utils/multiplier";
import { abbreviateAddress } from "utils/wallet";
import {
  type Address,
  type Hex,
  keccak256,
  parseUnits,
  stringToHex,
} from "viem";
import { FieldLabel } from "~/components/composite/field-label";
import {
  PercentSlider,
  WeightLabels,
} from "~/components/composite/percent-weight-slider";
import { StepBar } from "~/components/composite/step-bar";
import { TokenSelector } from "~/components/composite/token-selector";
import { ScreenHeader } from "~/components/layout/ScreenHeader";
import { RoleMultiplierField } from "~/components/splits/RoleMultiplierField";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import { Checkbox } from "~/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Heading } from "~/components/ui/heading";
import { Icon } from "~/components/ui/icon";
import { Input } from "~/components/ui/input";
import { RadioGroup, RadioGroupItem } from "~/components/ui/radio-group";
import { Typography } from "~/components/ui/typography";
import { cn } from "~/lib/utils";

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

interface RoleInput {
  hatId: Address;
  active: boolean;
  /** Raw user input — packed into a contract fraction at submit time. */
  multiplier: string;
  /**
   * Lowercased addresses the user has explicitly deselected for this role.
   * Tracking exclusions (rather than inclusions) keeps user deselects stable
   * across subgraph refreshes AND defaults newly-minted wearers into the
   * confirmed set — wearers that arrive after the wizard mounts would
   * otherwise be silently dropped from the on-chain `confirmedWearers`.
   */
  excludedWearers: string[];
}

type BackupMode = "self" | "other";

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
  // `wallet.account.address` is the smart-wallet address when Privy has
  // provisioned one (falls back to the EOA otherwise). This must match the
  // address the detail page's reclaim gate compares against — see
  // $treeId_.scheduled.$distributorId.tsx isBackupWallet — otherwise a user
  // who picks "自分のウォレット" would write their EOA on-chain and then
  // never satisfy the reclaim guard.
  const { wallet } = useActiveWallet();

  const assignableHats = useAssignableHats(Number(treeId));
  const eligibleHats = useMemo(
    () =>
      (assignableHats ?? []).filter(
        (h) =>
          !!h.id &&
          Number(h.levelAtLocalTree) === 2 &&
          (h.wearers?.length ?? 0) > 0,
      ),
    [assignableHats],
  );

  const dutyOptions = useMemo<DutyOption[]>(
    () =>
      eligibleHats.map((h) => ({
        hatId: h.id as Address,
        detailsUri: h.details,
        imageUri: h.imageUri,
        wearers: (h.wearers ?? [])
          .map((w) => w.id as Address)
          .filter((a): a is Address => !!a),
      })),
    [eligibleHats],
  );
  const dutyDetails = useDutyDetails(dutyOptions, "ロール");

  // Wizard step. 0 = schedule form, 1 = deposit, 2 = done.
  const [step, setStep] = useState<0 | 1 | 2>(0);
  const [distributorAddress, setDistributorAddress] = useState<Address | null>(
    null,
  );

  // --- Step 0 state ---
  const [scheduledAt, setScheduledAt] = useState<string>("");
  const [backupMode, setBackupMode] = useState<BackupMode>("self");
  const [backupOtherInput, setBackupOtherInput] = useState<string>("");
  const [tokenRows, setTokenRows] = useState<TokenRow[]>([newTokenRow()]);
  const [dutyWeight, setDutyWeight] = useState(75);
  const [recvWeight, setRecvWeight] = useState(50);
  const [roles, setRoles] = useState<Record<string, RoleInput>>({});
  const [openDetailHatId, setOpenDetailHatId] = useState<Address | null>(null);

  // --- Step 1 state (deposits, seeded from step 0 tokens once created) ---
  const [depositRows, setDepositRows] = useState<DepositRow[]>([]);

  const splitsCreator = workspaceData?.workspace?.splitCreator as
    | Address
    | undefined;
  const ownAddress = wallet?.account?.address as Address | undefined;

  // Seed `roles` for any hat we haven't seen yet. Existing entries are left
  // alone — `excludedWearers` is the user's edit and must survive subgraph
  // refreshes; the live wearer set comes from `dutyOptions` at read time.
  useEffect(() => {
    if (dutyOptions.length === 0) return;
    setRoles((current) => {
      const next = { ...current };
      let changed = false;
      for (const o of dutyOptions) {
        const key = o.hatId.toLowerCase();
        if (!next[key]) {
          next[key] = {
            hatId: o.hatId,
            active: true,
            multiplier: DEFAULT_MULTIPLIER,
            excludedWearers: [],
          };
          changed = true;
        }
      }
      return changed ? next : current;
    });
  }, [dutyOptions]);

  const toggleRole = (hatId: Address) => {
    const key = hatId.toLowerCase();
    setRoles((current) => {
      const existing = current[key];
      if (!existing) return current;
      return { ...current, [key]: { ...existing, active: !existing.active } };
    });
  };

  const updateMultiplier = (hatId: Address, multiplier: string) => {
    const key = hatId.toLowerCase();
    setRoles((current) => {
      const existing = current[key];
      if (!existing) return current;
      return { ...current, [key]: { ...existing, multiplier } };
    });
  };

  // The wearer-detail dialog renders against the FULL wearer set from
  // dutyOptions; this flip records the user's intent in `excludedWearers`.
  const toggleWearer = (hatId: Address, wearer: Address) => {
    const key = hatId.toLowerCase();
    const wearerLower = wearer.toLowerCase();
    setRoles((current) => {
      const existing = current[key];
      if (!existing) return current;
      const isExcluded = existing.excludedWearers.includes(wearerLower);
      const excludedWearers = isExcluded
        ? existing.excludedWearers.filter((w) => w !== wearerLower)
        : [...existing.excludedWearers, wearerLower];
      return { ...current, [key]: { ...existing, excludedWearers } };
    });
  };

  // Resolve the current confirmed-wearer set for a hat: latest dutyOptions
  // wearers minus the user's exclusions. Centralised so the row counter,
  // submit-time payload, and dialog all see the same set.
  const includedWearersFor = (hatId: Address): Address[] => {
    const key = hatId.toLowerCase();
    const role = roles[key];
    const option = dutyOptions.find((o) => o.hatId.toLowerCase() === key);
    if (!option) return [];
    if (!role) return option.wearers;
    return option.wearers.filter(
      (w) => !role.excludedWearers.includes(w.toLowerCase()),
    );
  };

  // Batched ENS resolution for the per-wearer detail dialog.
  const allWearerAddresses = useMemo(() => {
    const set = new Set<string>();
    for (const o of dutyOptions) {
      for (const w of o.wearers) set.add(w.toLowerCase());
    }
    return Array.from(set);
  }, [dutyOptions]);
  const { names: wearerNames } = useNamesByAddresses(allWearerAddresses);
  const wearerInfoByAddress = useMemo(() => {
    const m = new Map<string, { name: string; avatar?: string }>();
    wearerNames.forEach((group, i) => {
      const addr = allWearerAddresses[i];
      const entry = group[0];
      if (!addr) return;
      if (entry?.name) {
        m.set(addr, {
          name: entry.name,
          avatar: ipfs2https(entry.text_records?.avatar),
        });
      }
    });
    return m;
  }, [wearerNames, allWearerAddresses]);

  const openDetailDuty = useMemo(() => {
    if (!openDetailHatId) return undefined;
    const target = openDetailHatId.toLowerCase();
    return {
      detail: dutyDetails.find((d) => d.hatId.toLowerCase() === target),
      option: dutyOptions.find((o) => o.hatId.toLowerCase() === target),
      role: roles[target],
    };
  }, [openDetailHatId, dutyDetails, dutyOptions, roles]);

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

  // The address stored on-chain as `backupWallet`. Resolved late so the
  // radio + manual-input fields stay independent.
  const effectiveBackupAddress = useMemo<string>(() => {
    if (backupMode === "self") return ownAddress ?? "";
    return backupOtherInput.trim();
  }, [backupMode, backupOtherInput, ownAddress]);

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
    if (
      !effectiveBackupAddress ||
      !/^0x[0-9a-fA-F]{40}$/.test(effectiveBackupAddress)
    ) {
      toast.error(
        backupMode === "self"
          ? "自分のウォレットアドレスを取得できませんでした"
          : "バックアップウォレットのアドレスを入力してください",
      );
      return;
    }

    const activeRoles = Object.values(roles).filter((r) => r.active);
    if (activeRoles.length === 0) {
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

    // Same batch packing as the splits authoring flow — the ratios between the
    // roles' multipliers are what the contract can represent, see
    // `utils/multiplier`.
    const fractions = packMultipliers(activeRoles.map((r) => r.multiplier));
    if (!fractions) {
      toast.error("分配係数の値を確認してください");
      return;
    }

    let totalConfirmed = 0;
    activeRoles.forEach((r, i) => {
      hatIds.push(BigInt(r.hatId));
      multiplierTops.push(fractions[i].top);
      multiplierBottoms.push(fractions[i].bottom);
      // Resolve confirmed wearers from the LATEST dutyOptions (not the role
      // snapshot) so wearers minted between page load and submit are included
      // by default. The user's exclusions still apply.
      const wearers = includedWearersFor(r.hatId);
      confirmedWearers.push(wearers);
      totalConfirmed += wearers.length;
    });

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
      backupWallet: effectiveBackupAddress as Address,
      scheduledDate,
      weights: {
        roleWeight: BigInt(dutyWeight),
        thanksTokenWeight: BigInt(100 - dutyWeight),
        thanksTokenReceivedWeight: BigInt(recvWeight),
        thanksTokenSentWeight: BigInt(100 - recvWeight),
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
          if (step === 0) {
            navigate(`/${treeId}/scheduled`);
          } else if (step === 1) {
            // The distributor is already on-chain at this point — there is no
            // "back to the form" to return to. Treat back as an exit: confirm,
            // then jump to the detail page where the operator can still
            // deposit later. If they have already started depositing in this
            // session, exit without the confirm prompt (they have a clear
            // intent to leave).
            const hasDeposits = depositRows.some((r) => r.status === "done");
            if (
              hasDeposits ||
              window.confirm(
                "預け入れをスキップしますか？（あとから詳細画面で預け入れできます）",
              )
            ) {
              if (distributorAddress) {
                navigate(`/${treeId}/scheduled/${distributorAddress}`);
              } else {
                navigate(`/${treeId}/scheduled`);
              }
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
            <Card className="gap-3 px-5 py-5">
              <Heading variant="h5" level={3}>
                基本
              </Heading>
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
                  この日時を過ぎると誰でも分配を実行することができるようになります。
                </Typography>
              </div>
              <div>
                <FieldLabel>バックアップウォレット</FieldLabel>
                <RadioGroup
                  value={backupMode}
                  onValueChange={(v) => setBackupMode(v as BackupMode)}
                  className="gap-2"
                >
                  <label
                    htmlFor="backup-self"
                    className={cn(
                      "flex cursor-pointer items-start gap-3 rounded-[10px] border px-3 py-2.5 transition-colors",
                      backupMode === "self"
                        ? "border-primary bg-bg"
                        : "border-border-muted",
                    )}
                  >
                    <RadioGroupItem
                      id="backup-self"
                      value="self"
                      className="mt-1"
                    />
                    <div className="min-w-0 flex-1">
                      <Typography as="div" variant="bodySm" weight="semibold">
                        自分のウォレット
                      </Typography>
                      <Typography
                        as="div"
                        variant="micro"
                        tone="secondary"
                        className="truncate font-mono"
                      >
                        {ownAddress
                          ? abbreviateAddress(ownAddress)
                          : "ウォレット未接続"}
                      </Typography>
                    </div>
                  </label>
                  <label
                    htmlFor="backup-other"
                    className={cn(
                      "flex cursor-pointer items-start gap-3 rounded-[10px] border px-3 py-2.5 transition-colors",
                      backupMode === "other"
                        ? "border-primary bg-bg"
                        : "border-border-muted",
                    )}
                  >
                    <RadioGroupItem
                      id="backup-other"
                      value="other"
                      className="mt-1"
                    />
                    <div className="min-w-0 flex-1">
                      <Typography as="div" variant="bodySm" weight="semibold">
                        その他のアドレス
                      </Typography>
                      <Input
                        placeholder="0x…"
                        value={backupOtherInput}
                        disabled={backupMode !== "other"}
                        onChange={(e) => setBackupOtherInput(e.target.value)}
                        className="mt-1.5"
                      />
                    </div>
                  </label>
                </RadioGroup>
                <Typography
                  as="div"
                  variant="micro"
                  tone="secondary"
                  className="mt-1"
                >
                  締切後72時間以内に実行されなかった場合、このアドレスが回収できます。
                </Typography>
              </div>
            </Card>

            <Card className="gap-3 px-5 py-5">
              <Heading variant="h5" level={3}>
                配布の比率
              </Heading>
              <div className="flex flex-col gap-3">
                <FieldLabel>何を重視する？</FieldLabel>
                <WeightLabels
                  leftLabel="当番ベース"
                  leftValue={dutyWeight}
                  leftColor="var(--color-role)"
                  rightLabel="サンクスベース"
                  rightValue={100 - dutyWeight}
                  rightColor="var(--color-contrib)"
                />
                <PercentSlider
                  value={dutyWeight}
                  onChange={setDutyWeight}
                  ariaLabel="当番ベースとサンクスベースの比重"
                  leftColor="var(--color-role)"
                  rightColor="var(--color-contrib)"
                />
              </div>
              <div className="flex flex-col gap-3">
                <FieldLabel>サンクスの中で何を重視する？</FieldLabel>
                <WeightLabels
                  leftLabel="受け取った量"
                  leftValue={recvWeight}
                  leftColor="var(--color-contrib)"
                  rightLabel="送った量"
                  rightValue={100 - recvWeight}
                  rightColor="var(--color-primary)"
                />
                <PercentSlider
                  value={recvWeight}
                  onChange={setRecvWeight}
                  ariaLabel="サンクス受取量と送付量の比重"
                  leftColor="var(--color-contrib)"
                  rightColor="var(--color-primary)"
                />
              </div>
            </Card>

            <Card className="gap-3 px-5 py-5">
              <Heading variant="h5" level={3}>
                配布トークン
              </Heading>
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

            <Card className="gap-3 px-5 py-5">
              <Heading variant="h5" level={3}>
                対象ロール（確定者）
              </Heading>
              {dutyDetails.length === 0 ? (
                <Typography
                  variant="bodySm"
                  tone="secondary"
                  className="py-2 text-center"
                >
                  対象にできるロールがありません
                </Typography>
              ) : (
                <div className="-mx-5 flex flex-col border-t border-border">
                  {dutyDetails.map((duty, i) => {
                    const key = duty.hatId.toLowerCase();
                    const role = roles[key];
                    const checked = role?.active ?? false;
                    const totalWearers =
                      dutyOptions.find((o) => o.hatId.toLowerCase() === key)
                        ?.wearers.length ?? 0;
                    const selectedWearers = includedWearersFor(
                      duty.hatId,
                    ).length;
                    const allSelected =
                      totalWearers > 0 && selectedWearers === totalWearers;
                    return (
                      <div
                        key={duty.hatId}
                        className={cn(
                          "flex flex-col",
                          i > 0 && "border-t border-border",
                        )}
                      >
                        <div className="flex items-center gap-3 px-5 py-3 transition-colors">
                          <button
                            type="button"
                            onClick={() => toggleRole(duty.hatId)}
                            aria-pressed={checked}
                            aria-label={`${duty.name}を${checked ? "外す" : "選ぶ"}`}
                            className={cn(
                              "flex size-[22px] shrink-0 items-center justify-center rounded-[6px] border-[1.5px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40",
                              checked
                                ? "border-primary bg-primary text-primary-foreground"
                                : "border-border bg-surface",
                            )}
                          >
                            {checked && <Icon name="check" size={14} />}
                          </button>
                          <button
                            type="button"
                            onClick={() => toggleRole(duty.hatId)}
                            className="flex min-w-0 flex-1 items-center gap-3 text-left"
                          >
                            <div className="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-sm bg-[#F2EAD9]">
                              {duty.imageUrl ? (
                                <img
                                  src={duty.imageUrl}
                                  alt=""
                                  className="size-full object-cover"
                                />
                              ) : (
                                <Icon
                                  name="duty"
                                  size={18}
                                  className="text-[#7A5A2E]"
                                />
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <Typography
                                as="div"
                                variant="bodySm"
                                weight="semibold"
                                truncate
                              >
                                {duty.name}
                              </Typography>
                              {totalWearers > 0 && (
                                <Typography
                                  as="div"
                                  variant="micro"
                                  tone="secondary"
                                  className="mt-0.5"
                                >
                                  対象メンバー{" "}
                                  {allSelected
                                    ? `全${totalWearers}人`
                                    : `${selectedWearers} / ${totalWearers}人`}
                                </Typography>
                              )}
                            </div>
                          </button>
                          {totalWearers > 0 && (
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              disabled={!checked}
                              onClick={() => setOpenDetailHatId(duty.hatId)}
                            >
                              詳細
                            </Button>
                          )}
                        </div>
                        {checked && (
                          <RoleMultiplierField
                            id={`scheduled-multiplier-${key}`}
                            value={role?.multiplier ?? DEFAULT_MULTIPLIER}
                            onChange={(value) =>
                              updateMultiplier(duty.hatId, value)
                            }
                            className="px-5 pb-3 pl-[54px]"
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>

            <Button
              variant="primary"
              onClick={submitCreate}
              disabled={isCreating}
              full
            >
              {isCreating ? "作成中…" : "予約を作成して次へ"}
            </Button>

            <Dialog
              open={!!openDetailHatId}
              onOpenChange={(next) => {
                if (!next) setOpenDetailHatId(null);
              }}
            >
              <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>
                    {openDetailDuty?.detail?.name ?? "ロール"} の対象メンバー
                  </DialogTitle>
                  <DialogDescription>
                    このロールで分配対象にするメンバーを選択します。
                  </DialogDescription>
                </DialogHeader>
                {openDetailDuty?.option && openDetailDuty.role ? (
                  <ul className="flex flex-col">
                    {openDetailDuty.option.wearers.map((wearer, i) => {
                      const lower = wearer.toLowerCase();
                      const info = wearerInfoByAddress.get(lower);
                      const name = info?.name ?? abbreviateAddress(wearer);
                      const checked =
                        !openDetailDuty.role?.excludedWearers.includes(lower);
                      return (
                        <li
                          key={wearer}
                          className={cn(
                            "flex items-center gap-3 py-2.5",
                            i > 0 && "border-t border-border",
                          )}
                        >
                          <Checkbox
                            id={`wearer-${wearer}`}
                            checked={checked}
                            onCheckedChange={() =>
                              openDetailDuty.option &&
                              toggleWearer(openDetailDuty.option.hatId, wearer)
                            }
                          />
                          <Avatar size="default" className="size-9">
                            {info?.avatar && (
                              <AvatarImage src={info.avatar} alt="" />
                            )}
                            <AvatarFallback seed={name} />
                          </Avatar>
                          <label
                            htmlFor={`wearer-${wearer}`}
                            className="flex min-w-0 flex-1 cursor-pointer flex-col"
                          >
                            <Typography
                              as="span"
                              variant="bodySm"
                              weight="semibold"
                              truncate
                            >
                              {name}
                            </Typography>
                            <Typography
                              as="span"
                              variant="micro"
                              tone="secondary"
                              className="truncate font-mono"
                            >
                              {abbreviateAddress(wearer)}
                            </Typography>
                          </label>
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <Typography
                    variant="bodySm"
                    tone="secondary"
                    className="py-4 text-center"
                  >
                    メンバー情報を読み込み中…
                  </Typography>
                )}
              </DialogContent>
            </Dialog>
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
  // Resolve ticker + decimals on-chain for any token outside the preset list
  // so an "その他" address still renders the correct symbol in the deposit row.
  const { byAddress: erc20MetaByAddress } = useErc20Meta(
    rows.map((r) => r.address),
  );

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
    // Require the on-chain decimals before parsing. Falling back to the row's
    // default (18) for a non-preset token would silently inflate the deposit
    // by 10^(18 - actualDecimals) base units — e.g. a 6-decimal USDC deposit
    // of "100" would approve+transfer 100e18 instead of 100e6.
    const meta = erc20MetaByAddress.get(row.address.toLowerCase());
    if (!meta) {
      toast.error(
        "トークン情報を取得中です。少し待ってからもう一度お試しください",
      );
      return;
    }
    let amount: bigint;
    try {
      amount = parseUnits(row.amount, meta.decimals);
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
      <Card className="gap-3 px-5 py-5">
        <Heading variant="h5" level={3}>
          原資をデポジット
        </Heading>
        <Typography variant="micro" tone="secondary">
          デポジットしたトークンは締切後の execute 実行時に
          <b>全額</b>分配されます。あとから詳細画面で追加することもできます。
        </Typography>
        {rows.map((row, i) => {
          const meta = erc20MetaByAddress.get(row.address.toLowerCase());
          const symbol = meta?.symbol ?? `Token #${i + 1}`;
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
                  disabled={isDone || isSubmitting || isLoading || !meta}
                  onClick={() => handleDeposit(row)}
                >
                  {isDone
                    ? "預入済"
                    : isSubmitting
                      ? "送信中…"
                      : !meta
                        ? "読み込み中…"
                        : "預け入れる"}
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
  const { byAddress: erc20MetaByAddress } = useErc20Meta(
    depositedRows.map((r) => r.address),
  );
  return (
    <Card className="gap-3 px-5 py-6 text-center">
      <Heading variant="h3" level={2}>
        予約分配を作成しました
      </Heading>
      <Typography as="div" variant="bodySm" tone="secondary">
        締切日時を過ぎると、誰でも分配を実行することができるようになります。
      </Typography>

      {depositedRows.length > 0 && (
        <div className="mt-2 flex flex-col gap-1.5">
          <Typography variant="micro" tone="secondary">
            預け入れたトークン
          </Typography>
          <ul className="flex flex-col gap-1">
            {depositedRows.map((row) => {
              const meta = erc20MetaByAddress.get(row.address.toLowerCase());
              return (
                <li
                  key={row.rowId}
                  className="flex items-center justify-between rounded-[10px] bg-[#F0EBE0] px-3 py-1.5"
                >
                  <Typography variant="bodySm" weight="bold">
                    {meta?.symbol ?? row.address.slice(0, 8)}
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
