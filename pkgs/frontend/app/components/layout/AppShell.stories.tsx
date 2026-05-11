import type { Story } from "@ladle/react";
import { useState } from "react";
import { Row } from "~/components/composite/row";
import { SectionLabel } from "~/components/composite/section-label";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Icon } from "~/components/ui/icon";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "~/components/ui/sheet";
import { AppShell } from "./AppShell";
import { PageContainer } from "./PageContainer";

export default {
  title: "Layout / AppShell",
};

const sampleHomeContent = (
  <PageContainer className="py-4 md:py-6">
    <SectionLabel>あなたの当番</SectionLabel>
    <Card className="mb-3">
      <CardHeader>
        <CardTitle>ゴミ出し</CardTitle>
      </CardHeader>
      <CardContent>残り 3 日</CardContent>
    </Card>
    <SectionLabel>最近のアクティビティ</SectionLabel>
    <div className="rounded-md border bg-surface">
      <Row title="homma さんから 10 THX" subtitle="2 時間前" />
      <Row title="genks さんから 5 THX" subtitle="昨日" />
    </div>
  </PageContainer>
);

export const Responsive: Story = () => {
  const [active, setActive] = useState("home");
  return (
    <div className="overflow-hidden rounded-md border">
      <AppShell
        workspace={{ name: "ひがしのシェアハウス" }}
        active={active}
        onNavigate={setActive}
      >
        <div className="min-h-[480px]">{sampleHomeContent}</div>
      </AppShell>
    </div>
  );
};

export const WithWorkspaceSwitcher: Story = () => {
  const [active, setActive] = useState("home");
  const [open, setOpen] = useState(false);
  return (
    <div className="overflow-hidden rounded-md border">
      <AppShell
        workspace={{ name: "ひがしのシェアハウス" }}
        active={active}
        onNavigate={setActive}
        onWorkspacePress={() => setOpen(true)}
      >
        <div className="min-h-[480px]">{sampleHomeContent}</div>
      </AppShell>
      {/* Mobile uses Sheet (bottom). On desktop you'd swap to a Popover
         anchored to the Sidebar workspace button — see #428. */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="bottom">
          <SheetHeader>
            <SheetTitle>ひがしのシェアハウス</SheetTitle>
          </SheetHeader>
          <div className="px-4 pb-4">
            <Row
              left={<Icon name="members" />}
              title="ワークスペースを切り替え"
              subtitle="2 件"
              onClick={() => setOpen(false)}
            />
            <Row
              left={<Icon name="invite" />}
              title="メンバーを招待"
              subtitle="リンクをコピーして共有"
              onClick={() => setOpen(false)}
            />
            <Row
              left={<Icon name="gear" />}
              title="ワークスペース設定"
              subtitle="名前・参加・機能設定"
              onClick={() => setOpen(false)}
            />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};
