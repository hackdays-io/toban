import type { Story } from "@ladle/react";
import { toast } from "sonner";
import { Button } from "./button";
import { Toaster } from "./sonner";

export default {
  title: "UI / Toast",
};

export const Triggers: Story = () => (
  <div className="space-y-3">
    <p className="text-sm text-text-secondary">
      ボタンを押すと右下にトーストが表示されます。
    </p>
    <div className="flex flex-wrap gap-2">
      <Button onClick={() => toast("サンクスを送りました")}>Default</Button>
      <Button
        variant="secondary"
        onClick={() => toast.success("当番を作成しました")}
      >
        Success
      </Button>
      <Button
        variant="secondary"
        onClick={() => toast.info("新しいクエストが追加されました")}
      >
        Info
      </Button>
      <Button
        variant="secondary"
        onClick={() => toast.warning("シェアが上限に達しています")}
      >
        Warning
      </Button>
      <Button
        variant="danger"
        onClick={() => toast.error("送信に失敗しました")}
      >
        Error
      </Button>
    </div>
    <Toaster position="top-center" />
  </div>
);
