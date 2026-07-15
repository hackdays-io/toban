import type { Story } from "@ladle/react";
import { Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea";
import { FieldLabel } from "./field-label";

export default {
  title: "Composite / FieldLabel",
};

export const Default: Story = () => (
  <div className="w-80 space-y-4">
    <div>
      <FieldLabel htmlFor="ws-name">ワークスペース名</FieldLabel>
      <Input id="ws-name" placeholder="例: シェアハウス・ひがし" />
    </div>
    <div>
      <FieldLabel htmlFor="ws-desc">説明</FieldLabel>
      <Textarea id="ws-desc" placeholder="このワークスペースの目的を一言で" />
    </div>
  </div>
);
