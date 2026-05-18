import { usePrivy } from "@privy-io/react-auth";
import { currentChain } from "hooks/useViem";
import { useActiveWallet } from "hooks/useWallet";
import { type FC, useMemo, useState } from "react";
import { SiDiscord } from "react-icons/si";
import { useNavigate, useSearchParams } from "react-router";
import { toast } from "sonner";
import { type Address, type Hex, bytesToHex, keccak256, toBytes } from "viem";
import { PageContainer } from "~/components/layout/PageContainer";
import { Button } from "~/components/ui/button";
import { Card, CardContent } from "~/components/ui/card";
import { Heading } from "~/components/ui/heading";
import { Icon } from "~/components/ui/icon";
import { Typography } from "~/components/ui/typography";

const IDENTITY_BINDING_TYPES = {
  IdentityBinding: [
    { name: "wallet", type: "address" },
    { name: "provider", type: "string" },
    { name: "accountId", type: "string" },
    { name: "verifierTokenHash", type: "bytes32" },
    { name: "expires", type: "uint256" },
    { name: "nonce", type: "bytes32" },
  ],
} as const;

type VerifierClaims = {
  provider: "discord";
  accountId: string;
  exp: number;
  iss: string;
};

function decodeVerifierClaims(token: string): VerifierClaims | null {
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  try {
    const padded = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padding = "=".repeat((4 - (padded.length % 4)) % 4);
    const json =
      typeof atob === "function"
        ? atob(padded + padding)
        : Buffer.from(padded + padding, "base64").toString("utf-8");
    return JSON.parse(json) as VerifierClaims;
  } catch {
    return null;
  }
}

// Maps the stable ConnectErrorCode set returned by `@toban/identity`'s
// /api/connect handler. Anything not listed falls back to a generic
// message; the codes themselves are the long-term API contract.
const ERROR_MESSAGES: Record<string, string> = {
  invalid_body: "リクエスト形式が不正です。",
  unknown_provider: "未対応のプロバイダーです。",
  provider_mismatch: "プロバイダー指定が一致しません。",
  binding_expired: "署名の有効期限が切れています。再度お試しください。",
  verifier_token_hash_mismatch:
    "署名と verifier_token が一致しません。再度お試しください。",
  verifier_token_invalid:
    "verifier_token が無効です。Discord で `/toban-setup` をやり直してください。",
  verifier_token_expired:
    "verifier_token の有効期限 (15分) が切れています。Discord で `/toban-setup` をやり直してください。",
  account_id_mismatch:
    "署名に含まれる Discord アカウントが verifier_token と一致しません。",
  wallet_mismatch:
    "署名したウォレットが指定アドレスと一致しません。同じウォレットでお試しください。",
  nonce_reused: "同じ署名が既に使用されています。再度お試しください。",
};

