import type { Story } from "@ladle/react";
import { Button } from "./button";
import { Icon } from "./icon";

export default {
  title: "UI / Button",
};

export const Default: Story = () => <Button>はじめる</Button>;

export const Variants: Story = () => (
  <div className="flex flex-wrap items-center gap-3">
    <Button variant="primary">Primary</Button>
    <Button variant="soft">Soft</Button>
    <Button variant="secondary">Secondary</Button>
    <Button variant="ghost">Ghost</Button>
    <Button variant="danger">Danger</Button>
    <Button variant="dark">Dark</Button>
  </div>
);

export const Sizes: Story = () => (
  <div className="flex flex-col items-start gap-3">
    <div className="flex items-center gap-3">
      <Button size="sm">Small</Button>
      <Button size="md">Medium</Button>
      <Button size="lg">Large</Button>
    </div>
    <div className="flex items-center gap-3">
      <Button size="icon-sm" aria-label="Add">
        <Icon name="plus" size={16} />
      </Button>
      <Button size="icon" aria-label="Add">
        <Icon name="plus" />
      </Button>
      <Button size="icon-lg" aria-label="Add">
        <Icon name="plus" size={26} />
      </Button>
    </div>
  </div>
);

export const WithIcon: Story = () => (
  <div className="flex flex-wrap items-center gap-3">
    <Button>
      <Icon name="send" size={16} />
      サンクスを送る
    </Button>
    <Button variant="secondary">
      <Icon name="plus" size={16} />
      当番を追加
    </Button>
    <Button variant="dark">
      <Icon name="qr" size={16} />
      招待
    </Button>
  </div>
);

export const FullWidth: Story = () => (
  <div className="w-80 space-y-3">
    <Button full>確定する</Button>
    <Button variant="secondary" full>
      キャンセル
    </Button>
  </div>
);

export const Disabled: Story = () => (
  <div className="flex flex-wrap items-center gap-3">
    <Button disabled>Primary</Button>
    <Button variant="secondary" disabled>
      Secondary
    </Button>
    <Button variant="dark" disabled>
      Dark
    </Button>
  </div>
);
