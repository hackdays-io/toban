import { PrivyProvider } from "@privy-io/react-auth";
import { SmartWalletsProvider } from "@privy-io/react-auth/smart-wallets";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { privyChain } from "hooks/useViem";
import { PWAUpdater } from "./PWAUpdater";
import { SwitchNetwork } from "./SwitchNetwork";
import { AppShellLayout } from "./layout/AppShellLayout";
import { Toaster } from "./ui/sonner";

const queryClient = new QueryClient();

// Always render the AppShell. While the smart wallet is provisioning,
// `AccountMenu` shows a small inline spinner in the account area
// (top-left on desktop, account icon slot on mobile) rather than the
// previous full-screen blocker.
const AppContent = () => <AppShellLayout />;

export default function PrivyAppRoot() {
  return (
    <PrivyProvider
      appId={import.meta.env.VITE_PRIVY_APP_ID}
      config={{
        embeddedWallets: {
          // v3 moved `createOnLogin` under the per-chain-type key. v2 accepted
          // it at the top level of `embeddedWallets`; that flat form is gone.
          ethereum: {
            createOnLogin: "users-without-wallets",
          },
          // Suppress Privy's built-in signature/transaction confirmation modals
          // for the embedded wallet — writes go through app-level UX instead.
          showWalletUIs: false,
        },
        externalWallets: {
          coinbaseWallet: {
            // v3 replaced the `connectionOptions: "smartWalletOnly"` shorthand
            // with the Coinbase SDK's own options object.
            config: { preference: { options: "smartWalletOnly" } },
          },
        },
        // `privyChain` — not `currentChain` — so Privy's own public client
        // doesn't fall back to viem's default RPC. See `hooks/useViem.ts`.
        defaultChain: privyChain,
        supportedChains: [privyChain],
      }}
    >
      <SmartWalletsProvider>
        <QueryClientProvider client={queryClient}>
          <SwitchNetwork />
          <PWAUpdater />
          <AppContent />
          <Toaster />
        </QueryClientProvider>
      </SmartWalletsProvider>
    </PrivyProvider>
  );
}
