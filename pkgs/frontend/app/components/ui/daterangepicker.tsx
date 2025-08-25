import { format } from "date-fns";
import { useState } from "react";
import { DayPicker, type SelectRangeEventHandler } from "react-day-picker";
import "react-day-picker/dist/style.css";

interface DateRangePickerProps {
  onUpdate: (values: {
    range: { from: Date | undefined; to: Date | undefined };
  }) => void;
  initialDateFrom?: Date;
  initialDateTo?: Date;
}

/**
 * DateRangePicker Component
 * @param param0
 * @returns
 */
const DateRangePicker = ({
  onUpdate,
  initialDateFrom,
  initialDateTo,
}: DateRangePickerProps) => {
  const [range, setRange] = useState<{
    from: Date | undefined;
    to: Date | undefined;
  }>({
    from: initialDateFrom,
    to: initialDateTo,
  });

  const handleSelect: SelectRangeEventHandler = (newRange) => {
    setRange(newRange || { from: undefined, to: undefined });
    onUpdate({ range: newRange || { from: undefined, to: undefined } });
  };

  let footer = <p>Please pick the first day.</p>;
  if (range?.from) {
    if (!range.to) {
      footer = <p>{format(range.from, "PPP")} – Please pick the last day.</p>;
    } else if (range.to) {
      footer = (
        <p>
          {format(range.from, "PPP")} – {format(range.to, "PPP")}
        </p>
      );
    }
  }

  return (
    <DayPicker
      mode="range"
      selected={range}
      onSelect={handleSelect}
      footer={footer}
    />
  );
};

export default DateRangePicker;
