import type { Story } from "@ladle/react";
import { AuthHero } from "./auth-hero";

export default {
  title: "Composite / AuthHero",
};

export const Centered: Story = () => (
  <div className="mx-auto max-w-md p-8">
    <AuthHero
      eyebrow="あたたかい当番帳"
      title={
        <>
          みんなの貢献を、
          <br />
          未来の力に。
        </>
      }
      description="Toban はコミュニティで起きた小さな貢献を、感謝として記録し、納得できる分配につなげるサービスです。"
    />
  </div>
);

export const Start: Story = () => (
  <div className="max-w-2xl p-8">
    <AuthHero
      align="start"
      eyebrow="あたたかい当番帳"
      title={
        <>
          みんなの貢献を、
          <br />
          未来の力に。
        </>
      }
      description="Toban はコミュニティで起きた小さな貢献を、感謝として記録し、納得できる分配につなげるサービスです。"
    />
  </div>
);

export const TitleOnly: Story = () => (
  <div className="mx-auto max-w-md p-8">
    <AuthHero title="ようこそ Toban へ" />
  </div>
);
