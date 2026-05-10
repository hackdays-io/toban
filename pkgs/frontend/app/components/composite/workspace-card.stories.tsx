import type { Story } from "@ladle/react";
import { WorkspaceCard } from "./workspace-card";

export default {
  title: "Composite / WorkspaceCard",
};

export const Default: Story = () => (
  <div className="flex w-[22rem] flex-col gap-2.5">
    <WorkspaceCard
      name="kuu village #1"
      description="オフグリッドポップアップビレッジの貢献を記録する場"
      members={24}
      lastActive="2 時間前"
      current
      onSelect={() => {}}
    />
    <WorkspaceCard
      name="Code for Japan"
      description="シビックテックコミュニティ"
      members={128}
      lastActive="昨日"
      onSelect={() => {}}
    />
    <WorkspaceCard
      name="Senspace"
      description="デザインスタジオ"
      members={8}
      lastActive="3 日前"
      onSelect={() => {}}
    />
  </div>
);

export const WithoutMeta: Story = () => (
  <div className="flex w-[22rem] flex-col gap-2.5">
    <WorkspaceCard
      name="ひがしのシェアハウス"
      description="シェアハウスの当番"
      onSelect={() => {}}
    />
    <WorkspaceCard name="名前のみのワークスペース" onSelect={() => {}} />
  </div>
);

export const WithImage: Story = () => (
  <div className="flex w-[22rem] flex-col gap-2.5">
    <WorkspaceCard
      name="kuu village #1"
      description="オフグリッドポップアップビレッジの貢献を記録する場"
      imageUrl="https://images.unsplash.com/photo-1500964757637-c85e8a162699?w=96"
      current
      onSelect={() => {}}
    />
  </div>
);
