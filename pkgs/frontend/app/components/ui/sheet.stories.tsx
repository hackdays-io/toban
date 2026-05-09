import type { Story } from "@ladle/react";
import { Button } from "./button";
import { Icon } from "./icon";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "./sheet";

export default {
  title: "UI / Sheet",
};

export const Bottom: Story = () => (
  <Sheet>
    <SheetTrigger asChild>
      <Button>
        <Icon name="plus" size={16} />
        Bottom Sheet を開く
      </Button>
    </SheetTrigger>
    <SheetContent side="bottom">
      <SheetHeader>
        <SheetTitle>当番に参加する</SheetTitle>
        <SheetDescription>
          シェアを設定してから「申請する」を押してください。
        </SheetDescription>
      </SheetHeader>
      <div className="px-5 py-2 text-sm text-text-secondary">
        ここにフォームやリストが入ります。
      </div>
      <SheetFooter>
        <Button full>申請する</Button>
      </SheetFooter>
    </SheetContent>
  </Sheet>
);

export const RightSide: Story = () => (
  <Sheet>
    <SheetTrigger asChild>
      <Button variant="secondary">右からサイドシートを開く</Button>
    </SheetTrigger>
    <SheetContent side="right">
      <SheetHeader>
        <SheetTitle>ワークスペース設定</SheetTitle>
        <SheetDescription>
          デスクトップではサイドシートとして表示します。
        </SheetDescription>
      </SheetHeader>
      <div className="px-5 py-2 text-sm text-text-secondary">
        設定セクション
      </div>
    </SheetContent>
  </Sheet>
);
