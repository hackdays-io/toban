import type { Story } from "@ladle/react";
import { RadioGroup, RadioGroupItem } from "./radio-group";

export default {
  title: "UI / RadioGroup",
};

const options = [
  { value: "weekly", label: "毎週" },
  { value: "biweekly", label: "隔週" },
  { value: "monthly", label: "毎月" },
] as const;

export const Default: Story = () => (
  <RadioGroup defaultValue="weekly" className="text-sm">
    {options.map((opt) => (
      <div key={opt.value} className="flex items-center gap-2">
        <RadioGroupItem id={`freq-${opt.value}`} value={opt.value} />
        <label htmlFor={`freq-${opt.value}`}>{opt.label}</label>
      </div>
    ))}
  </RadioGroup>
);

export const Disabled: Story = () => (
  <RadioGroup defaultValue="b" className="text-sm">
    <div className="flex items-center gap-2">
      <RadioGroupItem id="disabled-a" value="a" disabled />
      <label htmlFor="disabled-a">無効化</label>
    </div>
    <div className="flex items-center gap-2">
      <RadioGroupItem id="disabled-b" value="b" disabled />
      <label htmlFor="disabled-b">無効化（選択中）</label>
    </div>
  </RadioGroup>
);
