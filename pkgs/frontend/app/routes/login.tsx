import { usePrivy, useWallets } from "@privy-io/react-auth";
import { useNamesByAddresses } from "hooks/useENS";
import { useActiveWallet } from "hooks/useWallet";
import { type FC, useCallback, useEffect } from "react";
import { useNavigate } from "react-router";
import { AuthHero } from "~/components/composite/auth-hero";
import { AuthLayout } from "~/components/layout/AuthLayout";
import { Button } from "~/components/ui/button";
import { Card, CardContent } from "~/components/ui/card";
import { Icon } from "~/components/ui/icon";

const Login: FC = () => {
  const navigate = useNavigate();
  const { connectOrCreateWallet, logout } = usePrivy();
  const { wallets } = useWallets();
  const { wallet, isSmartWallet } = useActiveWallet();
  const { fetchNames } = useNamesByAddresses();

  // ToDo：Metamask、Privyアカウント、どちらともディスコネクトできないので修正する
  const disconnectWallets = useCallback(async () => {
    if (wallets.length === 0) return;
    if (isSmartWallet) {
      logout();
    } else {
      Promise.all(wallets.map((wallet) => wallet.disconnect()));
    }
  }, [wallets, isSmartWallet, logout]);

  useEffect(() => {
    const afterLogin = async () => {
      if (!wallet) return;

      const address = wallet.account?.address;
      if (!address) return;
      const names = await fetchNames([address]);

      if (names?.[0].length === 0) {
        navigate("/signup");
      } else {
        navigate("/workspace");
      }
    };

    afterLogin();
  }, [wallet, navigate, fetchNames]);

  const isAuthenticated = wallets.length > 0;

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
          description="Toban はコミュニティで起きた小さな貢献を、感謝として記録し、納得できる分配につなげるサービスです。"
        />
      }
      footer={
        <span>
          続行することで Toban
          の利用規約とプライバシーポリシーに同意したものとみなされます。
        </span>
      }
    >
      <Card className="w-full max-w-sm">
        <CardContent className="flex flex-col gap-3">
          {!isAuthenticated ? (
            <>
              <Button
                size="lg"
                full
                data-testid="login"
                onClick={connectOrCreateWallet}
              >
                <Icon name="wallet" size={18} />
                ウォレットで続ける
              </Button>
              <Button
                variant="secondary"
                size="lg"
                full
                onClick={connectOrCreateWallet}
              >
                <Icon name="mail" size={18} />
                メール / SNS で続ける
              </Button>
              <p className="mt-1 text-center text-xs text-text-secondary">
                Privy が安全なウォレットを自動で作成します
              </p>
            </>
          ) : (
            <>
              <p className="text-center text-sm font-bold text-text-primary">
                ウォレットに接続しています
              </p>
              <p className="text-center text-xs text-text-secondary">
                自動でワークスペースに移動します。問題が起きた場合はサインアウトしてやり直してください。
              </p>
              <Button
                variant="secondary"
                size="lg"
                full
                onClick={isSmartWallet ? logout : disconnectWallets}
              >
                <Icon name="logout" size={18} />
                サインアウト
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </AuthLayout>
  );
};

export default Login;
