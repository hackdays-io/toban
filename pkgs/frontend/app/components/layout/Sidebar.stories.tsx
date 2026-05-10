import type { Story } from "@ladle/react";
import { useState } from "react";
import { Sidebar } from "./Sidebar";

export default {
  title: "Layout / Sidebar",
};

export const Default: Story = () => {
  const [active, setActive] = useState("home");
  return (
    <div className="flex h-[640px] overflow-hidden rounded-md border bg-surface">
      {/* Sidebar hides under md breakpoint; force visible inside the story
         frame by removing the responsive guard via wrapper width (Ladle is
         on a desktop viewport by default). */}
      <Sidebar
        workspaceName="ひがしのシェアハウス"
        active={active}
        onNavigate={setActive}
        user={{
          name: "ryoma",
          subtitle: "0xab12...c45f",
        }}
      />
      <div className="flex flex-1 items-center justify-center text-sm text-text-secondary">
        現在: {active}
      </div>
    </div>
  );
};

export const WithoutUser: Story = () => (
  <div className="flex h-[480px] overflow-hidden rounded-md border bg-surface">
    <Sidebar
      workspaceName="新規ワークスペース"
      active="home"
      onNavigate={() => {}}
    />
    <div className="flex flex-1 items-center justify-center text-sm text-text-secondary">
      ユーザー情報なし
    </div>
  </div>
);
