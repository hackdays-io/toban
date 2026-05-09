import type { Story } from "@ladle/react";
import { WeightBar } from "./weight-bar";

export default {
  title: "Composite / WeightBar",
};

export const Default: Story = () => (
  <div className="w-80 space-y-4">
    <WeightBar label="ひらやま" pct={42} color="var(--color-primary)" />
    <WeightBar label="homma" pct={28} color="var(--color-contrib)" />
    <WeightBar label="genks" pct={18} color="var(--color-split)" />
    <WeightBar label="前田陽太" pct={12} color="var(--color-role)" />
  </div>
);

export const Edges: Story = () => (
  <div className="w-80 space-y-4">
    <WeightBar label="0%" pct={0} />
    <WeightBar label="100%" pct={100} />
    <WeightBar label="範囲外（120 → 100）" pct={120} />
  </div>
);
