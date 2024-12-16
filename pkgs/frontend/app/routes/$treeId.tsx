import { useSmartAccountClient } from "hooks/useWallet";

export default function Tree({ treeId }: { treeId: string }) {
  console.log("=== Tree render ===");

  const smartWallet = useSmartAccountClient();
  console.log("smartWallet.account.address", smartWallet?.account?.address);

  return (
    <>
      <div>
        Tree {treeId}
        <div>{smartWallet?.account?.address}</div>
      </div>
    </>
  );
}
