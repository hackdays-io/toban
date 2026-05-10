import type { Story } from "@ladle/react";
import { useState } from "react";
import { Button } from "~/components/ui/button";
import { WorkspaceSwitcherMenu } from "./WorkspaceSwitcherMenu";

export default {
  title: "Layout / WorkspaceSwitcherMenu",
};

export const Controlled: Story = () => {
  const [open, setOpen] = useState(false);
  return (
    <div className="flex h-[480px] w-full items-start justify-center bg-bg p-4">
      <Button onClick={() => setOpen(true)}>メニューを開く</Button>
      <WorkspaceSwitcherMenu
        open={open}
        onOpenChange={setOpen}
        workspaceName="ひがしのシェアハウス"
        onSwitchWorkspace={() => console.log("[story] navigate /workspace")}
        onOpenSettings={() => console.log("[story] navigate /:treeId/settings")}
      />
    </div>
  );
};
