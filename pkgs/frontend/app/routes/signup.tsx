import { useAddressesByNames, useSetName } from "hooks/useENS";
import { useUploadImageFileToIpfs } from "hooks/useIpfs";
import { useActiveWallet } from "hooks/useWallet";
import type { TextRecords } from "namestone-sdk";
import { type FC, useCallback, useMemo, useState } from "react";
import { toast } from "react-toastify";
import { AuthHero } from "~/components/composite/auth-hero";
import { FieldLabel } from "~/components/composite/field-label";
import { AuthLayout } from "~/components/layout/AuthLayout";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Button } from "~/components/ui/button";
import { Card, CardContent } from "~/components/ui/card";
import { Icon } from "~/components/ui/icon";
import { Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea";

const Signup: FC = () => {
  const [userName, setUserName] = useState("");

  const {
    uploadImageFileToIpfs,
    imageFile,
    setImageFile,
    isLoading: isIpfsLoading,
  } = useUploadImageFileToIpfs();

  const { wallet } = useActiveWallet();

  const { setName, isLoading: isSetNameLoading } = useSetName();

  const [description, setDescription] = useState("");

  const names = useMemo(() => {
    return userName ? [userName] : [];
  }, [userName]);
  const { addresses } = useAddressesByNames(names, true);

  const availableName = useMemo(() => {
    if (!userName || userName.includes("_")) return false;

    return addresses?.[0]?.length === 0;
  }, [userName, addresses]);

  const previewUrl = useMemo(
    () => (imageFile ? URL.createObjectURL(imageFile) : undefined),
    [imageFile],
  );

  const handleSubmit = useCallback(async () => {
    if (!wallet || !availableName) return;

    try {
      const params: {
        name: string;
        address: string;
        text_records: TextRecords;
      } = {
        name: userName,
        address: wallet.account?.address,
        text_records: {},
      };

      if (imageFile) {
        const res = await uploadImageFileToIpfs();
        if (res) params.text_records.avatar = res.ipfsUri;
      }

      if (description) {
        params.text_records.description = description;
      }

      await setName(params);
      window.location.href = "/workspace";
    } catch (error) {
      console.error(error);
      toast.error("エラーが発生しました");
      return;
    }
  }, [
    availableName,
    imageFile,
    description,
    setName,
    uploadImageFileToIpfs,
    userName,
    wallet,
  ]);

  return (
    <AuthLayout
      hero={
        <AuthHero
          eyebrow="プロフィールを作成"
          title={
            <>
              はじめまして、
              <br />
              あなたのことを教えてください。
            </>
          }
          description="表示名とアイコンはワークスペースの仲間に見える名札になります。あとから変更できます。"
        />
      }
    >
      <Card className="w-full max-w-md" data-testid="signup-form">
        <CardContent className="flex flex-col gap-6">
          {/* Avatar picker */}
          <div className="flex flex-col items-center gap-2">
            <label className="group relative cursor-pointer">
              <input
                type="file"
                accept="image/*"
                className="sr-only"
                data-testid="file-input"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file?.type.startsWith("image/")) {
                    setImageFile(file);
                  } else {
                    toast.error("画像ファイルを選択してください");
                  }
                }}
              />
              <Avatar
                size="xl"
                className="size-28 ring-2 ring-border transition group-hover:ring-primary"
              >
                {previewUrl && (
                  <AvatarImage src={previewUrl} alt="プロフィール画像" />
                )}
                <AvatarFallback seed={userName || "Toban"}>
                  <Icon name="user" size={28} className="text-text-secondary" />
                </AvatarFallback>
              </Avatar>
              <span className="absolute right-0 bottom-0 flex size-9 items-center justify-center rounded-full border border-border bg-surface text-text-secondary shadow-1 transition group-hover:text-primary">
                <Icon name="edit" size={16} />
              </span>
            </label>
            <span className="text-xs text-text-secondary">
              アイコンをタップして画像を選択
            </span>
          </div>

          {/* Username */}
          <div>
            <FieldLabel htmlFor="signup-username">ユーザー名</FieldLabel>
            <Input
              id="signup-username"
              value={userName}
              placeholder="例: toban_user"
              data-testid="user-name-input"
              onChange={(e) => setUserName(e.target.value)}
              aria-invalid={Boolean(userName) && !availableName}
            />
            <p
              className={
                availableName
                  ? "mt-1.5 text-right text-xs font-semibold text-[color:var(--color-contrib)]"
                  : "mt-1.5 text-right text-xs text-text-secondary"
              }
            >
              {userName
                ? availableName
                  ? "この名前は利用可能です"
                  : "この名前は利用できません"
                : "半角英数字のみ。アンダースコアは使えません。"}
            </p>
          </div>

          {/* Description */}
          <div>
            <FieldLabel htmlFor="signup-description">
              自己紹介（任意）
            </FieldLabel>
            <Textarea
              id="signup-description"
              value={description}
              placeholder="どんな貢献が得意か、ひとことで紹介しましょう。"
              data-testid="description-input"
              onChange={(e) => setDescription(e.target.value)}
              className="min-h-32"
            />
          </div>

          <Button
            size="lg"
            full
            onClick={handleSubmit}
            disabled={!availableName || isIpfsLoading || isSetNameLoading}
            data-testid="save-button"
          >
            {isIpfsLoading || isSetNameLoading
              ? "保存中..."
              : "プロフィールを保存"}
          </Button>
        </CardContent>
      </Card>
    </AuthLayout>
  );
};

export default Signup;
