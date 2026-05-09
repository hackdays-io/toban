import type { Story } from "@ladle/react";
import { Badge } from "./badge";
import { Icon } from "./icon";

export default {
  title: "UI / Badge",
};

export const Kinds: Story = () => (
  <div className="flex flex-wrap items-center gap-3">
    <Badge kind="member">メンバー</Badge>
    <Badge kind="lead">当番リード</Badge>
    <Badge kind="supporter">サポーター</Badge>
    <Badge kind="role">ロール</Badge>
    <Badge kind="info">お知らせ</Badge>
    <Badge kind="danger">期限切れ</Badge>
  </div>
);

export const WithIcon: Story = () => (
  <div className="flex flex-wrap items-center gap-3">
    <Badge kind="member">
      <Icon name="check" />
      参加済み
    </Badge>
    <Badge kind="info">
      <Icon name="bell" />
      通知あり
    </Badge>
    <Badge kind="danger">
      <Icon name="shield" />
      要確認
    </Badge>
  </div>
);
