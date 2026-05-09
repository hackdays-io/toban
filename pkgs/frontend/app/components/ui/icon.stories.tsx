import type { Story } from "@ladle/react";
import { Icon, type IconName, iconRegistry } from "./icon";

export default {
  title: "UI / Icon",
};

const names = Object.keys(iconRegistry) as IconName[];

export const Catalog: Story = () => (
  <div className="grid grid-cols-4 gap-4 text-text-secondary sm:grid-cols-6">
    {names.map((name) => (
      <div
        key={name}
        className="flex flex-col items-center gap-2 rounded-md border bg-surface p-3"
      >
        <Icon name={name} className="text-text-primary" />
        <span className="text-[11px] text-text-secondary">{name}</span>
      </div>
    ))}
  </div>
);

export const Sizes: Story = () => (
  <div className="flex items-center gap-4 text-text-primary">
    <Icon name="bell" size={14} />
    <Icon name="bell" size={18} />
    <Icon name="bell" size={22} />
    <Icon name="bell" size={28} />
    <Icon name="bell" size={36} />
  </div>
);

export const InContext: Story = () => (
  <div className="space-y-3 text-text-primary">
    <div className="flex items-center gap-2">
      <Icon name="search" className="text-text-secondary" />
      <span>メンバーを検索</span>
    </div>
    <div className="flex items-center gap-2">
      <Icon name="check" className="text-[color:var(--color-contrib)]" />
      <span>完了</span>
    </div>
    <div className="flex items-center gap-2">
      <Icon name="shield" className="text-danger" />
      <span>要確認</span>
    </div>
  </div>
);
