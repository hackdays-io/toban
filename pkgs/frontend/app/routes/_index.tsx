import { Link } from "react-router";
import { AuthHero } from "~/components/composite/auth-hero";
import { AuthLayout } from "~/components/layout/AuthLayout";
import { Button } from "~/components/ui/button";
import { Card, CardContent } from "~/components/ui/card";
import { Icon } from "~/components/ui/icon";

export default function Index() {
  return (
    <AuthLayout
      hero={
        <AuthHero
          title={
            <>
              みんなの貢献を、
              <br />
              未来の力に。
            </>
          }
          description="コミュニティで起きた小さな貢献を感謝として記録し、納得できる分配につなげる、シンプルな貢献記録アプリです。"
        />
      }
      footer={
        <span>
          © {new Date().getFullYear()} Toban — Simplest way of contribution
          recording and rewards distribution.
        </span>
      }
    >
      <Card className="w-full max-w-sm">
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-2 text-center">
            <p className="text-sm font-bold text-text-primary">
              ようこそ Toban へ
            </p>
            <p className="text-xs leading-relaxed text-text-secondary">
              ウォレットでサインインして、コミュニティの貢献を見える化しましょう。
            </p>
          </div>
          <Link to="/login" className="w-full">
            <Button
              size="lg"
              full
              data-testid="start-button"
              className="font-bold"
            >
              はじめる
              <Icon name="arrow-right" size={18} />
            </Button>
          </Link>
        </CardContent>
      </Card>
    </AuthLayout>
  );
}
