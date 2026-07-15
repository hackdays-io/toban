import { useHats } from "hooks/useHats";
import { useCreateHatFromHatCreatorModule } from "hooks/useHatsHatCreatorModule";
import {
  useUploadHatsDetailsToIpfs,
  useUploadImageFileToIpfs,
} from "hooks/useIpfs";
import { useActiveWallet } from "hooks/useWallet";
import { useGetWorkspace } from "hooks/useWorkspace";
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
import type { Address } from "viem";
import { ScreenHeader } from "~/components/layout/ScreenHeader";
import { DutyForm, type DutyFormValues } from "~/components/roles/DutyForm";
import { SEED_PALETTE } from "~/components/ui/avatar";
import { Button } from "~/components/ui/button";
import { Icon } from "~/components/ui/icon";
import {
  type FallbackIconKind,
  buildFallbackSvgFile,
  pickRandomColor,
  pickRandomDutyIcon,
} from "~/lib/avatar-fallback";

const DEFAULT_MAX_SUPPLY = 10;

const buildInitialFormValues = (): DutyFormValues => ({
  name: "",
  description: "",
  responsibilities: [],
  authorities: [],
});

const NewRole: FC = () => {
  const { treeId } = useParams();
  const navigate = useNavigate();

  const [form, setForm] = useState<DutyFormValues>(buildInitialFormValues);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Random color + icon are chosen on mount (post-hydration) to avoid an
  // SSR/CSR mismatch from Math.random in the initialiser. Stay stable across
  // re-renders so the avatar preview doesn't flicker as the user types.
  const [fallbackColor, setFallbackColor] = useState<string>(SEED_PALETTE[0]);
  const [fallbackIcon, setFallbackIcon] = useState<FallbackIconKind>("user");
  useEffect(() => {
    setFallbackColor(pickRandomColor());
    setFallbackIcon(pickRandomDutyIcon());
  }, []);

  // Reset the AppShell's scroll container to the top on mount — otherwise the
  // user lands on this form scrolled down to wherever they were on the
  // previous page. `window.scrollTo` is a no-op because AppShell wraps the
  // routes in `<main overflow-y-auto>`, so we walk up the DOM to find the
  // actual scroll container.
  const rootRef = useRef<HTMLDivElement>(null);
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
  }, []);

  const { wallet } = useActiveWallet();
  const { data: workspace } = useGetWorkspace({ workspaceId: treeId || "" });
  const { createHat } = useCreateHatFromHatCreatorModule(
    workspace?.workspace?.hatsHatCreatorModule as Address,
  );
  const { uploadHatsDetailsToIpfs } = useUploadHatsDetailsToIpfs();
  const { uploadImageFileToIpfs, imageFile, setImageFile } =
    useUploadImageFileToIpfs();
  const { getTreeInfo } = useHats();

  const imagePreview = useMemo(
    () => (imageFile ? URL.createObjectURL(imageFile) : undefined),
    [imageFile],
  );

  const isValid = form.name.trim().length > 0 && !!wallet;

  const handleSubmit = useCallback(async () => {
    if (!wallet) {
      toast.error("ウォレットを接続してください。");
      return;
    }
    if (!form.name.trim()) {
      toast.error("当番名を入力してください。");
      return;
    }

    setIsSubmitting(true);
    try {
      const fileToUpload =
        imageFile ??
        buildFallbackSvgFile(fallbackColor, fallbackIcon, "duty-icon.svg");

      const [resUploadHatsDetails, resUploadImage, treeInfo] =
        await Promise.all([
          uploadHatsDetailsToIpfs({
            name: form.name.trim(),
            description: form.description,
            responsabilities: form.responsibilities,
            authorities: form.authorities,
          }),
          uploadImageFileToIpfs(fileToUpload),
          getTreeInfo({ treeId: Number(treeId) }),
        ]);

      if (!resUploadHatsDetails) {
        throw new Error("当番メタデータの保存に失敗しました。");
      }

      const hatterHatId = treeInfo?.hats?.[1]?.id;
      if (!hatterHatId) {
        throw new Error("親 Hat の取得に失敗しました。");
      }

      const parsedLog = await createHat({
        parentHatId: BigInt(hatterHatId),
        details: resUploadHatsDetails.ipfsUri,
        maxSupply: DEFAULT_MAX_SUPPLY,
        imageURI: resUploadImage?.ipfsUri || "",
      });

      const log = parsedLog?.find((l) => l.eventName === "HatCreated");
      if (!log) {
        throw new Error("当番作成トランザクションに失敗しました。");
      }

      // Give the subgraph a moment to index the new hat before navigating.
      await new Promise((resolve) => setTimeout(resolve, 3000));
      const hatIdHex = log.args.id?.toString(16) ?? "";
      const padded = hatIdHex.padStart(64, "0");
      navigate(`/${treeId}/0x${padded}`);
    } catch (error) {
      console.error(error);
      toast.error(
        error instanceof Error
          ? error.message
          : "当番の作成中にエラーが発生しました。",
      );
    } finally {
      setIsSubmitting(false);
    }
  }, [
    createHat,
    fallbackColor,
    fallbackIcon,
    form,
    getTreeInfo,
    imageFile,
    navigate,
    treeId,
    uploadHatsDetailsToIpfs,
    uploadImageFileToIpfs,
    wallet,
  ]);

  return (
    <div ref={rootRef} className="flex min-h-dvh flex-col bg-bg">
      <ScreenHeader
        title="当番を作成"
        onBack={() => navigate(`/${treeId}/role`)}
      />
      <DutyForm
        value={form}
        onChange={setForm}
        imagePreview={imagePreview}
        onImageSelect={setImageFile}
        fallbackColor={fallbackColor}
        fallbackIcon={fallbackIcon}
        disabled={isSubmitting}
      />
      <div className="flex gap-2.5 px-4 pt-2 pb-6">
        <Button
          type="button"
          variant="secondary"
          onClick={() => navigate(`/${treeId}/role`)}
          disabled={isSubmitting}
          className="shrink-0"
        >
          キャンセル
        </Button>
        <Button
          type="button"
          variant="primary"
          disabled={!isValid || isSubmitting}
          onClick={handleSubmit}
          data-testid="duty-create-submit"
          className="flex-1"
        >
          <Icon name="plus" size={16} />
          {isSubmitting ? "作成中..." : "作成する"}
        </Button>
      </div>
    </div>
  );
};

export default NewRole;
