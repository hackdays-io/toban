import type { Story } from "@ladle/react";
import { AppHeader } from "./AppHeader";

export default {
  title: "Layout / AppHeader",
};

export const Default: Story = () => (
  <div className="w-[420px] border-b bg-bg">
    <AppHeader workspaceName="ひがしのシェアハウス" />
  </div>
);

export const LongName: Story = () => (
  <div className="w-[420px] border-b bg-bg">
    <AppHeader workspaceName="ふじのもり・季節のあつまり 2026 春の章" />
  </div>
);
