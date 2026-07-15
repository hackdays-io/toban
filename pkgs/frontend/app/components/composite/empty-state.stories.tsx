import type { Story } from "@ladle/react";
import { Button } from "~/components/ui/button";
import { Icon } from "~/components/ui/icon";
import { EmptyState } from "./empty-state";

export default {
  title: "Composite / EmptyState",
};

export const Default: Story = () => (
  <EmptyState
    icon={<Icon name="duty" />}
    title="当番がまだありません"
    body="最初の当番を作ってメンバーに割り当てましょう。"
    action={
      <Button>
        <Icon name="plus" size={16} />
        当番を作成
      </Button>
    }
  />
);

export const WithoutAction: Story = () => (
  <EmptyState
    icon={<Icon name="bell" />}
    title="通知はありません"
    body="新着があるとここに表示されます。"
  />
);

export const TitleOnly: Story = () => <EmptyState title="該当なし" />;
