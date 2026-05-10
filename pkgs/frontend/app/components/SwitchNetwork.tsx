import { currentChain } from "hooks/useViem";
import { useActiveWallet } from "hooks/useWallet";
import { type FC, useEffect, useState } from "react";
import { Box, Button, Stack, Text } from "~/components/chakra-shim";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";

export const SwitchNetwork: FC = () => {
  const { connectedWallet } = useActiveWallet();
  const [isOpen, setIsOpen] = useState(false);
  const [isSwitching, setIsSwitching] = useState(false);

  // チェーン不一致の検出
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

  // チェーン切り替え処理
  const handleSwitchChain = async () => {
    if (!connectedWallet) return;

    try {
      setIsSwitching(true);
      await connectedWallet.switchChain(currentChain.id);
      setIsOpen(false);
    } catch (error) {
      console.error("Failed to switch chain:", error);
      // エラー時はModalを開いたままにする
    } finally {
      setIsSwitching(false);
    }
  };

  return (
    <Dialog open={isOpen}>
      <DialogContent className="max-w-[400px] rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold">
            ネットワークの切り替えが必要です
          </DialogTitle>
        </DialogHeader>

        <div>
          <Stack gap={4} align="stretch">
            <Text fontSize="sm" color="gray.600">
              現在のネットワークは対応していません。以下のネットワークに切り替えてください。
            </Text>

            <Box
              p={3}
              borderRadius="8px"
              border="1px solid"
              borderColor="red.200"
              bg="red.50"
            >
              <Text fontSize="sm" fontWeight="semibold" color="red.700">
                現在のネットワーク
              </Text>
              <Text fontSize="sm" color="red.600">
                {connectedWallet?.chainId
                  ? `Chain ID: ${connectedWallet.chainId.replace("eip155:", "")}`
                  : "未接続"}
              </Text>
            </Box>

            <Box
              p={3}
              borderRadius="8px"
              border="1px solid"
              borderColor="green.200"
              bg="green.50"
            >
              <Text fontSize="sm" fontWeight="semibold" color="green.700">
                必要なネットワーク
              </Text>
              <Text fontSize="sm" color="green.600">
                {currentChain.name} (Chain ID: {currentChain.id})
              </Text>
            </Box>
          </Stack>
        </div>

        <DialogFooter>
          <Button
            onClick={handleSwitchChain}
            loading={isSwitching}
            loadingText="切り替え中"
            width="100%"
            size="md"
          >
            ネットワークを切り替える
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
