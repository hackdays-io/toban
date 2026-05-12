import { useGetHat, useHats } from "hooks/useHats";
import {
  useQueryIpfsJsonData,
  useUploadHatsDetailsToIpfs,
  useUploadImageFileToIpfs,
} from "hooks/useIpfs";
import { useActiveWallet } from "hooks/useWallet";
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
import { ScreenHeader } from "~/components/layout/ScreenHeader";
import { DutyForm, type DutyFormValues } from "~/components/roles/DutyForm";
import { SEED_PALETTE } from "~/components/ui/avatar";
import { Button } from "~/components/ui/button";
import { Icon } from "~/components/ui/icon";
// Delete flow is parked until on-chain duty deactivation is wired up — see the
// commented-out blocks below. Re-import these when the feature lands:
// import {
//   Sheet,
//   SheetContent,
//   SheetFooter,
//   SheetHeader,
//   SheetTitle,
// } from "~/components/ui/sheet";
// import { Typography } from "~/components/ui/typography";
import {
  type FallbackIconKind,
  pickRandomColor,
  pickRandomDutyIcon,
} from "~/lib/avatar-fallback";

const buildInitialFormValues = (): DutyFormValues => ({
  name: "",
  description: "",
  responsibilities: [],
  authorities: [],
});

const hydrateFromDetail = (
  detail: HatsDetailSchama | undefined,
): DutyFormValues => {
  if (!detail) return buildInitialFormValues();
  return {
    name: detail.data.name ?? "",
    description: detail.data.description ?? "",
    responsibilities: detail.data.responsabilities ?? [],
    authorities: detail.data.authorities ?? [],
  };
};

