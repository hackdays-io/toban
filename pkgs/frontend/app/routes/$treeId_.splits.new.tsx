import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import {
  useAddressesByNames,
  useNamesByAddresses,
  useSetName,
} from "hooks/useENS";
import { useAssignableHats } from "hooks/useHats";
import { useSplitsCreator } from "hooks/useSplitsCreator";
import {
  type FC,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useNavigate, useParams } from "react-router";
import { toast } from "sonner";
import type { HatsDetailSchama } from "types/hats";
import { ipfs2https } from "utils/ipfs";
import { abbreviateAddress } from "utils/wallet";
import type { Address } from "viem";
import {
  DonutChart,
  type DonutSlice,
} from "~/components/composite/donut-chart";
import { FieldLabel } from "~/components/composite/field-label";
import { SectionLabel } from "~/components/composite/section-label";
import { StepBar } from "~/components/composite/step-bar";
import { ScreenHeader } from "~/components/layout/ScreenHeader";
import { RuleCard, type WeightInfo } from "~/components/splits/RuleCard";
import { SplitBreakdownCard } from "~/components/splits/SplitBreakdownCard";
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
import { Icon } from "~/components/ui/icon";
import { Input } from "~/components/ui/input";
import { Typography } from "~/components/ui/typography";
import { cn } from "~/lib/utils";

type Step = "form" | "preview" | "done";

const TOTAL_STEPS = 3;
const STEP_INDEX: Record<Step, number> = {
  form: 0,
  preview: 1,
  done: 2,
};

interface DutyOption {
  hatId: Address;
  detailsUri?: string;
  imageUri?: string;
  wearers: Address[];
}

interface DutyDetail {
  hatId: Address;
  name: string;
  description?: string;
  imageUrl?: string;
}

const useDutyDetails = (options: DutyOption[]): DutyDetail[] => {
  const queries = options.map((o) => o.detailsUri);
  // One detail blob per duty — small enough to fan out, large enough we want
  // React Query's cache so the preview→form round-trip doesn't re-fetch.
  const detailResults = useQuery({
    queryKey: ["duty-details-batch", queries.join("|")],
    enabled: options.length > 0,
    staleTime: 1000 * 60 * 60,
    queryFn: async () => {
      const fetched = await Promise.all(
        options.map(async (o) => {
          if (!o.detailsUri) return undefined;
          const url = ipfs2https(o.detailsUri);
          if (!url) return undefined;
          try {
            const { data } = await axios.get<HatsDetailSchama>(url);
            return data;
          } catch (error) {
            console.error("Failed to fetch duty details:", error);
            return undefined;
          }
        }),
      );
      return fetched;
    },
  });
  return useMemo(() => {
    return options.map((o, i): DutyDetail => {
      const data = detailResults.data?.[i];
      return {
        hatId: o.hatId,
        name: data?.data?.name ?? "当番",
        description: data?.data?.description,
        imageUrl: ipfs2https(o.imageUri),
      };
    });
  }, [options, detailResults.data]);
};

interface RoleInput {
  hatId: Address;
  active: boolean;
  multiplier: number;
  wearers: Address[];
}

