import type { Story } from "@ladle/react";
import { AuthHero } from "~/components/composite/auth-hero";
import { Button } from "~/components/ui/button";
import { Card, CardContent } from "~/components/ui/card";
import { Icon } from "~/components/ui/icon";
import { AuthLayout } from "./AuthLayout";

export default {
  title: "Layout / AuthLayout",
};

const Hero = (
  <AuthHero
    align="centered"
    eyebrow="あたたかい当番帳"
    title={
      <>
        みんなの貢献を、
        <br />
        未来の力に。
      </>
    }
    description="コミュニティで起きた小さな貢献を、感謝として記録し、納得できる分配につなげます。"
  />
);

export const LoginCTA: Story = () => (
  <AuthLayout
    hero={Hero}
    footer={
      <span>
        続行することで <a href="/">利用規約</a> に同意したものとみなされます。
      </span>
    }
  >
    <Card className="w-full max-w-sm">
      <CardContent className="flex flex-col gap-3">
        <Button size="lg" full>
          <Icon name="wallet" size={18} />
          ウォレットで続ける
        </Button>
        <Button variant="secondary" size="lg" full>
          <Icon name="mail" size={18} />
          メール / SNS で続ける
        </Button>
      </CardContent>
    </Card>
  </AuthLayout>
);
