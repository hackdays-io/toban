import { usePrivy, useWallets } from "@privy-io/react-auth";
import { useCallback } from "react";
import { useActiveWallet } from "./useWallet";

// `window.ethereum` is augmented as `any` by upstream wallet types — use
// a narrow local view here instead of redeclaring the global so we don't
// clash with the library type.
type EthereumProvider = {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
};

/**
 * Single source of truth for tearing down the Privy session.
 *
 * Forks based on wallet type to match the legacy `app/components/Header.tsx`
 * behaviour so we don't regress the auth flow:
 *
 * - Smart wallet (embedded): plain Privy `logout()`.
 * - Injected wallet (MetaMask): EIP-2255 `wallet_revokePermissions` so the
 *   site disappears from MetaMask's connected sites list.
 * - Other external wallets: Privy `logout()` plus a per-wallet `disconnect()`.
 *
 * A trailing `try/catch` fires a plain `logout()` as a last-resort fallback
 * if any of the above throws.
 */
export const useLogoutWallet = () => {
  const { logout } = usePrivy();
  const { isSmartWallet } = useActiveWallet();
  const { wallets } = useWallets();

  return useCallback(async () => {
    try {
      if (isSmartWallet) {
        await logout();
        return;
      }

      const hasInjectedWallet = wallets.some(
        (w) => w.connectorType === "injected",
      );

      if (hasInjectedWallet) {
        try {
          const ethereum =
            typeof window !== "undefined"
              ? (window.ethereum as EthereumProvider | undefined)
              : undefined;
          if (ethereum) {
            await ethereum.request({
              method: "wallet_revokePermissions",
              params: [{ eth_accounts: {} }],
            });
          }
        } catch (revokeError) {
          console.warn("Failed to revoke MetaMask permissions:", revokeError);
        }
        return;
      }

      await logout();
      for (const wallet of wallets) {
        if (wallet.connectorType !== "injected") {
          try {
            wallet.disconnect();
          } catch (error) {
            console.warn("Failed to disconnect wallet:", wallet.address, error);
          }
        }
      }
    } catch (error) {
      console.error("Logout failed:", error);
      try {
        await logout();
      } catch (logoutError) {
        console.error("Fallback logout also failed:", logoutError);
      }
    }
  }, [isSmartWallet, logout, wallets]);
};
