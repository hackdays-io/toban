import { currentChain } from "hooks/useViem";
import { useActiveWallet } from "hooks/useWallet";
import { type FC, useEffect, useState } from "react";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";

export const SwitchNetwork: FC = () => {
  const { connectedWallet } = useActiveWallet();
  const [isOpen, setIsOpen] = useState(false);
  const [isSwitching, setIsSwitching] = useState(false);

  useEffect(() => {
    if (connectedWallet?.chainId) {
      const isChainMismatch =
        Number(connectedWallet.chainId.replace("eip155:", "")) !==
        currentChain.id;
      setIsOpen(isChainMismatch);
    } else {
      setIsOpen(false);
    }
  }, [connectedWallet]);

  const handleSwitchChain = async () => {
    if (!connectedWallet) return;

    try {
      setIsSwitching(true);
      await connectedWallet.switchChain(currentChain.id);
      setIsOpen(false);
    } catch (error) {
      console.error("Failed to switch chain:", error);
    } finally {
      setIsSwitching(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-[400px] rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold">
            ネットワークの切り替えが必要です
          </DialogTitle>
          <DialogDescription>
            現在のネットワークは対応していません。以下のネットワークに切り替えてください。
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3">
          <div className="rounded-md border border-danger/30 bg-danger/10 p-3">
            <p className="text-sm font-semibold text-danger">
              現在のネットワーク
            </p>
            <p className="text-sm text-danger">
              {connectedWallet?.chainId
                ? `Chain ID: ${connectedWallet.chainId.replace("eip155:", "")}`
                : "未接続"}
            </p>
          </div>

          <div className="rounded-md border border-contrib/30 bg-contrib/10 p-3">
            <p className="text-sm font-semibold text-contrib">
              必要なネットワーク
            </p>
            <p className="text-sm text-contrib">
              {currentChain.name} (Chain ID: {currentChain.id})
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            onClick={handleSwitchChain}
            disabled={isSwitching}
            full
            size="md"
          >
            {isSwitching ? "切り替え中..." : "ネットワークを切り替える"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
