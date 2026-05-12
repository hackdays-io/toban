import { type FC, useId, useState } from "react";
import type { HatsDetailsAttributes } from "types/hats";
import { Chip } from "~/components/composite/chip";
import { FieldLabel } from "~/components/composite/field-label";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Button } from "~/components/ui/button";
import { Icon, type IconName } from "~/components/ui/icon";
import { Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea";
import type { FallbackIconKind } from "~/lib/avatar-fallback";
import { cn } from "~/lib/utils";

export interface DutyFormValues {
  name: string;
  description: string;
  responsibilities: HatsDetailsAttributes;
  authorities: HatsDetailsAttributes;
}

interface DutyFormProps {
  value: DutyFormValues;
  onChange: (next: DutyFormValues) => void;
  /** Object-URL or `https://` preview for the currently selected image. */
  imagePreview?: string;
  onImageSelect: (file: File) => void;
  /** Random fallback colour applied to the avatar fallback. */
  fallbackColor: string;
  /** Random fallback icon kind — matches the icon used for the IPFS-uploaded
   * placeholder so the preview and saved asset stay in sync. */
  fallbackIcon: FallbackIconKind;
  /** Disables every interactive control while a transaction is in flight. */
  disabled?: boolean;
}

// react-icons name to use for the in-page preview, keyed by the fallback kind.
// `house` is workspace-only; never used here but listed so the map is total.
const FALLBACK_PREVIEW_ICON: Record<FallbackIconKind, IconName> = {
  house: "home",
  user: "user",
  heart: "heart",
  shield: "shield",
  sparkle: "sparkle",
  pie: "pie",
};

export const DutyForm: FC<DutyFormProps> = ({
  value,
  onChange,
  imagePreview,
  onImageSelect,
  fallbackColor,
  fallbackIcon,
  disabled,
}) => {
  const nameInputId = useId();
  const descriptionInputId = useId();
  const [draftResponsibility, setDraftResponsibility] = useState("");
  const [draftAuthority, setDraftAuthority] = useState("");

  const update = <K extends keyof DutyFormValues>(
    key: K,
    next: DutyFormValues[K],
  ) => {
    onChange({ ...value, [key]: next });
  };

  const addResponsibility = () => {
    const label = draftResponsibility.trim();
    if (!label) return;
    update("responsibilities", [...value.responsibilities, { label }]);
    setDraftResponsibility("");
  };
  const removeResponsibility = (index: number) => {
    update(
      "responsibilities",
      value.responsibilities.filter((_, i) => i !== index),
    );
  };

  const addAuthority = () => {
    const label = draftAuthority.trim();
    if (!label) return;
    update("authorities", [...value.authorities, { label }]);
    setDraftAuthority("");
  };
  const removeAuthority = (index: number) => {
    update(
      "authorities",
      value.authorities.filter((_, i) => i !== index),
    );
  };

  const fallbackIconName = FALLBACK_PREVIEW_ICON[fallbackIcon];

  return (
    <div
      className={cn(
        "flex flex-col gap-5 pb-6",
        disabled && "pointer-events-none opacity-60",
      )}
    >
      {/* Image upload */}
      <div className="px-5">
        <FieldLabel>アイコン</FieldLabel>
        <div className="flex flex-col items-center gap-2">
          <label className="group relative cursor-pointer">
            <input
              type="file"
              accept="image/*"
              className="sr-only"
              data-testid="duty-image-input"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                if (file.type.startsWith("image/")) {
                  onImageSelect(file);
                } else {
                  alert("画像ファイルを選択してください。");
                }
              }}
            />
            <Avatar
              size="xl"
              className="size-36 ring-2 ring-border transition group-hover:ring-primary"
            >
              {imagePreview && (
                <AvatarImage src={imagePreview} alt="当番アイコン" />
              )}
              <AvatarFallback
                className="text-white"
                style={{ backgroundColor: fallbackColor }}
              >
                <Icon
                  name={fallbackIconName}
                  size={44}
                  className="text-white"
                />
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

      {/* Name */}
      <div className="px-5">
        <FieldLabel htmlFor={nameInputId}>
          当番名 <span className="text-danger">*</span>
        </FieldLabel>
        <Input
          id={nameInputId}
          value={value.name}
          onChange={(e) => update("name", e.target.value)}
          placeholder="例：食器を洗おう"
          data-testid="duty-name-input"
        />
      </div>

      {/* Description */}
      <div className="px-5">
        <FieldLabel htmlFor={descriptionInputId}>説明</FieldLabel>
        <Textarea
          id={descriptionInputId}
          rows={4}
          value={value.description}
          onChange={(e) => update("description", e.target.value)}
          placeholder="この当番の役割や進め方を入力"
          data-testid="duty-description-input"
        />
      </div>

      {/* Responsibilities */}
      <div className="px-5">
        <FieldLabel>責任</FieldLabel>
        {value.responsibilities.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-2">
            {value.responsibilities.map((item, index) => (
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
            placeholder="例：当番表をまとめる"
            data-testid="responsibility-input"
          />
          <Button
            type="button"
            variant="secondary"
            onClick={addResponsibility}
            disabled={!draftResponsibility.trim()}
          >
            追加
          </Button>
        </div>
      </div>

      {/* Authorities */}
      <div className="px-5">
        <FieldLabel>権限</FieldLabel>
        {value.authorities.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-2">
            {value.authorities.map((item, index) => (
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
            placeholder="例：メンバーを招待"
            data-testid="authority-input"
          />
          <Button
            type="button"
            variant="secondary"
            onClick={addAuthority}
            disabled={!draftAuthority.trim()}
          >
            追加
          </Button>
        </div>
      </div>
    </div>
  );
};