const SplitterNew: FC = () => {
  const navigate = useNavigate();
  const { treeId } = useParams();

  const hats = useAssignableHats(Number(treeId));
  const baseHats = useMemo(
    () =>
      hats.filter(
        (h) => Number(h.levelAtLocalTree) === 2 && (h.wearers?.length ?? 0) > 0,
      ),
    [hats],
  );

  const dutyOptions = useMemo<DutyOption[]>(
    () =>
      baseHats.map((h) => ({
        hatId: h.id as Address,
        detailsUri: h.details,
        imageUri: h.imageUri,
        wearers: (h.wearers ?? []).map((w) => w.id as Address),
      })),
    [baseHats],
  );
  const dutyDetails = useDutyDetails(dutyOptions);
  const dutyNameById = useMemo(() => {
    const m = new Map<string, string>();
    for (const d of dutyDetails) m.set(d.hatId.toLowerCase(), d.name);
    return m;
  }, [dutyDetails]);

  // Flow state.
  const [step, setStep] = useState<Step>("form");

  // Each step change resets the scroll position to the top. AppShell wraps
  // routes in its own `<main>` with `overflow-y-auto`, so `window.scrollTo`
  // is a no-op here — we walk up from this component's root and ask the
  // ancestor scroll container to reset.
  const rootRef = useRef<HTMLDivElement>(null);
  // biome-ignore lint/correctness/useExhaustiveDependencies: scroll-on-step-change is the entire point of this effect; `step` must stay in the deps array even though the body doesn't read it.
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    let node: HTMLElement | null = el;
    while (node) {
      if (node.scrollHeight > node.clientHeight) {
        node.scrollTo({ top: 0, behavior: "auto" });
        break;
      }
      node = node.parentElement;
    }
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "auto" });
    }
  }, [step]);

  // Step 1 — form state.
  const [splitterName, setSplitterName] = useState("");
  const _candidateName = useMemo(
    () => [`${splitterName}.split`],
    [splitterName],
  );
  const { addresses } = useAddressesByNames(_candidateName, true);
  const availableName = useMemo(() => {
    if (!splitterName) return false;
    return addresses?.[0]?.length === 0;
  }, [splitterName, addresses]);

  const [dutyWeight, setDutyWeight] = useState(75);
  const [recvWeight, setRecvWeight] = useState(50);
  const [roles, setRoles] = useState<Record<string, RoleInput>>({});

  // Seed roles from the assignable hats once they load. Preserve any user
  // edits by only inserting hats that aren't already in the map.
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
            multiplier: 1,
            wearers: o.wearers,
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

  // Flip an individual wearer in / out of the per-duty selection. The duty row
  // toggles inclusion of the duty as a whole; this toggles which wearers count
  // when the duty IS included (mirrors the legacy "詳細設定" dialog).
  const toggleWearer = (hatId: Address, wearer: Address) => {
    const key = hatId.toLowerCase();
    const wearerLower = wearer.toLowerCase() as Address;
    setRoles((current) => {
      const existing = current[key];
      if (!existing) return current;
      const has = existing.wearers.some((w) => w.toLowerCase() === wearerLower);
      const wearers = has
        ? existing.wearers.filter((w) => w.toLowerCase() !== wearerLower)
        : [...existing.wearers, wearer];
      return { ...current, [key]: { ...existing, wearers } };
    });
  };

  // Resolve display names + avatars for every wearer across every duty in one
  // batched Namestone call so the per-duty detail dialog renders without an
  // extra round-trip when opened.
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

  // Which duty's per-wearer detail dialog is open. null = closed.
  const [openDetailHatId, setOpenDetailHatId] = useState<Address | null>(null);
  const openDetailDuty = useMemo(() => {
    if (!openDetailHatId) return undefined;
    const target = openDetailHatId.toLowerCase();
    return {
      detail: dutyDetails.find((d) => d.hatId.toLowerCase() === target),
      option: dutyOptions.find((o) => o.hatId.toLowerCase() === target),
      role: roles[target],
    };
  }, [openDetailHatId, dutyDetails, dutyOptions, roles]);

  // Step 2 — preview state.
  const { createSplits, previewSplits, isLoading } = useSplitsCreator(
    treeId ?? "",
  );
  const [preview, setPreview] = useState<
    | {
        list: { address: Address; ownership: number }[];
        totalOwnership: number;
      }
    | undefined
  >();
  const [isPreviewing, setIsPreviewing] = useState(false);

  const weightParams = useMemo(() => {
    return {
      roleWeight: BigInt(dutyWeight),
      thanksTokenWeight: BigInt(100 - dutyWeight),
      thanksTokenReceivedWeight: BigInt(recvWeight),
      thanksTokenSentWeight: BigInt(100 - recvWeight),
    };
  }, [dutyWeight, recvWeight]);

  // Same shape the detail page's `RuleCard` expects — share the component
  // between authoring and viewing so the rule layout stays identical.
  const previewWeights = useMemo<WeightInfo>(
    () => ({
      roleWeight: dutyWeight,
      thanksTokenWeight: 100 - dutyWeight,
      thanksTokenReceivedWeight: recvWeight,
      thanksTokenSentWeight: 100 - recvWeight,
    }),
    [dutyWeight, recvWeight],
  );

  const calcSplitsParams = useCallback(() => {
    return Object.values(roles)
      .filter((r) => r.active)
      .map((r) => {
        // Preserves the original multiplier-fraction packing: a non-integer
        // multiplier becomes a `top/bottom` pair so the contract can use
        // integer math.
        const [multiplierTop, multiplierBottom] = r.multiplier
          ? String(r.multiplier).includes(".")
            ? [
                BigInt(
                  r.multiplier *
                    10 ** String(r.multiplier).split(".")[1].length,
                ),
                BigInt(10 ** String(r.multiplier).split(".")[1].length),
              ]
            : [BigInt(r.multiplier), BigInt(1)]
          : [BigInt(1), BigInt(1)];
        return {
          hatId: BigInt(r.hatId),
          multiplierTop,
          multiplierBottom,
          wearers: r.wearers,
        };
      });
  }, [roles]);

  const selectedDutyCount = useMemo(
    () => Object.values(roles).filter((r) => r.active).length,
    [roles],
  );
  const isFormValid = !!splitterName && availableName && selectedDutyCount > 0;

  const handlePreview = useCallback(async () => {
    if (!isFormValid) return;
    setIsPreviewing(true);
    try {
      const splitsParams = calcSplitsParams();
      const res = await previewSplits([splitsParams, weightParams]);
      let totalOwnership = 0;
      const consolidated = res[0].reduce((acc, address, index) => {
        const value = Number(res[1][index]);
        totalOwnership += value;
        acc.set(address, (acc.get(address) ?? 0) + value);
        return acc;
      }, new Map<Address, number>());
      setPreview({
        list: Array.from(consolidated.entries())
          .map(([address, ownership]) => ({ address, ownership }))
          .sort((a, b) => b.ownership - a.ownership),
        totalOwnership,
      });
      setStep("preview");
    } catch (error) {
      console.error("Failed to preview split:", error);
      toast.error("プレビューの取得に失敗しました");
    } finally {
      setIsPreviewing(false);
    }
  }, [calcSplitsParams, isFormValid, previewSplits, weightParams]);

  // Resolve names for the preview rows once we have results. Shape matches
  // `SplitBreakdownCard`'s `BreakdownNameInfo` so the same map can be passed
  // through directly.
  const previewAddresses = useMemo(
    () => preview?.list.map((r) => r.address) ?? [],
    [preview],
  );
  const { names: previewNames } = useNamesByAddresses(previewAddresses);
  const previewNameByAddress = useMemo(() => {
    const m = new Map<string, { name?: string; avatarUrl?: string }>();
    previewNames.forEach((group, i) => {
      const entry = group[0];
      const addr = previewAddresses[i]?.toLowerCase();
      if (!addr) return;
      if (entry) {
        m.set(addr, {
          name: entry.name,
          avatarUrl: ipfs2https(entry.text_records?.avatar),
        });
      }
    });
    return m;
  }, [previewNames, previewAddresses]);

  // Pre-computed rows for the shared SplitBreakdownCard.
  const previewBreakdownRows = useMemo(() => {
    if (!preview || preview.totalOwnership === 0) return [];
    return preview.list.map((r) => ({
      address: r.address,
      pct: (r.ownership / preview.totalOwnership) * 100,
    }));
  }, [preview]);

  const { setName } = useSetName();
  const handleCreate = useCallback(async () => {
    try {
      const splitsParams = calcSplitsParams();
      const res = await createSplits({ args: [splitsParams, weightParams] });
      const created = res?.find((r) => r.eventName === "SplitsCreated")?.args
        .split;
      if (created) {
        try {
          await setName({
            name: `${splitterName}.split`,
            address: created,
          });
        } catch (error) {
          console.warn("Failed to set ENS name:", error);
        }
      }
      setStep("done");
    } catch (error) {
      console.error("Failed to create split:", error);
      toast.error("分配ルールの作成に失敗しました");
    }
  }, [calcSplitsParams, createSplits, setName, splitterName, weightParams]);

  const previewSlices = useMemo<DonutSlice[]>(() => {
    if (!preview || preview.totalOwnership === 0) return [];
    return preview.list.map((r) => ({
      key: r.address,
      percent: (r.ownership / preview.totalOwnership) * 100,
    }));
  }, [preview]);

  const stepIndex = STEP_INDEX[step];

  // ───────── Step Done ─────────
  if (step === "done") {
    return (
      <div className="flex min-h-dvh flex-col bg-bg pb-6">
        <div className="flex flex-col items-center gap-5 px-6 pt-12 text-center">
          <div
            aria-hidden
            className="flex size-24 items-center justify-center rounded-full"
            style={{ backgroundColor: "var(--color-split)" }}
          >
            <Icon name="pie" size={44} className="text-white" />
          </div>
          <div className="space-y-2">
            <Typography
              as="div"
              variant="display"
              className="text-[22px] tracking-[-0.3px]"
            >
              分配ルールを作成しました
            </Typography>
            <Typography variant="bodySm" tone="secondary">
              <strong className="text-text-primary">{splitterName}</strong>{" "}
              が作成されました。
            </Typography>
          </div>
          <Button
            variant="primary"
            full
            onClick={() => navigate(`/${treeId}/splits`)}
            className="mt-2"
          >
            分配一覧へ戻る
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={rootRef}
      className="flex min-h-dvh flex-col bg-bg pt-4 pb-6 md:pt-6"
    >
      <ScreenHeader
        title={step === "form" ? "分配ルールを作成" : "分配プレビュー"}
        subtitle={
          step === "form"
            ? `${stepIndex + 1} / ${TOTAL_STEPS}`
            : "この設定での分配結果"
        }
        onBack={
          step === "form"
            ? () => navigate(`/${treeId}/splits`)
            : () => setStep("form")
        }
      />
      <div className="px-5 pb-3">
        <StepBar
          total={TOTAL_STEPS}
          current={stepIndex}
          ariaLabel={`分配ルール作成 ${stepIndex + 1}/${TOTAL_STEPS}`}
        />
      </div>

      {step === "form" && (
        <div className="flex flex-col gap-5">
          <div className="px-5">
            <FieldLabel htmlFor="split-name">
              分配ルール名 <span className="text-danger">*</span>
            </FieldLabel>
            <Input
              id="split-name"
              value={splitterName}
              onChange={(e) => setSplitterName(e.target.value)}
              placeholder="例：kuu village day 8"
              aria-invalid={!availableName && splitterName.length > 0}
            />
            <Typography
              variant="micro"
              tone="secondary"
              as="div"
              className="mt-1 text-right"
            >
              {splitterName.length === 0
                ? "ENS 名として登録されます"
                : availableName
                  ? "この名前は利用可能です"
                  : "この名前は利用できません"}
            </Typography>
          </div>

          <div className="px-5">
            <FieldLabel>何を重視する？</FieldLabel>
            <Card className="gap-3 px-4 py-4">
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
            </Card>
          </div>

          <div className="px-5">
            <FieldLabel>サンクスの中で何を重視する？</FieldLabel>
            <Card className="gap-3 px-4 py-4">
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
            </Card>
          </div>

          <div className="px-5">
            <FieldLabel>対象にする当番</FieldLabel>
            {dutyDetails.length === 0 ? (
              <Card className="px-4 py-6 text-center">
                <Typography variant="bodySm" tone="secondary">
                  対象にできる当番がありません
                </Typography>
              </Card>
            ) : (
              <Card className="gap-0 p-0">
                {dutyDetails.map((duty, i) => {
                  const key = duty.hatId.toLowerCase();
                  const role = roles[key];
                  const checked = role?.active ?? false;
                  const totalWearers =
                    dutyOptions.find((o) => o.hatId.toLowerCase() === key)
                      ?.wearers.length ?? 0;
                  const selectedWearers = role?.wearers.length ?? 0;
                  const allSelected =
                    totalWearers > 0 && selectedWearers === totalWearers;
                  return (
                    <div
                      key={duty.hatId}
                      className={cn(
                        "flex items-center gap-3 px-4 py-3 transition-colors",
                        i > 0 && "border-t border-border",
                        checked && "hover:bg-bg",
                      )}
                    >
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
                  );
                })}
              </Card>
            )}
          </div>

          <div className="px-4 pt-4">
            <Button
              variant="primary"
              full
              disabled={!isFormValid || isPreviewing}
              onClick={handlePreview}
            >
              <Icon name="pie" size={16} />
              {isPreviewing ? "プレビューを準備中…" : "プレビューを見る"}
            </Button>
          </div>

          <Dialog
            open={!!openDetailHatId}
            onOpenChange={(next) => {
              if (!next) setOpenDetailHatId(null);
            }}
          >
            <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {openDetailDuty?.detail?.name ?? "当番"} の対象メンバー
                </DialogTitle>
                <DialogDescription>
                  この当番で分配対象にするメンバーを選択します。
                </DialogDescription>
              </DialogHeader>
              {openDetailDuty?.option && openDetailDuty.role ? (
                <ul className="flex flex-col">
                  {openDetailDuty.option.wearers.map((wearer, i) => {
                    const lower = wearer.toLowerCase();
                    const info = wearerInfoByAddress.get(lower);
                    const name = info?.name ?? abbreviateAddress(wearer);
                    const checked = openDetailDuty.role?.wearers.some(
                      (w) => w.toLowerCase() === lower,
                    );
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
        </div>
      )}

      {step === "preview" && preview && (
        <div className="flex flex-col gap-5 px-4 md:grid md:grid-cols-[2fr_1fr] md:gap-6 md:px-6">
          {/* Left column (mobile = full width, desktop = 2/3): donut + breakdown */}
          <div className="flex min-w-0 flex-col gap-5 md:gap-4">
            <Card
              className="items-center gap-3 px-5 py-5 text-center"
              style={{
                background: "#F0F6FB",
                borderColor: "rgba(93, 173, 236, 0.27)",
              }}
            >
              <DonutChart
                slices={previewSlices}
                size={140}
                center={
                  <>
                    <span className="text-[22px] font-extrabold leading-none">
                      {preview.list.length}
                    </span>
                    <span className="mt-1 text-[11px] font-bold text-text-secondary">
                      人
                    </span>
                  </>
                }
              />
              <Typography variant="caption" tone="secondary">
                {splitterName}
              </Typography>
            </Card>

            <section className="flex flex-col gap-2">
              <SectionLabel className="px-0">分配の内訳</SectionLabel>
              <SplitBreakdownCard
                recipients={previewBreakdownRows}
                nameByAddress={previewNameByAddress}
              />
            </section>
          </div>

          {/* Right column (mobile = below, desktop = 1/3): rule + actions */}
          <aside className="flex flex-col gap-4">
            <section className="flex flex-col gap-2">
              <SectionLabel className="px-0">分配ルール</SectionLabel>
              <RuleCard weights={previewWeights} />
            </section>

            <Card
              className="gap-1 px-3.5 py-3"
              style={{
                background: "var(--color-primary-soft)",
                borderColor: "rgba(245, 184, 46, 0.33)",
              }}
            >
              <Typography
                as="div"
                variant="caption"
                weight="bold"
                className="text-[#7A5A2E]"
              >
                対象にした当番
              </Typography>
              <Typography
                as="div"
                variant="micro"
                tone="secondary"
                className="mt-0.5 leading-relaxed"
              >
                {Object.values(roles)
                  .filter((r) => r.active)
                  .map((r) => dutyNameById.get(r.hatId.toLowerCase()) ?? "当番")
                  .join("、")}
              </Typography>
            </Card>

            <div className="flex gap-2.5 pt-1 md:flex-col md:gap-2">
              <Button
                variant="primary"
                onClick={handleCreate}
                disabled={isLoading}
                full
                className="md:order-1"
              >
                {isLoading ? "作成中…" : "作成する"}
              </Button>
              <Button
                variant="secondary"
                onClick={() => setStep("form")}
                disabled={isLoading}
                full
                className="md:order-2"
              >
                戻って修正
              </Button>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
};

export default SplitterNew;

// ─── WeightLabels ──────────────────────────────────────────────────────────

interface WeightLabelsProps {
  leftLabel: string;
  leftValue: number;
  leftColor: string;
  rightLabel: string;
  rightValue: number;
  rightColor: string;
}

// One opposing-ends row above the slider: left side hugs the start of the
// track, right side hugs the end. Each side stacks its percentage above the
// label so the colour-coded value sits visually closer to the slider.
const WeightLabels: FC<WeightLabelsProps> = ({
  leftLabel,
  leftValue,
  leftColor,
  rightLabel,
  rightValue,
  rightColor,
}) => (
  <div className="flex items-end justify-between gap-2 text-[13px]">
    <div className="flex flex-col items-start">
      <Typography
        as="span"
        variant="bodySm"
        weight="bold"
        className="tabular-nums leading-none"
        style={{ color: leftColor }}
      >
        {leftValue}%
      </Typography>
      <Typography
        as="span"
        variant="caption"
        weight="semibold"
        className="mt-0.5"
      >
        {leftLabel}
      </Typography>
    </div>
    <div className="flex flex-col items-end">
      <Typography
        as="span"
        variant="bodySm"
        weight="bold"
        className="tabular-nums leading-none"
        style={{ color: rightColor }}
      >
        {rightValue}%
      </Typography>
      <Typography
        as="span"
        variant="caption"
        weight="semibold"
        className="mt-0.5"
      >
        {rightLabel}
      </Typography>
    </div>
  </div>
);

// ─── PercentSlider ─────────────────────────────────────────────────────────

interface PercentSliderProps {
  value: number;
  onChange: (next: number) => void;
  ariaLabel: string;
  /** Colour of the track left of the thumb (the "left label" side). */
  leftColor: string;
  /** Colour of the track right of the thumb (the "right label" side). */
  rightColor: string;
}

// Native range whose track is painted via a linear-gradient — splitting at the
// current value — so each side carries its label's brand colour. The thumb is
// solid white with a dark border so it stays visible against either side of
// the track. (Native `::-webkit-slider-runnable-track` styling is unreliable
// across browsers; a gradient background sidesteps the inconsistency.)
const PercentSlider: FC<PercentSliderProps> = ({
  value,
  onChange,
  ariaLabel,
  leftColor,
  rightColor,
}) => (
  <input
    type="range"
    min={0}
    max={100}
    step={1}
    value={value}
    onChange={(e) => onChange(Number(e.target.value))}
    aria-label={ariaLabel}
    className="h-2 w-full cursor-pointer appearance-none rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring/40 [&::-moz-range-thumb]:size-5 [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border [&::-moz-range-thumb]:border-text-secondary/40 [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:shadow-2 [&::-webkit-slider-thumb]:size-5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border [&::-webkit-slider-thumb]:border-text-secondary/40 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-2"
    style={{
      background: `linear-gradient(to right, ${leftColor} 0%, ${leftColor} ${value}%, ${rightColor} ${value}%, ${rightColor} 100%)`,
    }}
  />
);
