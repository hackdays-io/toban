import { PrivyProvider } from "@privy-io/react-auth";
import { SmartWalletsProvider } from "@privy-io/react-auth/smart-wallets";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { currentChain } from "hooks/useViem";
import { useActiveWallet } from "hooks/useWallet";
import { PWAUpdater } from "./PWAUpdater";
import { SmartWalletLoading } from "./SmartWalletLoading";
import { SwitchNetwork } from "./SwitchNetwork";
import { AppShellLayout } from "./layout/AppShellLayout";
import { Toaster } from "./ui/sonner";

const queryClient = new QueryClient();

const AppContent = () => {
  const { isConnectingEmbeddedWallet, isSmartWallet } = useActiveWallet();
  const isPreparingSmartWallet = isConnectingEmbeddedWallet && !isSmartWallet;

  if (isPreparingSmartWallet) return <SmartWalletLoading />;
  return <AppShellLayout />;
};

export default function PrivyAppRoot() {
  return (
    <PrivyProvider
      appId={import.meta.env.VITE_PRIVY_APP_ID}
      config={{
        embeddedWallets: {
          createOnLogin: "users-without-wallets",
        },
        externalWallets: {
          coinbaseWallet: {
            connectionOptions: "smartWalletOnly",
          },
        },
        defaultChain: currentChain,
        supportedChains: [currentChain],
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
