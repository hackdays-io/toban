import type { Story } from "@ladle/react";
import { Icon } from "./icon";
import { Textarea } from "./textarea";

export default {
  title: "UI / Textarea",
};

export const Default: Story = () => (
  <div className="w-80 space-y-3">
    <Textarea placeholder="メッセージを入力" />
  </div>
);

export const WithIcon: Story = () => (
  <div className="w-80 space-y-3">
    <Textarea
      icon={<Icon name="edit" />}
      placeholder="ありがとうのメッセージを書く"
    />
  </div>
);

export const States: Story = () => (
  <div className="w-80 space-y-3">
    <Textarea
      placeholder="エラー状態"
      aria-invalid="true"
      defaultValue="invalid"
    />
    <Textarea placeholder="無効化" disabled defaultValue="disabled" />
  </div>
);
