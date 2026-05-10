import type { Story } from "@ladle/react";
import {
  Avatar,
  AvatarFallback,
  AvatarGroup,
  AvatarGroupCount,
  AvatarImage,
} from "./avatar";

export default {
  title: "UI / Avatar",
};

const seeds = ["ひらやま", "homma", "前田陽太", "genks", "ryoma", "yuki"];

export const Default: Story = () => (
  <div className="flex items-center gap-4">
    <Avatar size="sm">
      <AvatarFallback seed="ひらやま" />
    </Avatar>
    <Avatar>
      <AvatarFallback seed="ひらやま" />
    </Avatar>
    <Avatar size="lg">
      <AvatarFallback seed="ひらやま" />
    </Avatar>
    <Avatar size="xl">
      <AvatarFallback seed="ひらやま" />
    </Avatar>
  </div>
);

export const SeedColors: Story = () => (
  <div className="flex flex-wrap gap-3">
    {seeds.map((seed) => (
      <div key={seed} className="flex flex-col items-center gap-1">
        <Avatar size="lg">
          <AvatarFallback seed={seed} />
        </Avatar>
        <span className="text-xs text-text-secondary">{seed}</span>
      </div>
    ))}
  </div>
);

export const WithImage: Story = () => (
  <div className="flex items-center gap-4">
    <Avatar size="lg">
      <AvatarImage
        src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200"
        alt="member"
      />
      <AvatarFallback seed="member" />
    </Avatar>
    <Avatar size="lg">
      {/* broken src exercises the fallback path */}
      <AvatarImage src="/missing.png" alt="missing" />
      <AvatarFallback seed="Tanaka" />
    </Avatar>
  </div>
);

export const Group: Story = () => (
  <AvatarGroup data-size="default">
    {seeds.slice(0, 3).map((seed) => (
      <Avatar key={seed}>
        <AvatarFallback seed={seed} />
      </Avatar>
    ))}
    <AvatarGroupCount>+4</AvatarGroupCount>
  </AvatarGroup>
);
