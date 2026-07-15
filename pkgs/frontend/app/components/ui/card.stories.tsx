import type { Story } from "@ladle/react";
import { Avatar, AvatarFallback } from "./avatar";
import { Badge } from "./badge";
import { Button } from "./button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./card";
import { Icon } from "./icon";

export default {
  title: "UI / Card",
};

export const Default: Story = () => (
  <Card className="w-80">
    <CardHeader>
      <CardTitle>今週の当番</CardTitle>
      <CardDescription>残り 3 日</CardDescription>
    </CardHeader>
    <CardContent>
      <p className="text-sm text-text-secondary">
        ゴミ出し / 共有エリアの清掃 / 来客対応 を担当します。
      </p>
    </CardContent>
    <CardFooter>
      <Button variant="soft" full>
        詳細を見る
      </Button>
    </CardFooter>
  </Card>
);

export const WithAction: Story = () => (
  <Card className="w-80">
    <CardHeader>
      <CardTitle>分配ルール</CardTitle>
      <CardDescription>毎月 1 日 自動実行</CardDescription>
      <CardAction>
        <Button variant="ghost" size="icon-sm" aria-label="編集">
          <Icon name="edit" size={16} />
        </Button>
      </CardAction>
    </CardHeader>
    <CardContent className="flex items-center gap-3">
      <Avatar>
        <AvatarFallback seed="ひらやま" />
      </Avatar>
      <div className="text-sm">
        <div className="font-semibold">ひらやま</div>
        <div className="text-text-secondary">42% / 全体</div>
      </div>
      <Badge kind="lead" className="ml-auto">
        当番リード
      </Badge>
    </CardContent>
  </Card>
);

export const Compact: Story = () => (
  <Card className="w-72 gap-3 py-4">
    <CardContent className="flex items-center gap-3 px-4">
      <Icon name="sparkle" className="text-primary" />
      <div className="flex-1 text-sm">
        <div className="font-semibold">サンクスが届きました</div>
        <div className="text-text-secondary">homma さんから 10 THX</div>
      </div>
    </CardContent>
  </Card>
);
