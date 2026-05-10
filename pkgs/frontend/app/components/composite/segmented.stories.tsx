import type { Story } from "@ladle/react";
import { useState } from "react";
import { Segmented } from "./segmented";

export default {
  title: "Composite / Segmented",
};

export const TwoOptions: Story = () => {
  const [tab, setTab] = useState<"duties" | "quests">("duties");
  return (
    <div className="w-72">
      <Segmented
        value={tab}
        onChange={setTab}
        options={[
          { value: "duties", label: "当番" },
          { value: "quests", label: "クエスト" },
        ]}
      />
    </div>
  );
};

export const ThreeOptions: Story = () => {
  const [view, setView] = useState<"list" | "graph" | "friends">("list");
  return (
    <div className="w-96">
      <Segmented
        value={view}
        onChange={setView}
        options={[
          { value: "list", label: "リスト" },
          { value: "graph", label: "グラフ" },
          { value: "friends", label: "フレンド" },
        ]}
      />
    </div>
  );
};

export const FourOptions: Story = () => {
  const [status, setStatus] = useState<
    "open" | "in-progress" | "review" | "done"
  >("open");
  return (
    <div className="w-[28rem]">
      <Segmented
        value={status}
        onChange={setStatus}
        options={[
          { value: "open", label: "募集中" },
          { value: "in-progress", label: "進行中" },
          { value: "review", label: "確認待ち" },
          { value: "done", label: "完了" },
        ]}
      />
    </div>
  );
};
