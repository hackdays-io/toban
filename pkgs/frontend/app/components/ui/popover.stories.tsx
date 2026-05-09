import type { Story } from "@ladle/react";
import { Button } from "./button";
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "./popover";

export default {
  title: "UI / Popover",
};

export const Default: Story = () => (
  <div className="p-12">
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="secondary">フィルターを開く</Button>
      </PopoverTrigger>
      <PopoverContent>
        <PopoverHeader>
          <PopoverTitle>フィルター</PopoverTitle>
          <PopoverDescription>
            当番に表示するメンバーを絞り込めます。
          </PopoverDescription>
        </PopoverHeader>
        <div className="mt-2 text-sm text-text-secondary">
          ここに条件のチェックボックスが並びます。
        </div>
      </PopoverContent>
    </Popover>
  </div>
);
