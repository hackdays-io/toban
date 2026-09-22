import type { Story } from "@ladle/react";
import { TransactionProgressPanel } from "./transaction-progress-panel";

export default {
  title: "Composite / TransactionProgressPanel",
};

export const Default: Story = () => (
  <TransactionProgressPanel
    title="サンクスを送信しています…"
    description="ブロックチェーンへの書き込みを待っています"
  />
);

export const InSheet: Story = () => (
  <div className="flex h-[420px] w-[380px] flex-col rounded-lg border">
    <TransactionProgressPanel
      fill="panel"
      title="ロールシェアを送信しています…"
      description="ブロックチェーンへの書き込みを待っています"
    />
  </div>
);

export const CustomIcon: Story = () => (
  <TransactionProgressPanel
    icon="duty"
    title="当番を作成しています…"
    description="ブロックチェーンへの書き込みを待っています"
  />
);

export const TitleOnly: Story = () => (
  <TransactionProgressPanel title="送信しています…" />
);
