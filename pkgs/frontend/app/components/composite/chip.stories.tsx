import type { Story } from "@ladle/react";
import { useState } from "react";
import { Icon } from "~/components/ui/icon";
import { Chip } from "./chip";

export default {
  title: "Composite / Chip",
};

export const States: Story = () => (
  <div className="flex flex-wrap items-center gap-2">
    <Chip>未選択</Chip>
    <Chip active>選択中</Chip>
    <Chip>
      <Icon name="check" />
      条件あり
    </Chip>
    <Chip active>
      <Icon name="sparkle" />
      ハイライト
    </Chip>
    <Chip disabled>無効</Chip>
  </div>
);

export const Toggleable: Story = () => {
  const [active, setActive] = useState<string>("week");
  const items = [
    { v: "week", l: "今週" },
    { v: "month", l: "30日" },
    { v: "all", l: "全期間" },
  ];
  return (
    <div className="flex flex-wrap items-center gap-2">
      {items.map((it) => (
        <Chip
          key={it.v}
          active={active === it.v}
          onClick={() => setActive(it.v)}
        >
          {it.l}
        </Chip>
      ))}
    </div>
  );
};
