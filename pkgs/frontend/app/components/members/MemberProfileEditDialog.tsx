import { useAddressesByNames, useUpdateName } from "hooks/useENS";
import { useUploadImageFileToIpfs } from "hooks/useIpfs";
import type { NameData } from "namestone-sdk";
import { type FC, useEffect, useId, useMemo, useState } from "react";
import { toast } from "sonner";
import { ipfs2https } from "utils/ipfs";
import { FieldLabel } from "~/components/composite/field-label";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Button } from "~/components/ui/button";
import { Icon } from "~/components/ui/icon";
import { Input } from "~/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "~/components/ui/sheet";
import { Textarea } from "~/components/ui/textarea";

interface MemberProfileEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** The signed-in user's own address — the profile being edited. */
  address: string;
  /** Current resolved profile, used to pre-fill and to diff against. */
  identity?: NameData;
  /** Called after a successful save so the parent can refetch. */
  onSaved?: () => void;
}

// Self-service profile editor (name / avatar / bio), shown from the member
// detail page when viewing your own profile. Renders as a bottom Sheet on
// mobile and a centered panel on desktop — the same pattern as
// `RoleAttributeDialog`.
export const MemberProfileEditDialog: FC<MemberProfileEditDialogProps> = ({
  open,
  onOpenChange,
  address,
  identity,
  onSaved,
}) => {
  const nameId = useId();
  const bioId = useId();
  const { updateName, isLoading: isUpdating } = useUpdateName();
  const { uploadImageFileToIpfs, imageFile, setImageFile } =
    useUploadImageFileToIpfs();

  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [saving, setSaving] = useState(false);

  // Re-sync to the current identity each time the dialog opens.
  useEffect(() => {
    if (open) {
      setName(identity?.name ?? "");
      setBio(identity?.text_records?.description ?? "");
      setImageFile(null);
    }
  }, [open, identity, setImageFile]);

  const trimmedName = name.trim();

  // Namestone name availability — a name is usable if nobody else holds it
  // (empty address list) or it is unchanged from the current profile.
  const lookupNames = useMemo(
    () => (trimmedName ? [trimmedName] : []),
    [trimmedName],
  );
  const { addresses } = useAddressesByNames(lookupNames, true);
  const nameAvailable = useMemo(() => {
    if (!trimmedName) return false;
    if (identity?.name === trimmedName) return true;
    return addresses?.[0]?.length === 0;
  }, [trimmedName, identity?.name, addresses]);

  const newImagePreview = useMemo(
    () => (imageFile ? URL.createObjectURL(imageFile) : undefined),
    [imageFile],
  );
  const avatarPreview =
    newImagePreview ?? ipfs2https(identity?.text_records?.avatar);

  const handleSubmit = async () => {
    if (!address) {
      toast.error("ウォレットを接続してください。");
      return;
    }
    if (!trimmedName) {
      toast.error("名前を入力してください。");
      return;
    }
    if (!nameAvailable) {
      toast.error("この名前はすでに使われています。");
      return;
    }

    setSaving(true);
    try {
      let avatarUri = identity?.text_records?.avatar ?? "";
      if (imageFile) {
        const res = await uploadImageFileToIpfs();
        if (!res) throw new Error("画像のアップロードに失敗しました。");
        avatarUri = res.ipfsUri;
      }
      const result = await updateName({
        name: trimmedName,
        address,
        text_records: { avatar: avatarUri, description: bio },
      });
      if (!result?.success) {
        throw new Error("プロフィールの更新に失敗しました。");
      }
      toast.success("プロフィールを更新しました。");
      onSaved?.();
      onOpenChange(false);
    } catch (error) {
      console.error(error);
      toast.error(
        error instanceof Error
          ? error.message
          : "プロフィールの更新に失敗しました。",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="md:left-1/2 md:right-auto md:w-full md:max-w-md md:-translate-x-1/2"
      >
        <SheetHeader>
          <SheetTitle>プロフィールを編集</SheetTitle>
        </SheetHeader>

        <div className="flex flex-col gap-4 px-5 pt-1 pb-2">
          {/* Avatar */}
          <div className="flex flex-col items-center gap-1.5">
            <label className="group relative cursor-pointer">
              <input
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  if (file.type.startsWith("image/")) {
                    setImageFile(file);
                  } else {
                    toast.error("画像ファイルを選択してください。");
                  }
                }}
              />
              <Avatar
                size="xl"
                className="size-24 ring-2 ring-border transition group-hover:ring-primary"
              >
                {avatarPreview && (
                  <AvatarImage src={avatarPreview} alt="プロフィール画像" />
                )}
                <AvatarFallback seed={trimmedName || address} />
              </Avatar>
              <span className="absolute right-0 bottom-0 flex size-7 items-center justify-center rounded-full border border-border bg-surface text-text-secondary shadow-1 transition group-hover:text-primary">
                <Icon name="edit" size={14} />
              </span>
            </label>
          </div>

          <div>
            <FieldLabel htmlFor={nameId}>
              名前 <span className="text-danger">*</span>
            </FieldLabel>
            <Input
              id={nameId}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="表示名を入力"
            />
            {trimmedName && !nameAvailable && (
              <p className="mt-1 text-xs text-danger">
                この名前はすでに使われています。
              </p>
            )}
          </div>

          <div>
            <FieldLabel htmlFor={bioId}>自己紹介</FieldLabel>
            <Textarea
              id={bioId}
              rows={3}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="自己紹介を入力"
            />
          </div>
        </div>

        <SheetFooter className="flex-row gap-2.5">
          <Button
            type="button"
            variant="secondary"
            onClick={() => onOpenChange(false)}
            disabled={saving || isUpdating}
            className="shrink-0"
          >
            キャンセル
          </Button>
          <Button
            type="button"
            variant="primary"
            onClick={handleSubmit}
            disabled={saving || isUpdating || !trimmedName || !nameAvailable}
            className="flex-1"
          >
            {saving || isUpdating ? "保存中..." : "保存"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};