const EditRole: FC = () => {
  const { treeId, hatId } = useParams();
  const navigate = useNavigate();
  const { wallet } = useActiveWallet();
  const { hat } = useGetHat(hatId || "");
  const { changeHatDetails, changeHatImageURI } = useHats();
  const { uploadHatsDetailsToIpfs } = useUploadHatsDetailsToIpfs();
  const { uploadImageFileToIpfs, imageFile, setImageFile } =
    useUploadImageFileToIpfs();
  const { data: hatDetailJson } = useQueryIpfsJsonData(hat?.details);

  const [form, setForm] = useState<DutyFormValues>(buildInitialFormValues);
  const [hydrated, setHydrated] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Delete flow parked — no on-chain hat deactivation primitive exists today.
  // const [deleteOpen, setDeleteOpen] = useState(false);
  // const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (!hydrated && hatDetailJson) {
      setForm(hydrateFromDetail(hatDetailJson));
      setHydrated(true);
    }
  }, [hydrated, hatDetailJson]);

  // Random fallback (post-hydration to avoid SSR mismatch). Used only when the
  // hat has no existing imageUri AND the user hasn't picked a new one.
  const [fallbackColor, setFallbackColor] = useState<string>(SEED_PALETTE[0]);
  const [fallbackIcon, setFallbackIcon] = useState<FallbackIconKind>("user");
  useEffect(() => {
    setFallbackColor(pickRandomColor());
    setFallbackIcon(pickRandomDutyIcon());
  }, []);

  // Scroll to top on mount so the form opens at the header, not wherever the
  // previous page left the AppShell scroll container.
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

  // Newly-picked file wins over the on-chain imageUri; otherwise show whatever
  // the hat currently points at.
  const newImagePreview = useMemo(
    () => (imageFile ? URL.createObjectURL(imageFile) : undefined),
    [imageFile],
  );
  const existingImageUrl = useMemo(
    () => ipfs2https(hat?.imageUri),
    [hat?.imageUri],
  );
  const imagePreview = newImagePreview ?? existingImageUrl;

  const isValid = form.name.trim().length > 0 && !!wallet;

  const backToDetail = useCallback(() => {
    navigate(`/${treeId}/${hatId}`);
  }, [navigate, treeId, hatId]);

  const handleSubmit = useCallback(async () => {
    if (!wallet) {
      toast.error("ウォレットを接続してください。");
      return;
    }
    if (!hatId) return;
    if (!form.name.trim()) {
      toast.error("当番名を入力してください。");
      return;
    }

    setIsSubmitting(true);
    try {
      const promises: Promise<unknown>[] = [];

      const resUploadHatsDetails = await uploadHatsDetailsToIpfs({
        name: form.name.trim(),
        description: form.description,
        responsabilities: form.responsibilities,
        authorities: form.authorities,
      });
      if (!resUploadHatsDetails) {
        throw new Error("メタデータの保存に失敗しました。");
      }
      promises.push(
        changeHatDetails({
          hatId: BigInt(hatId),
          newDetails: resUploadHatsDetails.ipfsUri,
        }),
      );

      // Only re-upload the image when the user picked a new file — otherwise
      // keep the hat pointing at its existing imageUri.
      if (imageFile) {
        const resUploadImage = await uploadImageFileToIpfs(imageFile);
        if (!resUploadImage) {
          throw new Error("画像のアップロードに失敗しました。");
        }
        promises.push(
          changeHatImageURI({
            hatId: BigInt(hatId),
            newImageURI: resUploadImage.ipfsUri,
          }),
        );
      }

      await Promise.all(promises);
      toast.success("当番を更新しました。");
      backToDetail();
    } catch (error) {
      console.error(error);
      toast.error(
        error instanceof Error
          ? error.message
          : "更新中にエラーが発生しました。",
      );
    } finally {
      setIsSubmitting(false);
    }
  }, [
    wallet,
    hatId,
    form,
    imageFile,
    uploadHatsDetailsToIpfs,
    uploadImageFileToIpfs,
    changeHatDetails,
    changeHatImageURI,
    backToDetail,
  ]);

  // Delete flow parked — restore when the on-chain duty-toggle work ships.
  // const handleDelete = useCallback(async () => {
  //   setIsDeleting(true);
  //   try {
  //     toast.info("削除機能は準備中です。", {
  //       description: "近日中に利用可能になります。",
  //     });
  //   } finally {
  //     setIsDeleting(false);
  //     setDeleteOpen(false);
  //   }
  // }, []);

  return (
    <div ref={rootRef} className="flex min-h-dvh flex-col bg-bg">
      <ScreenHeader title="当番を編集" onBack={backToDetail} />
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
          onClick={backToDetail}
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
          data-testid="duty-edit-submit"
          className="flex-1"
        >
          <Icon name="check" size={16} />
          {isSubmitting ? "保存中..." : "保存"}
        </Button>
        {/* Delete CTA parked — restore alongside the Sheet below when the
            on-chain duty-toggle work ships.
        <Button
          type="button"
          variant="ghost"
          onClick={() => setDeleteOpen(true)}
          disabled={isSubmitting}
          className="w-full text-danger hover:bg-[#FBE5E2]"
        >
          当番を削除
        </Button>
        */}
      </div>

      {/* Delete confirmation sheet parked — see the commented imports / state /
          handler above. Restore together when the duty-toggle feature lands.
      <Sheet open={deleteOpen} onOpenChange={setDeleteOpen}>
        <SheetContent
          side="bottom"
          className="md:left-1/2 md:right-auto md:w-full md:max-w-md md:-translate-x-1/2"
        >
          <SheetHeader>
            <SheetTitle>当番を削除しますか？</SheetTitle>
          </SheetHeader>
          <div className="px-5">
            <Typography
              variant="bodySm"
              tone="secondary"
              className="leading-relaxed"
            >
              この当番を削除すると、関連する履歴は残りますが新しい担当の追加はできなくなります。
            </Typography>
          </div>
          <SheetFooter className="flex-row gap-2.5">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setDeleteOpen(false)}
              disabled={isDeleting}
              className="shrink-0"
            >
              キャンセル
            </Button>
            <Button
              type="button"
              variant="dark"
              onClick={handleDelete}
              disabled={isDeleting}
              className="flex-1 bg-danger hover:brightness-110"
            >
              {isDeleting ? "削除中..." : "削除する"}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
      */}
    </div>
  );
};

export default EditRole;
