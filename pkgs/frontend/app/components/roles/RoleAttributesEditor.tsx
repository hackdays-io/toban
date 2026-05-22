import { type FC, useState } from "react";
import type { HatsDetailsAttributes } from "types/hats";
import { Divider } from "~/components/composite/divider";
import { FieldLabel } from "~/components/composite/field-label";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import { Icon } from "~/components/ui/icon";
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "~/components/ui/sheet";
import { Typography } from "~/components/ui/typography";
import {
  RoleAttributeDialog,
  type RoleAttributeValue,
} from "./RoleAttributeDialog";

interface RoleAttributesEditorProps {
  /** Section heading and dialog noun, e.g. "責任" / "権限". */
  noun: string;
  items: HatsDetailsAttributes;
  onChange: (next: HatsDetailsAttributes) => void;
  disabled?: boolean;
  labelPlaceholder?: string;
  descriptionPlaceholder?: string;
  /** Stable prefix for test ids, e.g. "responsibility". */
  testIdPrefix?: string;
}

// Editable list of role attributes ({ label, description } pairs) used inside
// the duty create/edit form for 責任 and 権限. Each row carries inline edit /
// delete actions; add + edit happen through a shared `RoleAttributeDialog`,
// delete through a confirmation Sheet.
export const RoleAttributesEditor: FC<RoleAttributesEditorProps> = ({
  noun,
  items,
  onChange,
  disabled,
  labelPlaceholder,
  descriptionPlaceholder,
  testIdPrefix,
}) => {
  // `dialogMode` / `dialogIndex` persist while the Sheet animates closed so
  // the title and pre-filled values don't flicker mid-transition.
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"add" | "edit">("add");
  const [dialogIndex, setDialogIndex] = useState<number | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteIndex, setDeleteIndex] = useState<number | null>(null);

  const openAdd = () => {
    setDialogMode("add");
    setDialogIndex(null);
    setDialogOpen(true);
  };
  const openEdit = (index: number) => {
    setDialogMode("edit");
    setDialogIndex(index);
    setDialogOpen(true);
  };
  const openDelete = (index: number) => {
    setDeleteIndex(index);
    setDeleteOpen(true);
  };

  const handleSubmit = (value: RoleAttributeValue) => {
    if (dialogMode === "add") {
      onChange([...items, value]);
    } else if (dialogIndex !== null) {
      // Spread the existing item so non-edited fields (link / imageUrl / gate)
      // survive the edit.
      onChange(
        items.map((item, i) =>
          i === dialogIndex ? { ...item, ...value } : item,
        ),
      );
    }
  };

  const handleDelete = () => {
    if (deleteIndex !== null) {
      onChange(items.filter((_, i) => i !== deleteIndex));
    }
    setDeleteOpen(false);
  };

  const editingItem =
    dialogMode === "edit" && dialogIndex !== null
      ? items[dialogIndex]
      : undefined;
  const deletingItem = deleteIndex !== null ? items[deleteIndex] : undefined;

  return (
    <div className="px-5">
      <FieldLabel>{noun}</FieldLabel>

      {items.length > 0 && (
        <Card className="mb-2.5 gap-0 p-0">
          {items.map((item, index) => (
            <div key={`${item.label}-${index}`}>
              {index > 0 && <Divider />}
              <div className="flex items-start gap-1 py-2 pr-1.5 pl-4">
                <div className="min-w-0 flex-1 py-1.5">
                  <Typography as="div" variant="bodySm" weight="semibold">
                    {item.label}
                  </Typography>
                  {item.description && (
                    <Typography
                      as="div"
                      variant="caption"
                      tone="secondary"
                      className="mt-0.5 leading-snug"
                    >
                      {item.description}
                    </Typography>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => openEdit(index)}
                  disabled={disabled}
                  aria-label={`${item.label} を編集`}
                  className="flex size-8 shrink-0 items-center justify-center rounded-full text-text-secondary transition-colors hover:bg-bg hover:text-text-primary disabled:opacity-50"
                >
                  <Icon name="edit" size={15} />
                </button>
                <button
                  type="button"
                  onClick={() => openDelete(index)}
                  disabled={disabled}
                  aria-label={`${item.label} を削除`}
                  className="flex size-8 shrink-0 items-center justify-center rounded-full text-text-secondary transition-colors hover:bg-[#FBE5E2] hover:text-danger disabled:opacity-50"
                >
                  <Icon name="close" size={15} />
                </button>
              </div>
            </div>
          ))}
        </Card>
      )}

      <Button
        type="button"
        variant="secondary"
        size="sm"
        onClick={openAdd}
        disabled={disabled}
        data-testid={testIdPrefix ? `${testIdPrefix}-add` : undefined}
      >
        <Icon name="plus" size={14} />
        {noun}を追加
      </Button>

      <RoleAttributeDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        mode={dialogMode}
        noun={noun}
        value={editingItem}
        onSubmit={handleSubmit}
        labelPlaceholder={labelPlaceholder}
        descriptionPlaceholder={descriptionPlaceholder}
      />

      <Sheet open={deleteOpen} onOpenChange={setDeleteOpen}>
        <SheetContent
          side="bottom"
          className="md:left-1/2 md:right-auto md:w-full md:max-w-md md:-translate-x-1/2"
        >
          <SheetHeader>
            <SheetTitle>{noun}を削除しますか？</SheetTitle>
          </SheetHeader>
          <div className="px-5">
            <Typography
              variant="bodySm"
              tone="secondary"
              className="leading-relaxed"
            >
              「{deletingItem?.label}」を削除します。この操作は取り消せません。
            </Typography>
          </div>
          <SheetFooter className="flex-row gap-2.5">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setDeleteOpen(false)}
              className="shrink-0"
            >
              キャンセル
            </Button>
            <Button
              type="button"
              variant="dark"
              onClick={handleDelete}
              className="flex-1 bg-danger hover:brightness-110"
            >
              削除する
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
};
