import type { Story } from "@ladle/react";
import { useState } from "react";
import { BottomNav } from "./BottomNav";

export default {
  title: "Layout / BottomNav",
};

export const Interactive: Story = () => {
  const [active, setActive] = useState("home");
  return (
    <div className="w-[420px] border-x">
      <div className="bg-bg p-6 text-center text-sm text-text-secondary">
        現在: <strong>{active}</strong>
      </div>
      <BottomNav active={active} onChange={setActive} />
    </div>
  );
};

export const EachActiveState: Story = () => (
  <div className="space-y-3">
    {["home", "duties", "splits", "members", "wallet"].map((key) => (
      <div key={key} className="w-[420px] border-x">
        <BottomNav active={key} onChange={() => {}} />
      </div>
    ))}
  </div>
);
