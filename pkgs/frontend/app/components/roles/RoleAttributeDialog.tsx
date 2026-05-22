import { type FC, useEffect, useId, useState } from "react";
import { FieldLabel } from "~/components/composite/field-label";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "~/components/ui/sheet";
import { Textarea } from "~/components/ui/textarea";

export interface RoleAttributeValue {
  label: string;
  description?: string;
}

interface RoleAttributeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** `add` starts from an empty form; `edit` pre-fills from `value`. */
  mode: "add" | "edit";
  /** Noun shown in the title, e.g. "責任" / "権限". */
  noun: string;
  /** Initial value — required for `mode="edit"`. */
  value?: RoleAttributeValue;
  onSubmit: (value: RoleAttributeValue) => void;
  labelPlaceholder?: string;
  descriptionPlaceholder?: string;
}

// Add / edit dialog for a single role attribute (責任 or 権限). Renders as a
// bottom Sheet on mobile and a centered panel on desktop — the Sheet+`md:`
// override pattern already used by the parked delete sheet in the duty edit
// route, so it stays SSR-safe (pure CSS, no media-query hook).
export const RoleAttributeDialog: FC<RoleAttributeDialogProps> = ({
  open,
  onOpenChange,
  mode,
  noun,
  value,
  onSubmit,
  labelPlaceholder,
  descriptionPlaceholder,
}) => {
  const labelId = useId();
  const descriptionId = useId();
  const [label, setLabel] = useState("");
  const [description, setDescription] = useState("");

  // Sync the form to the incoming value each time the dialog opens — covers
  // both add (empty) and edit (pre-filled) without leaking the previous edit.
  useEffect(() => {
    if (open) {
      setLabel(value?.label ?? "");
      setDescription(value?.description ?? "");
    }
  }, [open, value]);

  const trimmedLabel = label.trim();
  const canSubmit = trimmedLabel.length > 0;

  const handleSubmit = () => {
    if (!canSubmit) return;
    onSubmit({
      label: trimmedLabel,
      description: description.trim() || undefined,
    });
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="md:left-1/2 md:right-auto md:w-full md:max-w-md md:-translate-x-1/2"
      >
        <SheetHeader>
          <SheetTitle>
            {noun}を{mode === "add" ? "追加" : "編集"}
          </SheetTitle>
        </SheetHeader>

        <div className="flex flex-col gap-4 px-5 pt-1 pb-2">
          <div>
            <FieldLabel htmlFor={labelId}>
              ラベル <span className="text-danger">*</span>
            </FieldLabel>
            <Input
              id={labelId}
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.nativeEvent.isComposing) {
                  e.preventDefault();
                  handleSubmit();
                }
              }}
              placeholder={labelPlaceholder}
              data-testid="role-attribute-label-input"
            />
          </div>
          <div>
            <FieldLabel htmlFor={descriptionId}>説明</FieldLabel>
            <Textarea
              id={descriptionId}
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={descriptionPlaceholder}
              data-testid="role-attribute-description-input"
            />
          </div>
        </div>

        <SheetFooter className="flex-row gap-2.5">
          <Button
            type="button"
            variant="secondary"
            onClick={() => onOpenChange(false)}
            className="shrink-0"
          >
            キャンセル
          </Button>
          <Button
            type="button"
            variant="primary"
            onClick={handleSubmit}
            disabled={!canSubmit}
            data-testid="role-attribute-submit"
            className="flex-1"
          >
            {mode === "add" ? "追加" : "保存"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};
