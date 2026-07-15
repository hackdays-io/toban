import type { Story } from "@ladle/react";
import { useState } from "react";
import { IconColorPicker } from "./icon-color-picker";

export default {
  title: "Composite / IconColorPicker",
};

const ICONS = ["🌿", "🇯🇵", "✦", "🏠", "🌊", "🔥", "🌸", "⚡", "🛠"] as const;
const COLORS = [
  "#65C98A",
  "#5DADEC",
  "#F5B82E",
  "#D6B995",
  "#E48F4F",
  "#B696E0",
  "#E48ABF",
  "#7AC2D9",
] as const;

export const Default: Story = () => {
  const [icon, setIcon] = useState<string>(ICONS[0]);
  const [color, setColor] = useState<string>(COLORS[0]);
  return (
    <div className="w-[22rem]">
      <IconColorPicker
        icon={icon}
        color={color}
        iconChoices={ICONS}
        colorChoices={COLORS}
        onIconChange={setIcon}
        onColorChange={setColor}
        helper="プレビューはここに表示されます。アイコンとカラーは下から選択できます。"
      />
    </div>
  );
};
