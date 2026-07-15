import type { Story } from "@ladle/react";
import { useState } from "react";
import { Divider } from "./divider";
import { ToggleRow } from "./toggle-row";

export default {
  title: "Composite / ToggleRow",
};

export const Default: Story = () => {
  const [notify, setNotify] = useState(true);
  const [supporters, setSupporters] = useState(false);
  const [archive, setArchive] = useState(false);
  return (
    <div className="w-[22rem] rounded-md border bg-surface">
      <ToggleRow
        label="通知を受け取る"
        sub="サンクスを受け取った時にプッシュ通知"
        checked={notify}
        onCheckedChange={setNotify}
      />
      <Divider inset={16} />
      <ToggleRow
        label="サポーターを募集"
        sub="他のメンバーが当番に参加できるようになります"
        checked={supporters}
        onCheckedChange={setSupporters}
      />
      <Divider inset={16} />
      <ToggleRow
        label="このワークスペースをアーカイブ"
        checked={archive}
        onCheckedChange={setArchive}
        disabled
      />
    </div>
  );
};
