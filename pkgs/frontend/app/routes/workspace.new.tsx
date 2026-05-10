import { hatIdToTreeId } from "@hatsprotocol/sdk-v1-core";
import { useBigBang } from "hooks/useBigBang";
import {
  useUploadHatsDetailsToIpfs,
  useUploadImageFileToIpfs,
} from "hooks/useIpfs";
import { useActiveWallet } from "hooks/useWallet";
import { type FC, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import type {
  HatsDetailsAuthorities,
  HatsDetailsResponsabilities,
} from "types/hats";
import type { Address } from "viem";
import { Chip } from "~/components/composite/chip";
import { Divider } from "~/components/composite/divider";
import { FieldLabel } from "~/components/composite/field-label";
import { NextStepCard } from "~/components/composite/next-step-card";
import { StepBar } from "~/components/composite/step-bar";
import { SummaryRow } from "~/components/composite/summary-row";
import { ScreenHeader } from "~/components/layout/ScreenHeader";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  SEED_PALETTE,
} from "~/components/ui/avatar";
import { Button } from "~/components/ui/button";
import { Icon } from "~/components/ui/icon";
import { Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea";
import { buildFallbackSvgFile, pickRandomColor } from "~/lib/avatar-fallback";

type Step = "basic" | "initial" | "confirm" | "done";

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
  const {
    uploadImageFileToIpfs: uploadWorkspaceImage,
    imageFile: workspaceImage,
    setImageFile: setWorkspaceImage,
    isLoading: isUploadingWorkspaceImage,
  } = useUploadImageFileToIpfs();
  const {
    uploadImageFileToIpfs: uploadRoleImage,
    imageFile: roleImage,
    setImageFile: setRoleImage,
    isLoading: isUploadingRoleImage,
  } = useUploadImageFileToIpfs();

  // Flow state
  const [step, setStep] = useState<Step>("basic");
  const [createdTreeId, setCreatedTreeId] = useState<string | null>(null);

  // Step 1 — workspace basics
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  // Step 2 — initial role
  const [roleName, setRoleName] = useState("");
  const [roleDefinition, setRoleDefinition] = useState("");
  const [responsibilities, setResponsibilities] = useState<
    NonNullable<HatsDetailsResponsabilities>
  >([]);
  const [authorities, setAuthorities] = useState<
    NonNullable<HatsDetailsAuthorities>
  >([]);
  const [draftResponsibility, setDraftResponsibility] = useState("");
  const [draftAuthority, setDraftAuthority] = useState("");

  const addResponsibility = () => {
    const label = draftResponsibility.trim();
    if (!label) return;
    setResponsibilities((current) => [...current, { label }]);
    setDraftResponsibility("");
  };
  const removeResponsibility = (index: number) => {
    setResponsibilities((current) => current.filter((_, i) => i !== index));
  };
  const addAuthority = () => {
    const label = draftAuthority.trim();
    if (!label) return;
    setAuthorities((current) => [...current, { label }]);
    setDraftAuthority("");
  };
  const removeAuthority = (index: number) => {
    setAuthorities((current) => current.filter((_, i) => i !== index));
  };

  // Random fallback colours — chosen on mount (post-hydration to avoid
  // an SSR/CSR mismatch from Math.random in the initialiser).
  const [workspaceColor, setWorkspaceColor] = useState<string>(SEED_PALETTE[0]);
  const [roleColor, setRoleColor] = useState<string>(SEED_PALETTE[0]);
  useEffect(() => {
    setWorkspaceColor(pickRandomColor());
    setRoleColor(pickRandomColor());
  }, []);

  const isBasicValid = name.trim().length > 0;
  const isRoleValid = roleName.trim().length > 0;
  const isWorking =
    isUploadingDetails ||
    isUploadingWorkspaceImage ||
    isUploadingRoleImage ||
    isCreating;

  const workspaceImagePreview = useMemo(
    () => (workspaceImage ? URL.createObjectURL(workspaceImage) : undefined),
    [workspaceImage],
  );
  const roleImagePreview = useMemo(
    () => (roleImage ? URL.createObjectURL(roleImage) : undefined),
    [roleImage],
  );

  const handleCreate = async () => {
    if (!wallet) {
      alert("ウォレットを接続してください。");
      return;
    }
    if (!isBasicValid) {
      setStep("basic");
      return;
    }
    if (!isRoleValid) {
      setStep("initial");
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

      const roleMetadata = await uploadHatsDetailsToIpfs({
        name: roleName,
        description: roleDefinition,
        responsabilities: responsibilities,
        authorities: authorities,
      });
      if (!roleMetadata) {
        throw new Error("初期ロールメタデータの保存に失敗しました。");
      }

      const workspaceImageFile =
        workspaceImage ??
        buildFallbackSvgFile(workspaceColor, "house", "workspace-icon.svg");
      const roleImageFile =
        roleImage ?? buildFallbackSvgFile(roleColor, "user", "role-icon.svg");

      const workspaceImageUpload =
        await uploadWorkspaceImage(workspaceImageFile);
      const roleImageUpload = await uploadRoleImage(roleImageFile);

      const workspaceImageUri = workspaceImageUpload?.ipfsUri ?? "";
      const roleImageUri = roleImageUpload?.ipfsUri ?? "";

      const parsedLog = await bigbang({
        owner: wallet.account.address as Address,
        topHatDetails: workspaceMetadata.ipfsUri,
        topHatImageURI: workspaceImageUri,
        hatterHatDetails: workspaceMetadata.ipfsUri,
        hatterHatImageURI: workspaceImageUri,
        memberHatDetails: roleMetadata.ipfsUri,
        memberHatImageURI: roleImageUri,
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
                  ? "メンバーの初期ロール"
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
            <FieldLabel>アイコン</FieldLabel>
            <div className="flex flex-col items-center gap-2">
              <label className="group relative cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  data-testid="workspace-image-input"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file?.type.startsWith("image/")) {
                      setWorkspaceImage(file);
                    } else {
                      alert("画像ファイルを選択してください。");
                    }
                  }}
                />
                <Avatar
                  size="xl"
                  className="size-36 ring-2 ring-border transition group-hover:ring-primary"
                >
                  {workspaceImagePreview && (
                    <AvatarImage
                      src={workspaceImagePreview}
                      alt="ワークスペースアイコン"
                    />
                  )}
                  <AvatarFallback
                    className="text-white"
                    style={{ backgroundColor: workspaceColor }}
                  >
                    <Icon name="home" size={44} className="text-white" />
                  </AvatarFallback>
                </Avatar>
                <span className="absolute right-0 bottom-0 flex size-7 items-center justify-center rounded-full border border-border bg-surface text-text-secondary shadow-1 transition group-hover:text-primary">
                  <Icon name="edit" size={14} />
                </span>
              </label>
              <span className="text-xs text-text-secondary">
                アイコンをタップして画像を選択
              </span>
            </div>
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
            最初のメンバーロールを作成します。あとから変更できます。
          </div>

          <div className="px-5">
            <FieldLabel>アイコン</FieldLabel>
            <div className="flex flex-col items-center gap-2">
              <label className="group relative cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  data-testid="role-image-input"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file?.type.startsWith("image/")) {
                      setRoleImage(file);
                    } else {
                      alert("画像ファイルを選択してください。");
                    }
                  }}
                />
                <Avatar
                  size="xl"
                  className="size-36 ring-2 ring-border transition group-hover:ring-primary"
                >
                  {roleImagePreview && (
                    <AvatarImage src={roleImagePreview} alt="ロールアイコン" />
                  )}
                  <AvatarFallback
                    className="text-white"
                    style={{ backgroundColor: roleColor }}
                  >
                    <Icon name="user" size={44} className="text-white" />
                  </AvatarFallback>
                </Avatar>
                <span className="absolute right-0 bottom-0 flex size-7 items-center justify-center rounded-full border border-border bg-surface text-text-secondary shadow-1 transition group-hover:text-primary">
                  <Icon name="edit" size={14} />
                </span>
              </label>
              <span className="text-xs text-text-secondary">
                アイコンをタップして画像を選択
              </span>
            </div>
          </div>

          <div className="px-5">
            <FieldLabel htmlFor="role-name">
              ロール名 <span className="text-danger">*</span>
            </FieldLabel>
            <Input
              id="role-name"
              value={roleName}
              onChange={(e) => setRoleName(e.target.value)}
              placeholder="例：Member"
              data-testid="role-name-input"
              aria-invalid={!isRoleValid && roleName.length > 0}
            />
          </div>

          <div className="px-5">
            <FieldLabel htmlFor="role-definition">役割定義</FieldLabel>
            <Textarea
              id="role-definition"
              rows={4}
              value={roleDefinition}
              onChange={(e) => setRoleDefinition(e.target.value)}
              placeholder="このロールが担う役割を入力"
              data-testid="role-definition-input"
            />
          </div>

          <div className="px-5">
            <FieldLabel>役割（担当）</FieldLabel>
            {responsibilities.length > 0 && (
              <div className="mb-2 flex flex-wrap gap-2">
                {responsibilities.map((item, index) => (
                  <Chip
                    key={`${item.label}-${index}`}
                    onClick={() => removeResponsibility(index)}
                    aria-label={`${item.label} を削除`}
                  >
                    {item.label}
                    <Icon name="close" size={12} />
                  </Chip>
                ))}
              </div>
            )}
            <div className="flex gap-2">
              <Input
                value={draftResponsibility}
                onChange={(e) => setDraftResponsibility(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.nativeEvent.isComposing) {
                    e.preventDefault();
                    addResponsibility();
                  }
                }}
                placeholder="例：当番管理"
                data-testid="responsibility-input"
              />
              <Button
                variant="secondary"
                onClick={addResponsibility}
                disabled={!draftResponsibility.trim()}
              >
                追加
              </Button>
            </div>
          </div>

          <div className="px-5">
            <FieldLabel>権限</FieldLabel>
            {authorities.length > 0 && (
              <div className="mb-2 flex flex-wrap gap-2">
                {authorities.map((item, index) => (
                  <Chip
                    key={`${item.label}-${index}`}
                    onClick={() => removeAuthority(index)}
                    aria-label={`${item.label} を削除`}
                  >
                    {item.label}
                    <Icon name="close" size={12} />
                  </Chip>
                ))}
              </div>
            )}
            <div className="flex gap-2">
              <Input
                value={draftAuthority}
                onChange={(e) => setDraftAuthority(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.nativeEvent.isComposing) {
                    e.preventDefault();
                    addAuthority();
                  }
                }}
                placeholder="例：メンバーを追加"
                data-testid="authority-input"
              />
              <Button
                variant="secondary"
                onClick={addAuthority}
                disabled={!draftAuthority.trim()}
              >
                追加
              </Button>
            </div>
          </div>

          <div className="px-4 pt-4">
            <Button
              variant="primary"
              full
              disabled={!isRoleValid}
              onClick={() => setStep("confirm")}
            >
              確認へ
            </Button>
          </div>
        </div>
      )}

      {step === "confirm" && (
        <div className="flex flex-col gap-3">
          <div className="px-4">
            <div className="flex flex-col items-center gap-3 rounded-md border border-border bg-surface p-5 text-center shadow-1">
              <Avatar size="xl" className="size-[72px]">
                {workspaceImagePreview && (
                  <AvatarImage
                    src={workspaceImagePreview}
                    alt="ワークスペースアイコン"
                  />
                )}
                <AvatarFallback
                  className="text-white"
                  style={{ backgroundColor: workspaceColor }}
                >
                  <Icon name="home" size={28} className="text-white" />
                </AvatarFallback>
              </Avatar>
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
              <SummaryRow
                label="初期ロール"
                value={
                  <span className="inline-flex items-center gap-2">
                    <Avatar size="sm">
                      {roleImagePreview && (
                        <AvatarImage
                          src={roleImagePreview}
                          alt="ロールアイコン"
                        />
                      )}
                      <AvatarFallback
                        className="text-white"
                        style={{ backgroundColor: roleColor }}
                      >
                        <Icon name="user" size={14} className="text-white" />
                      </AvatarFallback>
                    </Avatar>
                    <span>{roleName}</span>
                  </span>
                }
              />
              {roleDefinition && (
                <>
                  <Divider inset={16} />
                  <SummaryRow label="役割定義" value={roleDefinition} />
                </>
              )}
              {responsibilities.length > 0 && (
                <>
                  <Divider inset={16} />
                  <SummaryRow
                    label="役割（担当）"
                    value={
                      <span className="inline-flex flex-wrap justify-end gap-1.5">
                        {responsibilities.map((item, index) => (
                          <span
                            key={`${item.label}-${index}`}
                            className="rounded-full border border-border bg-bg px-2 py-0.5 text-xs"
                          >
                            {item.label}
                          </span>
                        ))}
                      </span>
                    }
                  />
                </>
              )}
              {authorities.length > 0 && (
                <>
                  <Divider inset={16} />
                  <SummaryRow
                    label="権限"
                    value={
                      <span className="inline-flex flex-wrap justify-end gap-1.5">
                        {authorities.map((item, index) => (
                          <span
                            key={`${item.label}-${index}`}
                            className="rounded-full border border-border bg-bg px-2 py-0.5 text-xs"
                          >
                            {item.label}
                          </span>
                        ))}
                      </span>
                    }
                  />
                </>
              )}
            </div>
          </div>

          <div className="flex gap-2.5 px-4 pt-4">
            <Button
              variant="secondary"
              onClick={() => setStep("initial")}
              disabled={isWorking}
              className="shrink-0"
            >
              戻って修正
            </Button>
            <Button
              variant="primary"
              onClick={handleCreate}
              disabled={isWorking || !wallet}
              data-testid="workspace-create-submit"
              className="flex-1"
            >
              {isWorking ? "作成中..." : "作成する"}
            </Button>
          </div>
        </div>
      )}

      {step === "done" && (
        <div className="flex flex-col gap-5 px-6 pt-10 text-center">
          <div className="flex flex-col items-center">
            <Avatar size="xl" className="size-24">
              {workspaceImagePreview && (
                <AvatarImage
                  src={workspaceImagePreview}
                  alt="ワークスペースアイコン"
                />
              )}
              <AvatarFallback
                className="text-white"
                style={{ backgroundColor: workspaceColor }}
              >
                <Icon name="home" size={40} className="text-white" />
              </AvatarFallback>
            </Avatar>
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
