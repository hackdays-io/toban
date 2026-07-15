import { type FC, useId } from "react";
import type { HatsDetailsAttributes } from "types/hats";
import { FieldLabel } from "~/components/composite/field-label";
import { RoleAttributesEditor } from "~/components/roles/RoleAttributesEditor";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
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

  const update = <K extends keyof DutyFormValues>(
    key: K,
    next: DutyFormValues[K],
  ) => {
    onChange({ ...value, [key]: next });
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
      <RoleAttributesEditor
        noun="責任"
        items={value.responsibilities}
        onChange={(next) => update("responsibilities", next)}
        disabled={disabled}
        labelPlaceholder="例：当番表をまとめる"
        descriptionPlaceholder="この責任の進め方や範囲を入力"
        testIdPrefix="responsibility"
      />

      {/* Authorities */}
      <RoleAttributesEditor
        noun="権限"
        items={value.authorities}
        onChange={(next) => update("authorities", next)}
        disabled={disabled}
        labelPlaceholder="例：メンバーを招待"
        descriptionPlaceholder="この権限でできることを入力"
        testIdPrefix="authority"
      />
    </div>
  );
};
