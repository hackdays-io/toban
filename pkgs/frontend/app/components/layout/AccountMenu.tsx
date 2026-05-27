import { usePrivy } from "@privy-io/react-auth";
import { useActiveWalletIdentity } from "hooks/useENS";
import { useLogoutWallet } from "hooks/useLogoutWallet";
import { useActiveWallet } from "hooks/useWallet";
import { useMemo } from "react";
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
import { Spinner } from "~/components/ui/spinner";
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
// across breakpoints.
function AccountMenu({ variant = "compact", className }: AccountMenuProps) {
  const navigate = useNavigate();
  const { treeId } = useParams();
  const { isPreparingSmartWallet } = useActiveWallet();
  const { ready, authenticated } = usePrivy();
  const { identity, isLoading: isIdentityLoading } = useActiveWalletIdentity();
  const handleLogout = useLogoutWallet();

  // Start in a loading state until Privy reports ready AND, when
  // authenticated, the smart wallet + identity lookup have settled.
  // Without this gate the trigger flashed "Login → spinner → account info"
  // on every page mount because Privy `ready` lags first paint.
  const isLoading =
    !ready || (authenticated && (isPreparingSmartWallet || isIdentityLoading));

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

  // Default loading state — covers Privy hydration, smart-wallet
  // provisioning, and the identity lookup. Sits in the AccountMenu slot
  // (top-left sidebar on desktop, account icon slot on mobile) so the
  // rest of the app stays interactive.
  if (isLoading) {
    const caption = isPreparingSmartWallet
      ? "ウォレットを準備しています…"
      : "読み込み中…";
    if (variant === "inline") {
      return (
        <output
          className={cn(
            "flex w-full items-center gap-2.5 rounded-sm px-1.5 py-1",
            className,
          )}
          aria-live="polite"
        >
          <Spinner size="sm" />
          <Typography as="span" variant="bodySm" tone="secondary" truncate>
            {caption}
          </Typography>
        </output>
      );
    }
    return (
      <output
        className={cn(
          "inline-flex size-10 items-center justify-center rounded-full",
          className,
        )}
        aria-label={caption}
        aria-live="polite"
      >
        <Spinner size="sm" />
      </output>
    );
  }

  // Privy is ready but the user is not authenticated.
  if (!authenticated) {
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

  // Authenticated but no profile yet — fall through to the loading state
  // above keeps us here only if identity already resolved.
  if (!identity) {
    return null;
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
