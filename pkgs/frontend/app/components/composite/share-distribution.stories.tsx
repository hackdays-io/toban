import type { Story } from "@ladle/react";
import { Avatar, AvatarFallback } from "~/components/ui/avatar";
import { ShareDistribution } from "./share-distribution";

export default {
  title: "Composite / ShareDistribution",
};

export const Default: Story = () => (
  <div className="w-80">
    <ShareDistribution
      items={[
        { key: "ryu", label: "ryu", percent: 40 },
        { key: "sg", label: "sg", percent: 30 },
        { key: "eri", label: "eri", percent: 20 },
        { key: "homma", label: "homma", percent: 10 },
      ]}
    />
  </div>
);

export const WithAvatars: Story = () => (
  <div className="w-80">
    <ShareDistribution
      items={[
        {
          key: "ryu",
          label: "ryu",
          percent: 55,
          leading: (
            <Avatar size="sm" className="size-6">
              <AvatarFallback seed="ryu" />
            </Avatar>
          ),
        },
        {
          key: "sg",
          label: "sg",
          percent: 25,
          leading: (
            <Avatar size="sm" className="size-6">
              <AvatarFallback seed="sg" />
            </Avatar>
          ),
        },
        {
          key: "homma",
          label: "homma",
          percent: 20,
          leading: (
            <Avatar size="sm" className="size-6">
              <AvatarFallback seed="homma" />
            </Avatar>
          ),
        },
      ]}
    />
  </div>
);

export const SingleHolder: Story = () => (
  <div className="w-80">
    <ShareDistribution items={[{ key: "me", label: "あなた", percent: 100 }]} />
  </div>
);

export const Empty: Story = () => (
  <div className="w-80">
    <ShareDistribution items={[]} />
  </div>
);
