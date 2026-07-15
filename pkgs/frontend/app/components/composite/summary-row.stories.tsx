import type { Story } from "@ladle/react";
import { Avatar, AvatarFallback } from "~/components/ui/avatar";
import { Badge } from "~/components/ui/badge";
import { Divider } from "./divider";
import { SummaryRow } from "./summary-row";

export default {
  title: "Composite / SummaryRow",
};

export const Default: Story = () => (
  <div className="w-[22rem] rounded-md border bg-surface">
    <SummaryRow label="開始日" value="2026-05-12" />
    <Divider />
    <SummaryRow
      label="担当者"
      value={
        <span className="flex items-center gap-2">
          <Avatar size="sm">
            <AvatarFallback seed="ひらやま" />
          </Avatar>
          ひらやま
        </span>
      }
    />
    <Divider />
    <SummaryRow label="役割" value={<Badge kind="role">サポーター</Badge>} />
  </div>
);
