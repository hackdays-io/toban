import type { Story } from "@ladle/react";
import { useState } from "react";
import { Button } from "~/components/ui/button";
import { StepBar } from "./step-bar";

export default {
  title: "Composite / StepBar",
};

export const Stages: Story = () => (
  <div className="w-80 space-y-3">
    <StepBar total={3} current={0} ariaLabel="ワークスペース作成 1/3" />
    <StepBar total={3} current={1} ariaLabel="ワークスペース作成 2/3" />
    <StepBar total={3} current={2} ariaLabel="ワークスペース作成 3/3" />
  </div>
);

export const Interactive: Story = () => {
  const [step, setStep] = useState(0);
  const total = 4;
  return (
    <div className="w-80 space-y-3">
      <StepBar total={total} current={step} />
      <div className="flex justify-between">
        <Button
          variant="secondary"
          size="sm"
          disabled={step === 0}
          onClick={() => setStep((s) => Math.max(0, s - 1))}
        >
          戻る
        </Button>
        <Button
          size="sm"
          disabled={step === total - 1}
          onClick={() => setStep((s) => Math.min(total - 1, s + 1))}
        >
          次へ
        </Button>
      </div>
    </div>
  );
};
