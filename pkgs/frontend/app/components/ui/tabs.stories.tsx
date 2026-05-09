import type { Story } from "@ladle/react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./tabs";

export default {
  title: "UI / Tabs",
};

export const Default: Story = () => (
  <Tabs defaultValue="duty" className="w-[28rem]">
    <TabsList>
      <TabsTrigger value="duty">当番</TabsTrigger>
      <TabsTrigger value="quest">クエスト</TabsTrigger>
      <TabsTrigger value="archive">アーカイブ</TabsTrigger>
    </TabsList>
    <TabsContent
      value="duty"
      className="rounded-md border bg-surface p-4 text-sm"
    >
      今週の当番一覧
    </TabsContent>
    <TabsContent
      value="quest"
      className="rounded-md border bg-surface p-4 text-sm"
    >
      募集中のクエスト
    </TabsContent>
    <TabsContent
      value="archive"
      className="rounded-md border bg-surface p-4 text-sm"
    >
      過去の当番
    </TabsContent>
  </Tabs>
);

export const LineVariant: Story = () => (
  <Tabs defaultValue="profile" className="w-[28rem]">
    <TabsList variant="line">
      <TabsTrigger value="profile">プロフィール</TabsTrigger>
      <TabsTrigger value="settings">設定</TabsTrigger>
    </TabsList>
    <TabsContent value="profile" className="border-t pt-4 text-sm">
      プロフィール内容
    </TabsContent>
    <TabsContent value="settings" className="border-t pt-4 text-sm">
      設定内容
    </TabsContent>
  </Tabs>
);
