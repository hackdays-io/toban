import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { useGetBalanceOfFractionTokens } from "hooks/useFractionToken";
import { useTreeInfo } from "hooks/useHats";
import { useCreateQuest } from "hooks/useHatsQuestModule";
import { useUploadQuestMetadata } from "hooks/useQuestMetadata";
import { useActiveWallet } from "hooks/useWallet";
import { useGetWorkspace } from "hooks/useWorkspace";
import { type FC, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { toast } from "sonner";
import type { HatsDetailSchama } from "types/hats";
import { ipfs2https } from "utils/ipfs";
import type { Address } from "viem";
import { FieldLabel } from "~/components/composite/field-label";
import { PageContainer } from "~/components/layout/PageContainer";
import { ScreenHeader } from "~/components/layout/ScreenHeader";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import { Icon } from "~/components/ui/icon";
import { Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea";
import { Typography } from "~/components/ui/typography";
import { cn } from "~/lib/utils";

// HatsFractionTokenModule mints DEFAULT_TOKEN_SUPPLY = 10000 share units per
// (hatId, wearer). The form lets the wearer hand off a raw-unit count to a
// quest; no percent conversion happens on the way to the contract.
const TOTAL_SHARE_UNITS = 10_000;
const DEFAULT_SHARE_AMOUNT = 100;
const QUICK_SHARE_AMOUNTS = [100, 300, 500, 1000];
// Ceiling on one batch. Share holdings cap it far lower in practice; this is
// the gas-side limit — 20 `createQuest` calls still fit one UserOperation.
const MAX_QUEST_COUNT = 20;

const QuestCreate: FC = () => {
  const { treeId, hatId, address } = useParams();
  const navigate = useNavigate();
  const { wallet } = useActiveWallet();
  const me = wallet?.account?.address as Address | undefined;

  // The role-share tokenId is keccak256(hatId, wearer); the wearer is fixed by
  // the URL. The viewer (me) is the depositor — `createQuest` pulls share from
  // msg.sender for that specific (hatId, wearer) shard.
  const wearer = address as Address | undefined;
  const holderBackPath =
    treeId && hatId && address
      ? `/${treeId}/${hatId}/${address}`
      : `/${treeId}/${hatId}`;

  const tree = useTreeInfo(Number(treeId));
  const hat = useMemo(
    () => tree?.hats?.find((h) => h.id?.toLowerCase() === hatId?.toLowerCase()),
    [tree, hatId],
  );

  const hatDetailUrl = useMemo(() => ipfs2https(hat?.details), [hat?.details]);
  const { data: dutyDetail } = useQuery({
    queryKey: ["hats-detail", hatDetailUrl],
    queryFn: async (): Promise<HatsDetailSchama | undefined> => {
      if (!hatDetailUrl) return;
      const { data } = await axios.get<HatsDetailSchama>(hatDetailUrl);
      return data;
    },
    enabled: !!hatDetailUrl,
    staleTime: 1000 * 60 * 60,
  });
  const dutyName = dutyDetail?.data?.name ?? "当番";

  const hatIdDecimal = useMemo(() => {
    if (!hatId) return undefined;
    try {
      return BigInt(hatId).toString();
    } catch {
      return undefined;
    }
  }, [hatId]);

  // Viewer's balance for the (hatId, wearer) shard identified by the URL.
  // `wearer` fixes the tokenId; `owner=me` filters to the depositor's row.
  const { data: balanceData } = useGetBalanceOfFractionTokens({
    where: {
      hatId: hatIdDecimal,
      owner: me?.toLowerCase(),
      wearer: wearer?.toLowerCase(),
    },
    first: 1,
  });
  const myShareUnits = useMemo(() => {
    const row = balanceData?.balanceOfFractionTokens?.[0];
    if (!row) return 0n;
    try {
      return BigInt(row.balance);
    } catch {
      return 0n;
    }
  }, [balanceData]);
  // Cap by DEFAULT_TOKEN_SUPPLY (10_000) on the module — fits in a JS Number.
  const myUnits = useMemo(() => Number(myShareUnits), [myShareUnits]);

  const { data: workspace } = useGetWorkspace({
    workspaceId: treeId ?? "",
  });
  const questModuleAddress = workspace?.workspace?.hatsQuestModule as
    | Address
    | undefined;
  const fractionTokenAddress = workspace?.workspace?.hatsFractionTokenModule
    ?.id as Address | undefined;

  // ── Form state ────────────────────────────────────────────────
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [share, setShare] = useState(0);
  const [count, setCount] = useState(1);

  // Default the stepper to a useful starting value once we know the user's
  // share — Math.min(DEFAULT_SHARE_AMOUNT, myUnits). Only runs while the input
  // is still pristine (share === 0) so user adjustments aren't overwritten on
  // rerender.
  useEffect(() => {
    if (myUnits > 0) {
      setShare((prev) =>
        prev === 0 ? Math.min(DEFAULT_SHARE_AMOUNT, myUnits) : prev,
      );
    }
  }, [myUnits]);

  // Every quest escrows `share`, so N of them need `share * N` on hand. The
  // stepper is clamped to that, and the count follows the share downwards when
  // raising the share would otherwise leave the pair unaffordable.
  const maxCount = useMemo(
    () =>
      share > 0
        ? Math.max(1, Math.min(MAX_QUEST_COUNT, Math.floor(myUnits / share)))
        : 1,
    [myUnits, share],
  );
  useEffect(() => {
    setCount((prev) => Math.max(1, Math.min(prev, maxCount)));
  }, [maxCount]);

  const totalShare = share * count;
  const after = Math.max(0, myUnits - totalShare);
  const titleTrimmed = title.trim();
  const valid =
    !!questModuleAddress &&
    !!me &&
    !!wearer &&
    !!hatIdDecimal &&
    titleTrimmed.length > 0 &&
    share > 0 &&
    count >= 1 &&
    count <= MAX_QUEST_COUNT &&
    totalShare <= myUnits;

  // ── Submit ────────────────────────────────────────────────────
  const {
    createQuests,
    isLoading: isCreating,
    progress,
  } = useCreateQuest(questModuleAddress, fractionTokenAddress);
  const { upload, isLoading: isUploading } = useUploadQuestMetadata();
  const isSubmitting = isCreating || isUploading;

  const onSubmit = async () => {
    if (!valid || !me || !wearer || !hatIdDecimal || !questModuleAddress)
      return;
    try {
      // One upload for the whole batch — identical quests share the CID, which
      // is also what lets the Discord autocomplete collapse them (#560).
      const meta = await upload({ title: titleTrimmed, description });
      if (!meta) {
        toast.error("メタデータのアップロードに失敗しました");
        return;
      }
      const result = await createQuests({
        hatId: BigInt(hatIdDecimal),
        wearer,
        amount: BigInt(share),
        metadataUri: meta.ipfsUri,
        count,
      });
      const created = result?.questIds.length ?? 0;
      if (created === 0) {
        toast.error("クエストの作成に失敗しました");
        return;
      }
      if (created < count) {
        // Only reachable on the EOA path: the quests already mined stay
        // created, so say what landed instead of claiming a clean failure.
        toast.error(
          `${created}件作成しました（残り${count - created}件は失敗）`,
        );
      } else {
        toast.success(
          count > 1
            ? `${count}件のクエストを作成しました`
            : "クエストを作成しました",
        );
      }
      // A single quest still lands on its detail screen; a batch has no single
      // detail to show, so the list is the useful destination.
      navigate(
        created === 1 && count === 1
          ? `/${treeId}/quest/${result?.questIds[0]?.toString()}`
          : `/${treeId}/quest`,
      );
    } catch (err) {
      console.error(err);
      toast.error("クエストの作成に失敗しました");
    }
  };

  // Batch is one signature and atomic, so a count would be noise. The EOA path
  // sends one transaction per quest and genuinely has a position to report.
  const submitLabel = useMemo(() => {
    if (!isSubmitting) return undefined;
    if (progress?.mode === "sequential" && progress.requested > 1) {
      return `作成中… (${Math.min(progress.done + 1, progress.requested)}/${progress.requested})`;
    }
    if (progress?.mode === "batch" && progress.requested > 1) {
      return `${progress.requested}件を作成中…`;
    }
    return "作成中…";
  }, [isSubmitting, progress]);

  // ── Gate ──────────────────────────────────────────────────────
  // URL-direct hit when viewer holds no share: block the form. Wallet not
  // connected yet is a transient state we let render with disabled controls.
  if (me && balanceData && myShareUnits === 0n) {
    return (
      <PageContainer className="pt-4 pb-8 md:pt-6">
        <ScreenHeader
          title="クエストを作成"
          onBack={() => navigate(holderBackPath)}
        />
        <Card className="mx-1 mt-3 py-6 text-center">
          <Typography variant="bodySm" tone="secondary">
            この当番のシェアを保有していないため、クエストを作成できません。
          </Typography>
          <div className="mt-4 px-4">
            <Button
              variant="secondary"
              full
              onClick={() => navigate(holderBackPath)}
            >
              当番に戻る
            </Button>
          </div>
        </Card>
      </PageContainer>
    );
  }

  return (
    <PageContainer className="pt-4 pb-8 md:pt-6">
      <ScreenHeader
        title="クエストを作成"
        onBack={() => navigate(holderBackPath)}
      />

      <div className="px-1 pb-3">
        <Card
          className="gap-3 border-[#D6B995]/55 bg-primary-soft px-4 py-4"
          style={{ borderColor: "rgba(214, 185, 149, 0.55)" }}
        >
          <Typography
            as="div"
            variant="caption"
            weight="bold"
            className="text-[#7A5A2E]"
          >
            紐づく当番
          </Typography>
          <Typography
            as="div"
            variant="bodySm"
            weight="bold"
            className="-mt-1 text-[#3D2D14]"
          >
            {dutyName}
          </Typography>
          <div className="mt-1 flex items-end gap-3">
            <ShareNumber label="あなたのシェア" value={myUnits} />
            <Typography
              as="span"
              variant="body"
              className="pb-1 text-[#7A5A2E]"
            >
              −
            </Typography>
            <ShareNumber
              label={count > 1 ? `渡すシェア（${count}件分）` : "渡すシェア"}
              value={totalShare}
              highlight
            />
            <Typography
              as="span"
              variant="body"
              className="pb-1 text-[#7A5A2E]"
            >
              =
            </Typography>
            <ShareNumber label="作成後" value={after} dim />
          </div>
          {count > 1 && (
            <Typography
              as="div"
              variant="caption"
              className="-mt-1 text-[#7A5A2E]"
            >
              {share.toLocaleString()} × {count}件 ={" "}
              {totalShare.toLocaleString()}
            </Typography>
          )}
        </Card>
      </div>

      <div className="flex flex-col gap-4 px-2 pt-3">
        <div className="flex flex-col gap-2">
          <FieldLabel>
            渡す当番シェア
            <span className="ml-1 text-danger">*</span>
          </FieldLabel>
          <div className="flex items-center gap-3">
            <StepButton
              symbol="−"
              onClick={() => setShare((s) => Math.max(1, s - 1))}
              disabled={share <= 1}
            />
            <Input
              type="number"
              inputMode="numeric"
              min={0}
              max={myUnits || undefined}
              step={1}
              value={share === 0 ? "" : share}
              onChange={(e) => {
                const raw = e.target.value;
                if (raw === "") {
                  setShare(0);
                  return;
                }
                const n = Math.floor(Number(raw));
                if (!Number.isFinite(n)) return;
                setShare(Math.max(0, Math.min(myUnits, n)));
              }}
              className="h-14 flex-1 text-center text-3xl font-bold tracking-[-0.5px]"
            />
            <StepButton
              symbol="+"
              onClick={() => setShare((s) => Math.min(myUnits, s + 1))}
              disabled={share >= myUnits}
            />
          </div>
          <div className="mt-1 flex gap-1.5">
            {QUICK_SHARE_AMOUNTS.filter((n) => n <= myUnits).map((n) => {
              const active = share === n;
              return (
                <button
                  key={n}
                  type="button"
                  onClick={() => setShare(n)}
                  className={cn(
                    "flex-1 rounded-full border px-0 py-2 text-xs font-bold transition-colors",
                    active
                      ? "border-primary bg-primary text-white"
                      : "border-border bg-surface text-text-primary hover:bg-bg",
                  )}
                >
                  {n.toLocaleString()}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <FieldLabel>作成する個数</FieldLabel>
          <div className="flex items-center gap-3">
            <StepButton
              symbol="−"
              onClick={() => setCount((c) => Math.max(1, c - 1))}
              disabled={count <= 1}
            />
            <Input
              type="number"
              inputMode="numeric"
              min={1}
              max={maxCount}
              step={1}
              value={count === 0 ? "" : count}
              onChange={(e) => {
                const raw = e.target.value;
                if (raw === "") {
                  setCount(0);
                  return;
                }
                const n = Math.floor(Number(raw));
                if (!Number.isFinite(n)) return;
                setCount(Math.max(1, Math.min(maxCount, n)));
              }}
              onBlur={() => setCount((c) => (c < 1 ? 1 : c))}
              className="h-14 flex-1 text-center text-3xl font-bold tracking-[-0.5px]"
            />
            <StepButton
              symbol="+"
              onClick={() => setCount((c) => Math.min(maxCount, c + 1))}
              disabled={count >= maxCount}
            />
          </div>
          <Typography as="div" variant="caption" tone="secondary">
            同じ内容のクエストをまとめて作成します（最大{maxCount}件）。
          </Typography>
        </div>

        <div className="flex flex-col gap-2">
          <FieldLabel>
            クエスト名
            <span className="ml-1 text-danger">*</span>
          </FieldLabel>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="例：夕食後の食器洗いを手伝う"
            maxLength={80}
          />
        </div>

        <div className="flex flex-col gap-2">
          <FieldLabel>説明</FieldLabel>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="どんなお願いか、自由に書いてください"
            rows={4}
            maxLength={500}
          />
        </div>
      </div>

      <div className="flex gap-2.5 px-1 pt-6">
        <Button variant="secondary" onClick={() => navigate(holderBackPath)}>
          キャンセル
        </Button>
        <Button
          variant="primary"
          className="flex-1"
          onClick={onSubmit}
          disabled={!valid || isSubmitting}
        >
          {isSubmitting ? (
            submitLabel
          ) : (
            <>
              <Icon name="plus" size={16} />
              {count > 1 ? `${count}件作成する` : "作成する"}
            </>
          )}
        </Button>
      </div>

      <Typography
        as="p"
        variant="caption"
        tone="secondary"
        className="px-2 pt-4 leading-relaxed"
      >
        作成すると、選んだシェア（
        {count > 1
          ? `${share.toLocaleString()}単位 × ${count}件 = ${totalShare.toLocaleString()}単位`
          : `${share.toLocaleString()}単位`}{" "}
        / 全{TOTAL_SHARE_UNITS.toLocaleString()}）が
        クエストモジュールに預け入れられます。完了承認で申請者に渡り、キャンセル時には差し戻されます。
      </Typography>
    </PageContainer>
  );
};

export default QuestCreate;

interface ShareNumberProps {
  label: string;
  value: number;
  highlight?: boolean;
  dim?: boolean;
}

const ShareNumber: FC<ShareNumberProps> = ({
  label,
  value,
  highlight,
  dim,
}) => (
  <div className={cn("flex-1 text-center leading-none", dim && "opacity-70")}>
    <Typography
      as="div"
      variant="caption"
      weight="semibold"
      className="text-[#7A5A2E]"
    >
      {label}
    </Typography>
    <Typography
      as="div"
      className={cn(
        "mt-1 font-bold tracking-[-0.5px]",
        highlight ? "text-[30px] text-primary" : "text-[24px] text-[#3D2D14]",
      )}
    >
      {value.toLocaleString()}
    </Typography>
  </div>
);

interface StepButtonProps {
  symbol: string;
  onClick: () => void;
  disabled?: boolean;
}

const StepButton: FC<StepButtonProps> = ({ symbol, onClick, disabled }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    className={cn(
      "flex size-12 items-center justify-center rounded-full border border-border bg-surface text-xl font-bold text-text-primary transition-colors",
      "hover:bg-bg disabled:cursor-not-allowed disabled:opacity-50",
    )}
  >
    {symbol}
  </button>
);
