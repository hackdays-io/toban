import type { Story } from "@ladle/react";
import { Button } from "~/components/ui/button";
import { Heading } from "~/components/ui/heading";
import { Typography } from "~/components/ui/typography";
import { CenteredPanel } from "./centered-panel";

export default {
  title: "Composite / CenteredPanel",
};

export const Screen: Story = () => (
  <CenteredPanel className="border">
    <Heading variant="h3" level={2}>
      送信が完了しました
    </Heading>
    <Typography variant="bodySm" tone="secondary" className="mt-2">
      ビューポートいっぱいに広がる終端ステップ用。
    </Typography>
    <Button className="mt-6">ホームへ戻る</Button>
  </CenteredPanel>
);

export const Panel: Story = () => (
  <div className="flex h-[420px] w-[380px] flex-col rounded-lg border">
    <CenteredPanel fill="panel">
      <Heading variant="h5" level={2}>
        送信が完了しました
      </Heading>
      <Typography variant="bodySm" tone="secondary" className="mt-2">
        シートやダイアログの内側で親の高さに追従する。
      </Typography>
    </CenteredPanel>
  </div>
);
