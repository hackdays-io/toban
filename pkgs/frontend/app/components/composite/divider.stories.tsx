import type { Story } from "@ladle/react";
import { Divider } from "./divider";

export default {
  title: "Composite / Divider",
};

export const Default: Story = () => (
  <div className="w-80 rounded-md border bg-surface px-4 py-2">
    <p className="py-2 text-sm">上のセクション</p>
    <Divider />
    <p className="py-2 text-sm">下のセクション</p>
  </div>
);

export const Inset: Story = () => (
  <div className="w-80 rounded-md border bg-surface">
    <p className="px-4 py-3 text-sm">アバターの右で揃える行</p>
    <Divider inset={16} />
    <p className="px-4 py-3 text-sm">次の行</p>
  </div>
);
