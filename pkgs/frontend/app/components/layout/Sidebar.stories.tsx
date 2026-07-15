import type { Story } from "@ladle/react";
import { useState } from "react";
import { Sidebar } from "./Sidebar";

export default {
  title: "Layout / Sidebar",
};

// The Sidebar's account header is driven by `AccountMenu`, which reads
// Privy + ENS at runtime — Ladle previews fall back to the Login-button
// state. Behavioural verification lives in the Cypress E2E suite.
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
      />
      <div className="flex flex-1 items-center justify-center text-sm text-text-secondary">
        現在: {active}
      </div>
    </div>
  );
};
