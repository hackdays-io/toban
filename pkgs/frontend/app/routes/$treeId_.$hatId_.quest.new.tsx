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
// (hatId, wearer). UI surfaces the user's holding as a percent of that scale,
// so 1% == 100 raw units. See BigBang.sol where 10_000 is passed as the
// fraction token's default supply during workspace init.
const SHARE_UNITS_PER_PERCENT = 100n;
const TOTAL_SHARE_UNITS = 10_000;

const QuestCreate: FC = () => {
  const { treeId, hatId } = useParams();
  const navigate = useNavigate();
  const { wallet } = useActiveWallet();
  const me = wallet?.account?.address as Address | undefined;

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

  // Viewer's RoleShare balance for (hatId, wearer=me). MVP scope: only
  // wearers create quests, so we only look up the (hatId, me) tokenId.
  const { data: balanceData } = useGetBalanceOfFractionTokens({
    where: {
      hatId: hatIdDecimal,
      owner: me?.toLowerCase(),
      wearer: me?.toLowerCase(),
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
  const myPercent = useMemo(
    () => Number(myShareUnits / SHARE_UNITS_PER_PERCENT),
    [myShareUnits],
  );

  const { data: workspace } = useGetWorkspace({
    workspaceId: treeId ?? "",
  });
  const questModuleAddress = workspace?.workspace?.hatsQuestModule as
    | Address
    | undefined;

  // ── Form state ────────────────────────────────────────────────
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [share, setShare] = useState(0);

  // Default the stepper to a useful starting value once we know the user's
  // share — Math.min(10, myPercent). Only runs while the input is still
  // pristine (share === 0) so user adjustments aren't overwritten on rerender.
  useEffect(() => {
    if (myPercent > 0) {
      setShare((prev) => (prev === 0 ? Math.min(10, myPercent) : prev));
    }
  }, [myPercent]);

  const after = Math.max(0, myPercent - share);
  const titleTrimmed = title.trim();
  const valid =
    !!questModuleAddress &&
    !!me &&
    !!hatIdDecimal &&
    titleTrimmed.length > 0 &&
    share > 0 &&
    share <= myPercent;

  // ── Submit ────────────────────────────────────────────────────
  const { createQuest, isLoading: isCreating } =
    useCreateQuest(questModuleAddress);
  const { upload, isLoading: isUploading } = useUploadQuestMetadata();
  const isSubmitting = isCreating || isUploading;

  const onSubmit = async () => {
    if (!valid || !me || !hatIdDecimal || !questModuleAddress) return;
    try {
      const meta = await upload({ title: titleTrimmed, description });
      if (!meta) {
        toast.error("メタデータのアップロードに失敗しました");
        return;
      }
      const amount = BigInt(share) * SHARE_UNITS_PER_PERCENT;
      const questId = await createQuest({
        hatId: BigInt(hatIdDecimal),
        wearer: me,
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
          onBack={() => navigate(`/${treeId}/${hatId}`)}
        />
        <Card className="mx-1 mt-3 py-6 text-center">
          <Typography variant="bodySm" tone="secondary">
            この当番のシェアを保有していないため、クエストを作成できません。
          </Typography>
          <div className="mt-4 px-4">
            <Button
              variant="secondary"
              full
              onClick={() => navigate(`/${treeId}/${hatId}`)}
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
        onBack={() => navigate(`/${treeId}/${hatId}`)}
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
            <ShareNumber label="あなたのシェア" value={myPercent} />
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
            <div className="flex-1 text-center">
              <Typography
                as="div"
                variant="statLg"
                className="tracking-[-0.5px]"
              >
                {share}
                <Typography
                  as="span"
                  variant="caption"
                  tone="secondary"
                  className="ml-1"
                >
                  %
                </Typography>
              </Typography>
            </div>
            <StepButton
              symbol="+"
              onClick={() => setShare((s) => Math.min(myPercent, s + 1))}
              disabled={share >= myPercent}
            />
          </div>
          <div className="mt-1 flex gap-1.5">
            {[5, 10, 15, 20]
              .filter((n) => n <= myPercent)
              .map((n) => {
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
                    {n}%
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
        <Button
          variant="secondary"
          onClick={() => navigate(`/${treeId}/${hatId}`)}
        >
          キャンセル
        </Button>
        <Button
          variant="primary"
          full
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
        作成すると、選んだシェア（{share}% ={" "}
        {Number(share * 100).toLocaleString()}
        単位 / 全{TOTAL_SHARE_UNITS.toLocaleString()}）が
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
      {value}
      <Typography as="span" variant="caption" className="ml-1 text-[#7A5A2E]">
        %
      </Typography>
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
