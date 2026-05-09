import type { Story } from "@ladle/react";
import { Checkbox } from "./checkbox";

export default {
  title: "UI / Checkbox",
};

export const Default: Story = () => (
  <div className="flex items-center gap-3">
    <Checkbox defaultChecked />
    <Checkbox />
    <Checkbox disabled />
    <Checkbox disabled defaultChecked />
  </div>
);

export const Labelled: Story = () => (
  <div className="flex items-center gap-2 text-sm font-medium">
    <Checkbox id="terms" defaultChecked />
    <label htmlFor="terms">利用規約に同意する</label>
  </div>
);