const ConnectDiscord: FC = () => {
  const [params] = useSearchParams();
  const token = params.get("token");
  const treeId = params.get("treeId");

  const claims = useMemo(
    () => (token ? decodeVerifierClaims(token) : null),
    [token],
  );
  const tokenExpired = useMemo(() => {
    if (!claims) return false;
    return Math.floor(Date.now() / 1000) >= claims.exp;
  }, [claims]);

  const { ready, authenticated, login } = usePrivy();
  const { wallet } = useActiveWallet();
  const navigate = useNavigate();

  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [errorCode, setErrorCode] = useState<string | null>(null);

  const onSubmit = async () => {
    if (!token || !claims || !wallet?.account?.address) return;
    setSubmitting(true);
    setErrorCode(null);

    try {
      const nonceBytes = new Uint8Array(32);
      crypto.getRandomValues(nonceBytes);
      const nonce = bytesToHex(nonceBytes);
      const verifierTokenHash = keccak256(toBytes(token));
      const expires = BigInt(Math.floor(Date.now() / 1000) + 30 * 60);
      const walletAddress = wallet.account.address as Address;

      const message = {
        wallet: walletAddress,
        provider: "discord" as const,
        accountId: claims.accountId,
        verifierTokenHash,
        expires,
        nonce,
      };
      const domain = {
        name: "TobanIdentity",
        version: "1",
        chainId: currentChain.id,
      } as const;

      const signature = (await wallet.signTypedData({
        account: walletAddress,
        domain,
        types: IDENTITY_BINDING_TYPES,
        primaryType: "IdentityBinding",
        message,
      })) as Hex;

      const identityUrl = import.meta.env.VITE_IDENTITY_WORKER_URL as
        | string
        | undefined;
      if (!identityUrl) {
        throw new Error("VITE_IDENTITY_WORKER_URL is not configured");
      }

      const res = await fetch(`${identityUrl.replace(/\/$/, "")}/api/connect`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: "discord",
          verifier_token: token,
          identity_binding: {
            typedData: {
              domain,
              types: IDENTITY_BINDING_TYPES,
              primaryType: "IdentityBinding",
              message,
            },
            signature,
          },
        }),
      });

      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as {
          error?: string;
        };
        setErrorCode(body.error ?? "unknown");
        toast.error(
          ERROR_MESSAGES[body.error ?? ""] ??
            `連携に失敗しました (${res.status})`,
        );
        return;
      }

      setDone(true);
      toast.success("Discord を連携しました");
    } catch (e) {
      console.error(e);
      const message = e instanceof Error ? e.message : "unknown error";
      setErrorCode("client_error");
      toast.error(`署名に失敗しました: ${message}`);
    } finally {
      setSubmitting(false);
    }
  };

  if (!token) {
    return (
      <PageContainer className="flex flex-col gap-6 pt-8 pb-12 md:pt-12">
        <Heading variant="h2" level={1}>
          Discord 連携
        </Heading>
        <Card>
          <CardContent>
            <Typography variant="body" tone="danger">
              URL に verifier_token が含まれていません。Discord で
              `/toban-setup` を実行してから、案内された URL を開いてください。
            </Typography>
          </CardContent>
        </Card>
      </PageContainer>
    );
  }

  if (!claims) {
    return (
      <PageContainer className="flex flex-col gap-6 pt-8 pb-12 md:pt-12">
        <Heading variant="h2" level={1}>
          Discord 連携
        </Heading>
        <Card>
          <CardContent>
            <Typography variant="body" tone="danger">
              verifier_token の形式が不正です。Discord でやり直してください。
            </Typography>
          </CardContent>
        </Card>
      </PageContainer>
    );
  }

  return (
    <PageContainer className="flex flex-col gap-6 pt-8 pb-12 md:pt-12">
      <header className="flex flex-col gap-1">
        <Typography variant="bodySm" tone="secondary">
          外部サービス連携
        </Typography>
        <Heading variant="h2" level={1}>
          Discord を連携
        </Heading>
      </header>

      <Card>
        <CardContent className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <SiDiscord size={28} className="text-[#5865F2]" />
            <div className="flex flex-col">
              <Typography variant="bodySm" tone="secondary">
                Discord アカウント ID
              </Typography>
              <Typography variant="body" weight="bold">
                {claims.accountId}
              </Typography>
            </div>
          </div>

          <Typography variant="bodySm" tone="secondary">
            このウォレットを上記の Discord アカウントに紐づけます。Discord での
            `/thx` 送信時に、この紐づけからウォレットが解決されます。
          </Typography>

          {tokenExpired && (
            <Typography variant="bodySm" tone="danger">
              verifier_token の有効期限が切れています。Discord で `/toban-setup`
              をやり直してください。
            </Typography>
          )}

          {done ? (
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <Icon name="check" />
                <Typography variant="body" weight="bold" tone="success">
                  連携が完了しました
                </Typography>
              </div>
              <Typography variant="bodySm" tone="secondary">
                次に bot に mint 許可を設定してください。
              </Typography>
              <Button
                full
                disabled={!treeId}
                onClick={() => {
                  if (!treeId) return;
                  navigate(`/${encodeURIComponent(treeId)}/discord-bot`);
                }}
              >
                許可設定に進む
                <Icon name="arrow-right" size={18} />
              </Button>
              {!treeId && (
                <Typography variant="caption" tone="secondary">
                  ワークスペース指定が無いため、トップから手動で開いてください
                  (/&lt;treeId&gt;/discord-bot)。
                </Typography>
              )}
            </div>
          ) : !ready ? (
            <Button full disabled>
              読み込み中…
            </Button>
          ) : !authenticated || !wallet?.account?.address ? (
            <Button full onClick={login} disabled={tokenExpired}>
              <Icon name="wallet" size={18} />
              ウォレットを接続
            </Button>
          ) : (
            <div className="flex flex-col gap-2">
              <Typography variant="bodySm" tone="secondary">
                署名するウォレット: {wallet.account.address}
              </Typography>
              <Button
                full
                onClick={onSubmit}
                disabled={submitting || tokenExpired}
              >
                {submitting ? "署名中…" : "署名して連携"}
              </Button>
              {errorCode && !ERROR_MESSAGES[errorCode] && (
                <Typography variant="caption" tone="danger">
                  エラーコード: {errorCode}
                </Typography>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </PageContainer>
  );
};

export default ConnectDiscord;
