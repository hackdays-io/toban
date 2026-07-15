import type { ComponentProps } from "react";
import { DayPicker } from "react-day-picker";
import { ja } from "react-day-picker/locale";
import {
  LuChevronLeft,
  LuChevronRight,
  LuChevronsLeft,
  LuChevronsRight,
} from "react-icons/lu";

import { cn } from "~/lib/utils";

type CalendarProps = ComponentProps<typeof DayPicker>;

// Toban Calendar — thin shadcn-style wrapper around `react-day-picker`.
// Centralises the locale (ja), the chevron icons (react-icons/lu so we
// don't pull in lucide-react), and the Tailwind class overrides that
// make the picker fit the Toban surface tokens. All `DayPicker` props
// pass through, so callers control `mode`, `selected`, `onSelect`, etc.
function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  locale = ja,
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      locale={locale}
      className={cn("p-3", className)}
      classNames={{
        months: "flex flex-col sm:flex-row gap-4",
        month: "flex flex-col gap-3",
        month_caption: "flex items-center justify-center h-9 relative",
        caption_label: "text-sm font-semibold text-text-primary",
        nav: "flex items-center justify-between absolute inset-x-1 top-1 z-10",
        button_previous:
          "inline-flex size-7 items-center justify-center rounded-md text-text-secondary hover:bg-bg hover:text-text-primary disabled:opacity-40",
        button_next:
          "inline-flex size-7 items-center justify-center rounded-md text-text-secondary hover:bg-bg hover:text-text-primary disabled:opacity-40",
        month_grid: "w-full border-collapse",
        weekdays: "flex",
        weekday:
          "w-9 text-[11px] font-semibold text-text-secondary uppercase tracking-wide text-center",
        week: "flex w-full mt-1",
        day: "size-9 p-0 text-center text-sm",
        day_button:
          "inline-flex size-9 items-center justify-center rounded-md font-medium text-text-primary hover:bg-bg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-30 disabled:hover:bg-transparent",
        selected:
          "[&_button]:bg-primary [&_button]:text-text-primary [&_button]:font-bold [&_button]:hover:bg-primary",
        today:
          "[&_button]:underline [&_button]:underline-offset-4 [&_button]:decoration-2",
        outside: "[&_button]:text-text-secondary [&_button]:opacity-40",
        disabled: "[&_button]:opacity-30 [&_button]:hover:bg-transparent",
        hidden: "invisible",
        range_start:
          "[&_button]:rounded-r-none [&_button]:bg-primary [&_button]:text-text-primary",
        range_middle:
          "[&_button]:rounded-none [&_button]:bg-primary-soft [&_button]:text-text-primary [&_button]:font-normal",
        range_end:
          "[&_button]:rounded-l-none [&_button]:bg-primary [&_button]:text-text-primary",
        ...classNames,
      }}
      components={{
        Chevron: (chevronProps) => {
          const orientation = chevronProps.orientation;
          const Icon =
            orientation === "left"
              ? LuChevronLeft
              : orientation === "right"
                ? LuChevronRight
                : orientation === "up"
                  ? LuChevronsLeft
                  : LuChevronsRight;
          return <Icon size={16} aria-hidden="true" />;
        },
      }}
      {...props}
    />
  );
}

export { Calendar };
export type { CalendarProps };
