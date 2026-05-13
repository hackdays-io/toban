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

  const after = Math.max(0, myUnits - share);
  const titleTrimmed = title.trim();
  const valid =
    !!questModuleAddress &&
    !!me &&
    !!wearer &&
    !!hatIdDecimal &&
    titleTrimmed.length > 0 &&
    share > 0 &&
    share <= myUnits;

  // ── Submit ────────────────────────────────────────────────────
  const { createQuest, isLoading: isCreating } = useCreateQuest(
    questModuleAddress,
    fractionTokenAddress,
  );
  const { upload, isLoading: isUploading } = useUploadQuestMetadata();
  const isSubmitting = isCreating || isUploading;

  const onSubmit = async () => {
    if (!valid || !me || !wearer || !hatIdDecimal || !questModuleAddress)
      return;
    try {
      const meta = await upload({ title: titleTrimmed, description });
      if (!meta) {
        toast.error("メタデータのアップロードに失敗しました");
        return;
      }
      const amount = BigInt(share);
      const questId = await createQuest({
        hatId: BigInt(hatIdDecimal),
        wearer,
        amount,
        metadataHash: meta.metadataHash,
      });
      if (questId === undefined) {
        toast.error("クエストの作成に失敗しました");
        return;
      }
      toast.success("クエストを作成しました");
      navigate(`/${treeId}/quest/${questId.toString()}`);
    } catch (err) {
      console.error(err);
      toast.error("クエストの作成に失敗しました");
    }
  };

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
            <ShareNumber label="渡すシェア" value={share} highlight />
            <Typography
              as="span"
              variant="body"
              className="pb-1 text-[#7A5A2E]"
            >
              =
            </Typography>
            <ShareNumber label="作成後" value={after} dim />
          </div>
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
            "作成中…"
          ) : (
            <>
              <Icon name="plus" size={16} />
              作成する
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
        作成すると、選んだシェア（{share.toLocaleString()}単位 / 全
        {TOTAL_SHARE_UNITS.toLocaleString()}）が
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
