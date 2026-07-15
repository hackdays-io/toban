import type { Story } from "@ladle/react";
import { Divider } from "./divider";
import { NextStepCard } from "./next-step-card";

export default {
  title: "Composite / NextStepCard",
};

export const Default: Story = () => (
  <div className="w-[22rem] rounded-md border bg-surface">
    <NextStepCard icon="invite" label="メンバーを招待する" />
    <Divider inset={16} />
    <NextStepCard icon="duty" label="当番を作成する" />
    <Divider inset={16} />
    <NextStepCard icon="send" label="サンクスを送る" />
  </div>
);
