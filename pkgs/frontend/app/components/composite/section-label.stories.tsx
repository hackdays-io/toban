import type { Story } from "@ladle/react";
import { Card, CardContent } from "~/components/ui/card";
import { SectionLabel } from "./section-label";

export default {
  title: "Composite / SectionLabel",
};

export const Default: Story = () => (
  <div className="w-[22rem] space-y-1">
    <SectionLabel>あなたの当番</SectionLabel>
    <Card>
      <CardContent>今週: ゴミ出し / 共有部清掃</CardContent>
    </Card>
    <SectionLabel>最近のアクティビティ</SectionLabel>
    <Card>
      <CardContent>homma さんから 10 THX</CardContent>
    </Card>
  </div>
);
