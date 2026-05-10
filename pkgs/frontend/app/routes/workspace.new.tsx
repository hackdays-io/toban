import { hatIdToTreeId } from "@hatsprotocol/sdk-v1-core";
import { useBigBang } from "hooks/useBigBang";
import { useUploadHatsDetailsToIpfs } from "hooks/useIpfs";
import { useActiveWallet } from "hooks/useWallet";
import { type FC, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import type { Address } from "viem";
import { Divider } from "~/components/composite/divider";
import { FieldLabel } from "~/components/composite/field-label";
import { IconColorPicker } from "~/components/composite/icon-color-picker";
import { NextStepCard } from "~/components/composite/next-step-card";
import { Segmented } from "~/components/composite/segmented";
import { StepBar } from "~/components/composite/step-bar";
import { SummaryRow } from "~/components/composite/summary-row";
import { ToggleRow } from "~/components/composite/toggle-row";
import { ScreenHeader } from "~/components/layout/ScreenHeader";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea";

const ICON_CHOICES = [
  "🌿",
  "🇯🇵",
  "✦",
  "🏠",
  "🌊",
  "🔥",
  "🌸",
  "⚡",
  "🛠",
] as const;

const COLOR_CHOICES = [
  "#65C98A",
  "#5DADEC",
  "#F5B82E",
  "#D6B995",
  "#E48F4F",
  "#B696E0",
  "#E48ABF",
  "#7AC2D9",
] as const;

type Step = "basic" | "initial" | "confirm" | "done";
type Openness = "invite" | "link";
type DefaultRole = "Member" | "Guest";

const TOTAL_STEPS = 3;
const STEP_INDEX: Record<Step, number> = {
  basic: 0,
  initial: 1,
  confirm: 2,
  done: 2,
};

const WorkspaceNew: FC = () => {
  const navigate = useNavigate();
  const { wallet } = useActiveWallet();
  const { bigbang, isLoading: isCreating } = useBigBang();
  const { uploadHatsDetailsToIpfs, isLoading: isUploadingDetails } =
    useUploadHatsDetailsToIpfs();

  // Flow state
  const [step, setStep] = useState<Step>("basic");
  const [createdTreeId, setCreatedTreeId] = useState<string | null>(null);

  // Step 1 — basic
  const [icon, setIcon] = useState<string>(ICON_CHOICES[0]);
  const [color, setColor] = useState<string>(COLOR_CHOICES[0]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [openness, setOpenness] = useState<Openness>("invite");

  // Step 2 — initial
  const [unitName, setUnitName] = useState("サンクス");
  const [unitSymbol, setUnitSymbol] = useState("THX");
  const [defaultRole, setDefaultRole] = useState<DefaultRole>("Member");
  const [enableDuty, setEnableDuty] = useState(true);
  const [enableSplit, setEnableSplit] = useState(true);

  const isBasicValid = name.trim().length > 0;
  const isWorking = isUploadingDetails || isCreating;

  const handleCreate = async () => {
    if (!wallet) {
      alert("ウォレットを接続してください。");
      return;
    }
    if (!isBasicValid) {
      setStep("basic");
      return;
    }

    try {
      const workspaceMetadata = await uploadHatsDetailsToIpfs({
        name,
        description,
        responsabilities: [],
        authorities: [],
      });
      if (!workspaceMetadata) {
        throw new Error("ワークスペースメタデータの保存に失敗しました。");
      }

      // First-class member-role metadata is generated from the basic info so
      // BigBang's required `memberHat*` slots are always populated even though
      // the new flow doesn't ask the user to define a role explicitly. The
      // existing `useBigBang` interface is preserved (issue #431).
      const memberRoleMetadata = await uploadHatsDetailsToIpfs({
        name: defaultRole,
        description: `${name} の初期ロール`,
        responsabilities: [],
        authorities: [],
      });
      if (!memberRoleMetadata) {
        throw new Error("初期ロールメタデータの保存に失敗しました。");
      }

      const parsedLog = await bigbang({
        owner: wallet.account.address as Address,
        topHatDetails: workspaceMetadata.ipfsUri,
        topHatImageURI: "",
        hatterHatDetails: workspaceMetadata.ipfsUri,
        hatterHatImageURI: "",
        memberHatDetails: memberRoleMetadata.ipfsUri,
        memberHatImageURI: "",
      });
      if (!parsedLog) {
        throw new Error("BigBang の実行に失敗しました。");
      }

      const { topHatId } = parsedLog.args;
      const treeId = String(hatIdToTreeId(topHatId));
      setCreatedTreeId(treeId);
      // wait briefly so the subgraph has a chance to index the new workspace
      await new Promise((resolve) => setTimeout(resolve, 3000));
      setStep("done");
    } catch (error) {
      console.error(error);
      alert(`エラーが発生しました。${error}`);
    }
  };

  const opennessLabel = useMemo(
    () => (openness === "invite" ? "招待制" : "リンク参加可"),
    [openness],
  );

  const goToTreeHome = () => {
    if (createdTreeId) {
      navigate(`/${createdTreeId}`);
    } else {
      navigate("/workspace");
    }
  };

  const stepIndex = STEP_INDEX[step];

  return (
    <div className="flex min-h-dvh flex-col bg-bg pb-6">
      {step !== "done" && (
        <>
          <ScreenHeader
            title={
              step === "basic"
                ? "ワークスペースを作成"
                : step === "initial"
                  ? "初期設定"
                  : "作成内容を確認"
            }
            subtitle={`${stepIndex + 1} / ${TOTAL_STEPS}`}
            onBack={
              step === "basic"
                ? () => navigate("/workspace")
                : step === "initial"
                  ? () => setStep("basic")
                  : () => setStep("initial")
            }
          />
          <div className="px-5 pb-3">
            <StepBar
              total={TOTAL_STEPS}
              current={stepIndex}
              ariaLabel={`ワークスペース作成 ${stepIndex + 1}/${TOTAL_STEPS}`}
            />
          </div>
        </>
      )}

      {step === "basic" && (
        <div className="flex flex-col gap-5">
          <div className="px-5">
            <FieldLabel>アイコン & カラー</FieldLabel>
            <IconColorPicker
              icon={icon}
              color={color}
              iconChoices={ICON_CHOICES}
              colorChoices={COLOR_CHOICES}
              onIconChange={setIcon}
              onColorChange={setColor}
              helper="プレビューはここに表示されます。アイコンとカラーは下から選択できます。"
            />
          </div>

          <div className="px-5">
            <FieldLabel htmlFor="ws-name">
              ワークスペース名 <span className="text-danger">*</span>
            </FieldLabel>
            <Input
              id="ws-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="例：kuu village #1"
              data-testid="workspace-name-input"
              aria-invalid={!isBasicValid && name.length > 0}
            />
          </div>

          <div className="px-5">
            <FieldLabel htmlFor="ws-desc">説明</FieldLabel>
            <Textarea
              id="ws-desc"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="どんなコミュニティかを入力"
              data-testid="description-input"
            />
          </div>

          <div className="px-5">
            <FieldLabel>公開設定</FieldLabel>
            <Segmented<Openness>
              value={openness}
              onChange={setOpenness}
              options={[
                { value: "invite", label: "招待制" },
                { value: "link", label: "リンク参加可" },
              ]}
            />
            <div className="mt-1.5 text-[11px] leading-snug text-text-secondary">
              {openness === "invite"
                ? "招待されたメンバーのみ参加できます。"
                : "招待リンクを知っている人なら誰でも参加できます。"}
            </div>
          </div>

          <div className="px-4 pt-4">
            <Button
              variant="primary"
              full
              disabled={!isBasicValid}
              onClick={() => setStep("initial")}
            >
              次へ
            </Button>
          </div>
        </div>
      )}

      {step === "initial" && (
        <div className="flex flex-col gap-5">
          <div className="px-5 text-[13px] leading-relaxed text-text-secondary">
            あとから変更できます。
          </div>

          <div className="px-5">
            <FieldLabel>サンクスの表示名と単位</FieldLabel>
            <div className="flex gap-2.5">
              <div className="flex-[2]">
                <Input
                  value={unitName}
                  onChange={(e) => setUnitName(e.target.value)}
                  placeholder="サンクス"
                  aria-label="サンクスの表示名"
                />
              </div>
              <div className="flex-1">
                <Input
                  value={unitSymbol}
                  onChange={(e) => setUnitSymbol(e.target.value)}
                  placeholder="THX"
                  aria-label="サンクスの単位"
                />
              </div>
            </div>
          </div>

          <div className="px-5">
            <FieldLabel>メンバーの初期ロール</FieldLabel>
            <Segmented<DefaultRole>
              value={defaultRole}
              onChange={setDefaultRole}
              options={[
                { value: "Member", label: "Member" },
                { value: "Guest", label: "Guest" },
              ]}
            />
          </div>

          <div className="px-5">
            <FieldLabel>機能</FieldLabel>
            <div className="overflow-hidden rounded-md border border-border bg-surface shadow-1">
              <ToggleRow
                label="当番"
                sub="役割と担当を見える化"
                checked={enableDuty}
                onCheckedChange={setEnableDuty}
              />
              <Divider inset={16} />
              <ToggleRow
                label="分配"
                sub="貢献記録から報酬を分ける"
                checked={enableSplit}
                onCheckedChange={setEnableSplit}
              />
            </div>
          </div>

          <div className="flex gap-2.5 px-4 pt-4">
            <Button variant="ghost" onClick={() => setStep("confirm")}>
              スキップ
            </Button>
            <Button variant="primary" full onClick={() => setStep("confirm")}>
              確認へ
            </Button>
          </div>
        </div>
      )}

      {step === "confirm" && (
        <div className="flex flex-col gap-3">
          <div className="px-4">
            <div className="flex flex-col items-center gap-3 rounded-md border border-border bg-surface p-5 text-center shadow-1">
              <div
                aria-hidden
                className="flex size-[72px] items-center justify-center rounded-md text-3xl text-white"
                style={{ backgroundColor: color }}
              >
                {icon}
              </div>
              <div className="text-lg font-bold text-text-primary">{name}</div>
              {description && (
                <div className="text-xs leading-relaxed text-text-secondary">
                  {description}
                </div>
              )}
            </div>
          </div>

          <div className="px-4">
            <div className="overflow-hidden rounded-md border border-border bg-surface shadow-1">
              <SummaryRow label="公開設定" value={opennessLabel} />
              <Divider inset={16} />
              <SummaryRow
                label="サンクス単位"
                value={`${unitName}（${unitSymbol}）`}
              />
              <Divider inset={16} />
              <SummaryRow label="初期ロール" value={defaultRole} />
              <Divider inset={16} />
              <SummaryRow
                label="有効な機能"
                value={
                  <span className="inline-flex flex-wrap justify-end gap-1.5">
                    <Badge kind="member">サンクス</Badge>
                    {enableDuty && <Badge kind="role">当番</Badge>}
                    {enableSplit && <Badge kind="info">分配</Badge>}
                  </span>
                }
              />
            </div>
          </div>

          <div className="flex gap-2.5 px-4 pt-4">
            <Button
              variant="secondary"
              onClick={() => setStep("initial")}
              disabled={isWorking}
            >
              戻って修正
            </Button>
            <Button
              variant="primary"
              full
              onClick={handleCreate}
              disabled={isWorking || !wallet}
              data-testid="workspace-create-submit"
            >
              {isWorking ? "作成中..." : "作成する"}
            </Button>
          </div>
        </div>
      )}

      {step === "done" && (
        <div className="flex flex-col gap-5 px-6 pt-10 text-center">
          <div className="flex flex-col items-center">
            <div
              aria-hidden
              className="flex size-24 items-center justify-center rounded-full text-[44px] font-bold text-white"
              style={{
                backgroundColor: color,
                boxShadow: `0 0 0 12px ${color}22`,
              }}
            >
              {icon}
            </div>
          </div>
          <div className="space-y-2">
            <div className="text-xl font-bold text-text-primary">
              ワークスペースを作成しました
            </div>
            <div className="text-[13px] leading-relaxed text-text-secondary">
              <strong className="text-text-primary">{name}</strong>{" "}
              をはじめましょう。
            </div>
          </div>

          <div className="text-left">
            <div className="overflow-hidden rounded-md border border-border bg-surface shadow-1">
              <div className="px-4 pt-3 pb-1 text-xs font-bold tracking-[0.04em] text-text-secondary">
                次にできること
              </div>
              <NextStepCard
                icon="invite"
                label="メンバーを招待する"
                onClick={goToTreeHome}
              />
              <Divider inset={16} />
              <NextStepCard
                icon="duty"
                label="当番を作成する"
                onClick={goToTreeHome}
              />
              <Divider inset={16} />
              <NextStepCard
                icon="send"
                label="サンクスを送る"
                onClick={goToTreeHome}
              />
            </div>
          </div>

          <div className="flex flex-col gap-2.5">
            <Button variant="primary" full onClick={goToTreeHome}>
              メンバーを招待
            </Button>
            <Button variant="ghost" full onClick={() => navigate("/")}>
              ホームへ
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkspaceNew;
