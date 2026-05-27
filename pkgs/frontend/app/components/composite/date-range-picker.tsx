import { type FC, useState } from "react";
import type { DateRange } from "react-day-picker";

import { Button, buttonVariants } from "~/components/ui/button";
import { Calendar } from "~/components/ui/calendar";
import { Icon } from "~/components/ui/icon";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";
import { cn } from "~/lib/utils";

interface DateRangePickerProps {
  value?: DateRange;
  onChange: (range: DateRange | undefined) => void;
  /** Placeholder shown when nothing is selected. */
  placeholder?: string;
  className?: string;
}

const formatJP = (d: Date) =>
  `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")}`;

const labelForRange = (range: DateRange | undefined, placeholder: string) => {
  if (!range?.from) return placeholder;
  if (!range.to || range.from.getTime() === range.to.getTime()) {
    return formatJP(range.from);
  }
  return `${formatJP(range.from)} – ${formatJP(range.to)}`;
};

// Toban DateRangePicker — a single trigger button that opens a Popover
// with a range-mode Calendar. Includes a footer with "クリア" so callers
// can revert to "no range" (treated as "全期間" by consumers).
export const DateRangePicker: FC<DateRangePickerProps> = ({
  value,
  onChange,
  placeholder = "期間を選択",
  className,
}) => {
  const [open, setOpen] = useState(false);
  const hasSelection = !!value?.from;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        type="button"
        className={cn(
          // Render PopoverTrigger as its own <button> so Radix can attach
          // the ref/handlers directly. Wrapping our `Button` component via
          // `asChild` drops the ref (it isn't forwardRef-ified) and the
          // popover never opens.
          buttonVariants({ variant: "secondary", size: "sm" }),
          "justify-start gap-2 text-[13px]",
          !hasSelection && "text-text-secondary",
          className,
        )}
      >
        <Icon name="search" size={14} />
        {labelForRange(value, placeholder)}
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-auto p-0"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <Calendar
          mode="range"
          numberOfMonths={1}
          selected={value}
          onSelect={onChange}
          defaultMonth={value?.from}
        />
        <div className="flex items-center justify-between border-t px-3 py-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onChange(undefined)}
            disabled={!hasSelection}
          >
            クリア
          </Button>
          <Button type="button" size="sm" onClick={() => setOpen(false)}>
            完了
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};
