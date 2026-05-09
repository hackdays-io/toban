import type { Story } from "@ladle/react";
import { Button } from "./button";

export default {
  title: "UI / Button",
};

export const Default: Story = () => <Button>Click me</Button>;

export const Variants: Story = () => (
  <div className="flex flex-wrap items-center gap-3">
    <Button>Default</Button>
    <Button variant="secondary">Secondary</Button>
    <Button variant="outline">Outline</Button>
    <Button variant="ghost">Ghost</Button>
    <Button variant="destructive">Destructive</Button>
    <Button variant="link">Link</Button>
  </div>
);

export const Sizes: Story = () => (
  <div className="flex items-center gap-3">
    <Button size="xs">XS</Button>
    <Button size="sm">SM</Button>
    <Button size="default">Default</Button>
    <Button size="lg">LG</Button>
  </div>
);

export const Disabled: Story = () => <Button disabled>Disabled</Button>;
