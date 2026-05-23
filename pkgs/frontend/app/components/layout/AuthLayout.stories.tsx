import type { Story } from "@ladle/react";
import { AuthHero } from "~/components/composite/auth-hero";
import { Button } from "~/components/ui/button";
import { Card, CardContent } from "~/components/ui/card";
import { Icon } from "~/components/ui/icon";
import { Input } from "~/components/ui/input";
import { Typography } from "~/components/ui/typography";
import { AuthLayout } from "./AuthLayout";

export default {
  title: "Layout / AuthLayout",
};

const Hero = (
  <AuthHero
    align="centered"
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
        <Input
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder="メールアドレス"
        />
        <Button size="lg" full>
          <Icon name="mail" size={18} />
          メールで続ける
        </Button>
        <div className="flex items-center gap-3 py-1" aria-hidden="true">
          <div className="h-px flex-1 bg-border" />
          <Typography variant="caption" tone="secondary">
            または
          </Typography>
          <div className="h-px flex-1 bg-border" />
        </div>
        <Button variant="secondary" size="lg" full>
          Google で続ける
        </Button>
        <Button variant="ghost" size="lg" full>
          <Icon name="wallet" size={18} />
          ウォレットで続ける
        </Button>
      </CardContent>
    </Card>
  </AuthLayout>
);

export const LoginOtpStep: Story = () => (
  <AuthLayout hero={Hero}>
    <Card className="w-full max-w-sm">
      <CardContent className="flex flex-col gap-3">
        <Typography variant="bodySm" className="text-center">
          <strong className="text-text-primary">user@example.com</strong> に
          送信された 6 桁のコードを入力してください。
        </Typography>
        <Input
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          placeholder="123456"
          maxLength={6}
          className="text-center tracking-[0.4em]"
        />
        <Button size="lg" full>
          認証する
        </Button>
        <Button variant="ghost" size="sm" full>
          <Icon name="chevron-left" size={16} />
          メールアドレスを変更
        </Button>
      </CardContent>
    </Card>
  </AuthLayout>
);
