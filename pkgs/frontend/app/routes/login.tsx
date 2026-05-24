import {
  useConnectWallet,
  useLoginWithEmail,
  useLoginWithOAuth,
  usePrivy,
  useWallets,
} from "@privy-io/react-auth";
import { useNamesByAddresses } from "hooks/useENS";
import { useActiveWallet } from "hooks/useWallet";
import { type FC, useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { AuthHero } from "~/components/composite/auth-hero";
import { AuthLayout } from "~/components/layout/AuthLayout";
import { Button } from "~/components/ui/button";
import { Card, CardContent } from "~/components/ui/card";
import { Icon } from "~/components/ui/icon";
import { Input } from "~/components/ui/input";
import { Typography } from "~/components/ui/typography";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const OTP_LENGTH = 6;

const Login: FC = () => {
  const { logout } = usePrivy();
  const { wallets } = useWallets();
  const { wallet, isSmartWallet } = useActiveWallet();
  const { fetchNames } = useNamesByAddresses();

  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"input" | "otp">("input");

  const { sendCode, loginWithCode, state: emailState } = useLoginWithEmail();
  const { initOAuth, state: oauthState } = useLoginWithOAuth();
  const { connectWallet } = useConnectWallet();

  const disconnectWallets = useCallback(async () => {
    if (wallets.length === 0) return;
    if (isSmartWallet) {
      logout();
    } else {
      Promise.all(wallets.map((w) => w.disconnect()));
    }
  }, [wallets, isSmartWallet, logout]);

  // Post-auth navigation. Routes returning users to /workspace and
  // brand-new accounts (no ENS name yet) to /signup. Fixes issue #504:
  //
  // 1. The previous flow awaited the namestone lookup with no error
  //    handling AND no timeout, so a slow/failed
  //    `/api/namestone/resolve-names` call silently aborted the navigate
  //    step and stuck the user on the "ウォレットに接続しています" card.
  //    We now race the lookup against a short timeout and treat any
  //    failure as "no profile yet" → /signup.
  //
  // 2. Previously the effect waited for `useActiveWallet`'s composite
  //    wallet (smart wallet client or the viem walletClient). When
  //    `useAccountClient` stalled on `getEthereumProvider`, that wallet
  //    never resolved and the user was stuck. For embedded wallets the
  //    `PrivyAppRoot` SmartWalletLoading gate already keeps this code
  //    path off until the smart wallet is ready, so falling back to
  //    `wallets[0].address` only kicks in for external wallets — where
  //    that address is the right one to look up anyway.
  useEffect(() => {
    const address = wallet?.account?.address ?? wallets[0]?.address;
    if (!address) return;

    const NAMESTONE_TIMEOUT_MS = 5000;
    let cancelled = false;
    let navigated = false;

    // Single navigation guard so the timeout, the resolved lookup, and the
    // catch branch can't race each other into a second navigate. Use a
    // full-page redirect (matches `SignupForm.tsx`'s post-auth pattern) so
    // we sidestep React Router's `/__manifest` round-trip, which has been
    // observed to hang and leave the user on the login card forever.
    const safeNavigate = (to: string) => {
      if (cancelled || navigated) return;
      navigated = true;
      window.location.href = to;
    };

    // Independent timer so a hanging /api/namestone/resolve-names request
    // never blocks navigation — we just default to /signup after 5 s.
    const timeoutId = setTimeout(() => {
      console.warn("namestone lookup timed out; routing to /signup");
      safeNavigate("/signup");
    }, NAMESTONE_TIMEOUT_MS);

    fetchNames([address])
      .then((names) => {
        clearTimeout(timeoutId);
        if (names?.[0]?.length === 0) {
          safeNavigate("/signup");
        } else {
          safeNavigate("/workspace");
        }
      })
      .catch((error: unknown) => {
        clearTimeout(timeoutId);
        // React Query aborts the in-flight query on teardown — that's
        // expected during normal navigation, not a routing failure.
        const isAbort =
          error instanceof Error &&
          (error.name === "AbortError" || error.name === "CanceledError");
        if (!isAbort) {
          console.error("Failed to resolve names; routing to /signup", error);
        }
        safeNavigate("/signup");
      });

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, [wallet, wallets, fetchNames]);

  const isAuthenticated = wallets.length > 0;
  const isEmailValid = EMAIL_PATTERN.test(email);
  const isSendingCode = emailState.status === "sending-code";
  const isSubmittingCode = emailState.status === "submitting-code";
  const isOAuthLoading = oauthState.status === "loading";

  const handleSendCode = useCallback(async () => {
    if (!isEmailValid) return;
    try {
      await sendCode({ email });
      setStep("otp");
    } catch (error) {
      console.error(error);
      toast.error("認証コードの送信に失敗しました");
    }
  }, [email, isEmailValid, sendCode]);

  const handleSubmitCode = useCallback(async () => {
    if (otp.length !== OTP_LENGTH) return;
    try {
      await loginWithCode({ code: otp });
    } catch (error) {
      console.error(error);
      toast.error("認証に失敗しました");
    }
  }, [otp, loginWithCode]);

  const handleGoogle = useCallback(async () => {
    try {
      await initOAuth({ provider: "google" });
    } catch (error) {
      console.error(error);
      toast.error("Google ログインに失敗しました");
    }
  }, [initOAuth]);

  const handleBackToInput = useCallback(() => {
    setStep("input");
    setOtp("");
  }, []);

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
          {!isAuthenticated && step === "input" && (
            <>
              <Input
                id="login-email"
                type="email"
                inputMode="email"
                autoComplete="email"
                placeholder="メールアドレス"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => {
                  if (
                    e.key === "Enter" &&
                    !e.nativeEvent.isComposing &&
                    isEmailValid
                  ) {
                    handleSendCode();
                  }
                }}
                aria-invalid={email.length > 0 && !isEmailValid}
                data-testid="login-email-input"
              />
              <Button
                size="lg"
                full
                data-testid="login-email-submit"
                disabled={!isEmailValid || isSendingCode}
                onClick={handleSendCode}
              >
                <Icon name="mail" size={18} />
                {isSendingCode ? "コードを送信中..." : "メールで続ける"}
              </Button>

              <div className="flex items-center gap-3 py-1" aria-hidden="true">
                <div className="h-px flex-1 bg-border" />
                <Typography variant="caption" tone="secondary">
                  または
                </Typography>
                <div className="h-px flex-1 bg-border" />
              </div>

              <Button
                variant="secondary"
                size="lg"
                full
                data-testid="login-google"
                disabled={isOAuthLoading}
                onClick={handleGoogle}
              >
                {isOAuthLoading ? "Google に接続中..." : "Google で続ける"}
              </Button>
              <Button
                variant="ghost"
                size="lg"
                full
                data-testid="login-wallet"
                onClick={() => connectWallet()}
              >
                <Icon name="wallet" size={18} />
                ウォレットで続ける
              </Button>

              <Typography
                variant="caption"
                tone="secondary"
                className="mt-1 text-center"
              >
                Privy が安全なウォレットを自動で作成します
              </Typography>
            </>
          )}

          {!isAuthenticated && step === "otp" && (
            <>
              <Typography variant="bodySm" className="text-center">
                <strong className="text-text-primary">{email}</strong>{" "}
                に送信された 6 桁のコードを入力してください。
              </Typography>
              <Input
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                placeholder="123456"
                maxLength={OTP_LENGTH}
                value={otp}
                onChange={(e) =>
                  setOtp(e.target.value.replace(/\D/g, "").slice(0, OTP_LENGTH))
                }
                onKeyDown={(e) => {
                  if (
                    e.key === "Enter" &&
                    !e.nativeEvent.isComposing &&
                    otp.length === OTP_LENGTH
                  ) {
                    handleSubmitCode();
                  }
                }}
                className="text-center tracking-[0.4em]"
                data-testid="login-otp-input"
              />
              <Button
                size="lg"
                full
                data-testid="login-otp-submit"
                disabled={otp.length !== OTP_LENGTH || isSubmittingCode}
                onClick={handleSubmitCode}
              >
                {isSubmittingCode ? "認証中..." : "認証する"}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                full
                onClick={handleBackToInput}
                disabled={isSubmittingCode}
              >
                <Icon name="chevron-left" size={16} />
                メールアドレスを変更
              </Button>
            </>
          )}

          {isAuthenticated && (
            <>
              <Typography
                variant="bodySm"
                weight="bold"
                className="text-center"
              >
                ウォレットに接続しています
              </Typography>
              <Typography
                variant="caption"
                tone="secondary"
                className="text-center"
              >
                自動でワークスペースに移動します。問題が起きた場合はサインアウトしてやり直してください。
              </Typography>
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
