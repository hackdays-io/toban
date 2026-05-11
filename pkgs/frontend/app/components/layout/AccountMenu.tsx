import { usePrivy, useWallets } from "@privy-io/react-auth";
import { useActiveWalletIdentity } from "hooks/useENS";
import { useActiveWallet } from "hooks/useWallet";
import { useCallback, useMemo } from "react";
import { useNavigate, useParams } from "react-router";
import { ipfs2https } from "utils/ipfs";
import { abbreviateAddress } from "utils/wallet";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Button } from "~/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { Icon } from "~/components/ui/icon";
import { Typography } from "~/components/ui/typography";
import { cn } from "~/lib/utils";

interface AccountMenuProps {
  /** Visual variant — `compact` (mobile AppHeader trailing slot) or `inline`
   *  (desktop Sidebar footer). */
  variant?: "compact" | "inline";
  /** Optional className override for the trigger. */
  className?: string;
}

// AccountMenu — single source of truth for the Privy account dropdown that
// used to live inside `app/components/Header.tsx` (legacy chakra-shim header).
// Surfaced from both the mobile `AppHeader` `right` slot and the desktop
// `Sidebar` user footer so logout / profile / send behaviour stays identical
// across breakpoints. Encapsulates the smart-wallet vs. external-wallet
// (`wallet_revokePermissions` for injected MetaMask) logout fork verbatim
// from the legacy header so the Privy auth flow keeps working unchanged.
function AccountMenu({ variant = "compact", className }: AccountMenuProps) {
  const navigate = useNavigate();
  const { treeId } = useParams();
  const { isSmartWallet } = useActiveWallet();
  const { logout } = usePrivy();
  const { wallets } = useWallets();
  const { identity } = useActiveWalletIdentity();

  const userImageUrl = useMemo(() => {
    const avatar = identity?.text_records?.avatar;
    return avatar ? ipfs2https(avatar) : undefined;
  }, [identity]);

  const displayName = useMemo(() => {
    if (identity?.name) return identity.name;
    if (identity?.address) return abbreviateAddress(identity.address);
    return "Account";
  }, [identity]);

  const subtitle = useMemo(() => {
    if (identity?.address) return abbreviateAddress(identity.address);
    return undefined;
  }, [identity]);

  // Verbatim port of the legacy logout fork — keep the smart-wallet vs.
  // external-wallet behaviour aligned with `app/components/Header.tsx` so
  // we don't regress the Privy session cleanup.
  const handleLogout = useCallback(async () => {
    try {
      if (isSmartWallet) {
        // スマートウォレットの場合、Privy の logout をそのまま使う
        await logout();
      } else {
        // 外部ウォレット（MetaMask など）
        const hasInjectedWallet = wallets.some(
          (w) => w.connectorType === "injected",
        );

        if (hasInjectedWallet) {
          // MetaMask の権限を無効化
          try {
            if (typeof window !== "undefined" && window.ethereum) {
              await window.ethereum.request({
                method: "wallet_revokePermissions",
                params: [{ eth_accounts: {} }],
              });
            }
          } catch (revokeError) {
            console.warn("Failed to revoke MetaMask permissions:", revokeError);
          }
        } else {
          // その他の外部ウォレット
          await logout();

          for (const wallet of wallets) {
            if (wallet.connectorType !== "injected") {
              try {
                wallet.disconnect();
              } catch (error) {
                console.warn(
                  "Failed to disconnect wallet:",
                  wallet.address,
                  error,
                );
              }
            }
          }
        }
      }
    } catch (error) {
      console.error("Logout failed:", error);
      // フォールバック
      try {
        await logout();
      } catch (logoutError) {
        console.error("Fallback logout also failed:", logoutError);
      }
    }
  }, [isSmartWallet, logout, wallets]);

  // Render Login button if not authenticated.
  if (!identity) {
    return (
      <Button
        variant="primary"
        size="sm"
        onClick={() => navigate("/login")}
        className={className}
      >
        Login
      </Button>
    );
  }

  const trigger =
    variant === "inline" ? (
      <button
        type="button"
        aria-label="アカウントメニュー"
        className={cn(
          "flex w-full items-center gap-2.5 rounded-sm px-1.5 py-1 text-left transition-colors hover:bg-bg",
          className,
        )}
      >
        <Avatar>
          {userImageUrl && <AvatarImage src={userImageUrl} alt={displayName} />}
          <AvatarFallback seed={displayName} />
        </Avatar>
        <div className="min-w-0 flex-1">
          <Typography as="div" variant="bodySm" weight="bold" truncate>
            {displayName}
          </Typography>
          {subtitle && (
            <Typography as="div" variant="mono" tone="secondary" truncate>
              {subtitle}
            </Typography>
          )}
        </div>
        <Icon name="chevron-down" size={14} className="text-text-secondary" />
      </button>
    ) : (
      <button
        type="button"
        aria-label="アカウントメニュー"
        className={cn(
          "inline-flex size-10 items-center justify-center rounded-full transition-colors hover:bg-bg",
          className,
        )}
      >
        <Avatar size="sm">
          {userImageUrl && <AvatarImage src={userImageUrl} alt={displayName} />}
          <AvatarFallback seed={displayName} />
        </Avatar>
      </button>
    );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        sideOffset={8}
        className="min-w-56 rounded-md"
      >
        <DropdownMenuLabel className="flex flex-col gap-0.5 py-2">
          <Typography as="span" variant="bodySm" weight="bold">
            {displayName}
          </Typography>
          {identity.name && identity.domain && (
            <Typography as="span" variant="micro" tone="secondary">
              {identity.name}.{identity.domain}
            </Typography>
          )}
          {identity.address && (
            <Typography as="span" variant="mono" tone="secondary">
              {abbreviateAddress(identity.address)}
            </Typography>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {treeId && (
          <DropdownMenuItem
            onSelect={() => navigate(`/${treeId}/member/${identity.address}`)}
          >
            <Icon name="user" size={16} />
            プロフィール
          </DropdownMenuItem>
        )}
        <DropdownMenuItem onSelect={() => navigate("/transaction")}>
          <Icon name="send" size={16} />
          送金
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onSelect={handleLogout}>
          <Icon name="logout" size={16} />
          Logout
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export { AccountMenu };
export type { AccountMenuProps };
