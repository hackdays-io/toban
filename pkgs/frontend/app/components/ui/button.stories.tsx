import type { Story } from "@ladle/react";
import { Button } from "./button";

export default {
  title: "UI / Button",
};

export const Default: Story = () => <Button>Click me</Button>;

export const Sizes: Story = () => (
  <div className="flex items-center gap-3">
    <Button size="sm">Small</Button>
    <Button size="md">Medium</Button>
    <Button size="lg">Large</Button>
  </div>
);

export const Disabled: Story = () => <Button disabled>Disabled</Button>;

export const Loading: Story = () => (
  <Button loading loadingText="Loading…">
    Submit
  </Button>
);
