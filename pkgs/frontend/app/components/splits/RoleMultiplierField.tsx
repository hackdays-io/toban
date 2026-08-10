import type { FC } from "react";
import {
  DEFAULT_MULTIPLIER,
  MULTIPLIER_HINT,
  isValidMultiplier,
} from "utils/multiplier";
import { FieldLabel } from "~/components/composite/field-label";
import { Input } from "~/components/ui/input";
import { Typography } from "~/components/ui/typography";
import { cn } from "~/lib/utils";

interface RoleMultiplierFieldProps {
  /** Unique per row — also seeds the error message's `aria-describedby`. */
  id: string;
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

/**
 * Per-role 分配係数 input, shared by the splits and scheduled authoring
 * flows so both screens validate and label the field the same way.
 *
 * `type="text"` + `inputMode="decimal"` rather than `type="number"`: a number
 * input accepts "e"/"-" and hands back an empty string for values the browser
 * considers invalid, which would hide bad input from our own validation.
 */
export const RoleMultiplierField: FC<RoleMultiplierFieldProps> = ({
  id,
  value,
  onChange,
  className,
}) => {
  const invalid = !isValidMultiplier(value);
  return (
    <div
      className={cn("flex flex-wrap items-center gap-x-2 gap-y-1", className)}
    >
      <FieldLabel htmlFor={id} className="mb-0">
        分配係数
      </FieldLabel>
      <Input
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        inputMode="decimal"
        placeholder={DEFAULT_MULTIPLIER}
        aria-invalid={invalid}
        aria-describedby={invalid ? `${id}-hint` : undefined}
        className="h-9 w-[72px] px-2.5"
      />
      <Typography as="span" variant="micro" tone="secondary">
        倍
      </Typography>
      {invalid && (
        <Typography
          id={`${id}-hint`}
          as="div"
          variant="micro"
          tone="danger"
          className="w-full"
        >
          {MULTIPLIER_HINT}
        </Typography>
      )}
    </div>
  );
};
