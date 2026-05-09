import type { Story } from "@ladle/react";
import { Button } from "~/components/ui/button";
import { Icon } from "~/components/ui/icon";
import { ScreenHeader } from "./ScreenHeader";

export default {
  title: "Layout / ScreenHeader",
};

export const Default: Story = () => (
  <div className="w-[420px] border-b bg-bg">
    <ScreenHeader title="当番の詳細" onBack={() => {}} />
  </div>
);

export const WithSubtitle: Story = () => (
  <div className="w-[420px] border-b bg-bg">
    <ScreenHeader
      title="ゴミ出し"
      subtitle="毎週月曜・木曜・日曜"
      onBack={() => {}}
    />
  </div>
);

export const WithRightSlot: Story = () => (
  <div className="w-[420px] border-b bg-bg">
    <ScreenHeader
      title="ワークスペース設定"
      onBack={() => {}}
      right={
        <Button size="icon-sm" variant="ghost" aria-label="編集">
          <Icon name="edit" size={18} />
        </Button>
      }
    />
  </div>
);

export const NoBack: Story = () => (
  <div className="w-[420px] border-b bg-bg">
    <ScreenHeader title="お知らせ" />
  </div>
);
