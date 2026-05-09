import type { Story } from "@ladle/react";
import { Icon } from "./icon";
import { Input } from "./input";

export default {
  title: "UI / Input",
};

export const Default: Story = () => (
  <div className="w-80 space-y-3">
    <Input placeholder="ワークスペース名" />
  </div>
);

export const WithIcon: Story = () => (
  <div className="w-80 space-y-3">
    <Input icon={<Icon name="search" />} placeholder="メンバーを検索" />
    <Input icon={<Icon name="user" />} placeholder="ユーザー名" />
  </div>
);

export const States: Story = () => (
  <div className="w-80 space-y-3">
    <Input placeholder="フォーカス時に確認" />
    <Input
      placeholder="エラー状態"
      aria-invalid="true"
      defaultValue="invalid"
    />
    <Input placeholder="無効化" disabled defaultValue="disabled" />
  </div>
);
