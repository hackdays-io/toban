import type { Story } from "@ladle/react";
import { Button } from "./button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./dialog";

export default {
  title: "UI / Dialog",
};

export const Default: Story = () => (
  <Dialog>
    <DialogTrigger asChild>
      <Button variant="danger">ワークスペースを削除</Button>
    </DialogTrigger>
    <DialogContent>
      <DialogHeader>
        <DialogTitle>本当に削除しますか？</DialogTitle>
        <DialogDescription>
          この操作は取り消せません。すべてのメンバー・当番・分配履歴が消えます。
        </DialogDescription>
      </DialogHeader>
      <DialogFooter showCloseButton>
        <Button variant="danger">削除する</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
);
