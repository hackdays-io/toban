import type { Story } from "@ladle/react";
import { StatCard } from "./stat-card";

export default {
  title: "Composite / StatCard",
};

export const Compact: Story = () => (
  <div className="flex w-[22rem] gap-3">
    <StatCard label="送付件数" value="142" unit="件" className="flex-1" />
    <StatCard
      label="合計 THX"
      value="1,210"
      unit="THX"
      accent="var(--color-primary)"
      className="flex-1"
    />
    <StatCard label="参加者" value="9" unit="人" className="flex-1" />
  </div>
);

export const Wide: Story = () => (
  <div className="w-96 space-y-3">
    <StatCard
      size="wide"
      label="今週の送付量"
      value="320"
      unit="THX"
      delta="+18%"
    />
    <StatCard
      size="wide"
      label="アクティブメンバー"
      value="7"
      unit="名"
      delta="+1"
      accent="var(--color-contrib)"
    />
  </div>
);
