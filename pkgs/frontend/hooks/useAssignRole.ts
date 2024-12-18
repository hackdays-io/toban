import { useState, useCallback } from "react";
import { Address } from "viem";
import { mintHat } from "../contracts/HatsTimeFrameModule";
import { useActiveWallet } from "./useWallet";
import { chainId } from "./useViem";

interface AssignRoleParams {
  hatId: bigint;
  wearer: Address;
}

interface UseAssignRoleReturn {
  assignRole: (params: AssignRoleParams) => Promise<void>;
  isAssigning: boolean;
  assignError: string | null;
  assignSuccess: boolean;
}

/**
 * Custom hook to assign a role (mint a Hat) to a user.
 * Integrates with the HatsTimeFrameModule contract to send a transaction and handle its result.
 */
export const useAssignRole = (): UseAssignRoleReturn => {
  const [isAssigning, setIsAssigning] = useState(false);
  const [assignError, setAssignError] = useState<string | null>(null);
  const [assignSuccess, setAssignSuccess] = useState(false);

  const { wallet } = useActiveWallet();

  const assignRole = useCallback(
    async (params: AssignRoleParams) => {
      setIsAssigning(true);
      setAssignError(null);
      setAssignSuccess(false);

      try {
        const { hatId, wearer } = params;

        if (!chainId) {
          throw new Error(
            "Chain ID is not available. Please ensure `useViem` is set up correctly."
          );
        }

        if (!wallet) {
          throw new Error(
            "Wallet is not available. Please connect your wallet."
          );
        }

        // Call the mintHat function from HatsTimeFrameModule
        const txHash = await mintHat({
          chainId,
          hatId,
          wearer,
          walletClient: wallet,
        });

        if (txHash) {
          setAssignSuccess(true);
          console.log(`Hat minted successfully. Transaction hash: ${txHash}`);
        } else {
          setAssignError("Transaction failed to send.");
        }
      } catch (error: any) {
        console.error("Error assigning role:", error);
        setAssignError(error.message || "An unexpected error occurred.");
      } finally {
        setIsAssigning(false);
      }
    },
    [chainId, wallet]
  );

  return {
    assignRole,
    isAssigning,
    assignError,
    assignSuccess,
  };
};
