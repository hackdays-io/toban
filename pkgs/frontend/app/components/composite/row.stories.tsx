import type { Story } from "@ladle/react";
import { Avatar, AvatarFallback } from "~/components/ui/avatar";
import { Badge } from "~/components/ui/badge";
import { Icon } from "~/components/ui/icon";
import { Divider } from "./divider";
import { Row } from "./row";

export default {
  title: "Composite / Row",
};

export const Basic: Story = () => (
  <div className="w-96 rounded-md border bg-surface">
    <Row title="ゴミ出し" subtitle="月・木・日" />
    <Divider inset={16} />
    <Row title="掃除当番" subtitle="毎週日曜" />
  </div>
);

export const WithSlots: Story = () => (
  <div className="w-96 rounded-md border bg-surface">
    <Row
      left={
        <Avatar size="sm">
          <AvatarFallback seed="ひらやま" />
        </Avatar>
      }
      title="ひらやま"
      subtitle="今週の当番リード"
      right={<Badge kind="lead">リード</Badge>}
    />
    <Divider inset={16} />
    <Row
      left={
        <Avatar size="sm">
          <AvatarFallback seed="homma" />
        </Avatar>
      }
      title="homma"
      subtitle="サポーター"
      right={<Icon name="chevron-right" className="text-text-secondary" />}
      onClick={() => {}}
    />
  </div>
);
