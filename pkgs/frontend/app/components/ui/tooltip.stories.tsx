import type { Story } from "@ladle/react";
import { Button } from "./button";
import { Icon } from "./icon";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./tooltip";

export default {
  title: "UI / Tooltip",
};

export const Default: Story = () => (
  <TooltipProvider>
    <div className="flex items-center gap-3 p-12">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button size="icon" variant="secondary" aria-label="検索">
            <Icon name="search" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>メンバーを検索</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button size="icon" variant="secondary" aria-label="通知">
            <Icon name="bell" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom">通知センター</TooltipContent>
      </Tooltip>
    </div>
  </TooltipProvider>
);
