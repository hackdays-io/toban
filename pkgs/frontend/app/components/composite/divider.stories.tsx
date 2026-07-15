import type { Story } from "@ladle/react";
import { Typography } from "../ui/typography";
import { Divider } from "./divider";

export default {
  title: "Composite / Divider",
};

export const Default: Story = () => (
  <div className="w-80 rounded-md border bg-surface px-4 py-2">
    <Typography variant="bodySm" className="py-2">
      上のセクション
    </Typography>
    <Divider />
    <Typography variant="bodySm" className="py-2">
      下のセクション
    </Typography>
  </div>
);

export const Inset: Story = () => (
  <div className="w-80 rounded-md border bg-surface">
    <Typography variant="bodySm" className="px-4 py-3">
      アバターの右で揃える行
    </Typography>
    <Divider inset={16} />
    <Typography variant="bodySm" className="px-4 py-3">
      次の行
    </Typography>
  </div>
);
