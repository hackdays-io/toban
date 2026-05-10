import type { Story } from "@ladle/react";
import { Switch } from "./switch";

export default {
  title: "UI / Switch",
};

export const Default: Story = () => (
  <div className="flex items-center gap-3">
    <Switch defaultChecked />
    <Switch />
    <Switch disabled />
    <Switch disabled defaultChecked />
  </div>
);

export const Sizes: Story = () => (
  <div className="flex items-center gap-3">
    <Switch size="sm" defaultChecked />
    <Switch size="default" defaultChecked />
  </div>
);

export const Labelled: Story = () => (
  <div className="flex items-center gap-3 text-sm font-medium">
    <Switch id="notify" defaultChecked />
    <label htmlFor="notify">サンクスを送信したら通知する</label>
  </div>
);
