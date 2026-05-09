import type { Story } from "@ladle/react";
import { PageContainer } from "./PageContainer";

export default {
  title: "Layout / PageContainer",
};

export const Default: Story = () => (
  <PageContainer>
    <div className="rounded-md border bg-surface p-4 text-sm">
      モバイルでは <code>px-4</code>、デスクトップでは{" "}
      <code>max-w-screen-xl mx-auto px-6</code> を適用します。
    </div>
  </PageContainer>
);
