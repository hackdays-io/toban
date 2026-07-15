import { BrowserMultiFormatReader } from "@zxing/library";
import { ERC20_ABI } from "abi/erc20";
import { publicClient } from "hooks/useViem";
import { useActiveWallet } from "hooks/useWallet";
import { type FC, useCallback, useEffect, useRef, useState } from "react";
import { LuQrCode } from "react-icons/lu";
import { useNavigate, useSearchParams } from "react-router";
import { toast } from "sonner";

import { PageContainer } from "~/components/layout/PageContainer";
import { ScreenHeader } from "~/components/layout/ScreenHeader";
import { Button } from "~/components/ui/button";
import { Heading } from "~/components/ui/heading";
import { Input } from "~/components/ui/input";
import { Typography } from "~/components/ui/typography";

// Hardcoded ERC20 (kuu) contract carried over from the legacy screen. The
// type / contract selector was commented out in the previous implementation,
// so this screen only sends the kuu token today. Revisit once a token picker
// lands.
const KUU_CONTRACT_ADDRESS =
  "0x404A0809ebE3CC6e0b3cBEc8c1F8b9Dd09ae21Cc" as const;

const isValidEthereumAddress = (value: string): boolean =>
  /^0x[a-fA-F0-9]{40}$/.test(value);

interface QrAddressScannerProps {
  onAddress: (address: string) => void;
  disabled?: boolean;
}

// Lightweight QR scanner — preserves the legacy "scan an address" behaviour
// without dragging in the shim-based wrapper. Opens a full-screen overlay,
// streams the rear camera into a <video>, and decodes one address before
// stopping.
function QrAddressScanner({ onAddress, disabled }: QrAddressScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const readerRef = useRef<BrowserMultiFormatReader | null>(null);

  const stopScanning = useCallback(() => {
    if (streamRef.current) {
      for (const track of streamRef.current.getTracks()) track.stop();
      streamRef.current = null;
    }
    if (readerRef.current) {
      readerRef.current.reset();
      readerRef.current = null;
    }
    setIsScanning(false);
  }, []);

  const startScanning = useCallback(async () => {
    try {
      setIsScanning(true);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      streamRef.current = stream;
      if (!videoRef.current) return;
      videoRef.current.srcObject = stream;

      const reader = new BrowserMultiFormatReader();
      readerRef.current = reader;
      const result = await reader.decodeOnceFromVideoDevice(
        undefined,
        videoRef.current,
      );
      if (!result) return;

      let scanned = result.getText();
      if (scanned.includes(":")) {
        scanned = scanned.split(":")[1];
      } else if (scanned.includes("http")) {
        try {
          const recipientParam = new URL(scanned).searchParams.get("recipient");
          if (recipientParam) scanned = recipientParam;
        } catch {
          // ignore malformed URL — fall through to address validation
        }
      }

      if (isValidEthereumAddress(scanned)) {
        onAddress(scanned);
        toast.success("Valid address scanned successfully!");
      } else {
        toast.error(
          "Scanned QR code does not contain a valid Ethereum address",
        );
      }
    } catch (error) {
      console.error("QR scanning error:", error);
      if (error instanceof Error) {
        if (error.name === "NotAllowedError") {
          toast.error(
            "Camera permission denied. Please allow camera access to scan QR codes.",
          );
        } else if (error.name === "NotFoundError") {
          toast.error("No camera found on this device.");
        } else {
          toast.error("Failed to scan QR code. Please try again.");
        }
      }
    } finally {
      stopScanning();
    }
  }, [onAddress, stopScanning]);

  return (
    <>
      <Button
        type="button"
        size="icon-sm"
        variant="ghost"
        aria-label="Scan QR code"
        disabled={disabled}
        onClick={() => (isScanning ? stopScanning() : startScanning())}
      >
        <LuQrCode size={20} />
      </Button>

      {isScanning && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-primary-soft">
          <div className="relative aspect-square w-[90%] max-w-[400px] overflow-hidden rounded-lg bg-gray-800">
            {/* biome-ignore lint/a11y/useMediaCaption: QR scanner video doesn't need captions */}
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="h-full w-full object-cover"
            />
            <div className="-translate-x-1/2 -translate-y-1/2 absolute top-1/2 left-1/2 h-[80%] w-[80%] rounded-lg border-2 border-white" />
          </div>
          <div className="mt-4 text-center">
            <Heading variant="h4" className="mb-2">
              Scan QR Code
            </Heading>
            <Button
              type="button"
              variant="danger"
              aria-label="Cancel scanning"
              onClick={stopScanning}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
    </>
  );
}

/**
 * Transaction page — send kuu (ERC20) to a recipient address.
 */
const Transaction: FC = () => {
  const { wallet } = useActiveWallet();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [balance, setBalance] = useState<string>("0");
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const recipientParam = searchParams.get("recipient");
    if (recipientParam) setRecipient(recipientParam);
  }, [searchParams]);

  const fetchERC20Balance = useCallback(async () => {
    if (!wallet) return;
    const [erc20Balance, decimals] = await Promise.all([
      publicClient.readContract({
        address: KUU_CONTRACT_ADDRESS,
        abi: ERC20_ABI,
        functionName: "balanceOf",
        args: [wallet.account?.address as `0x${string}`],
      }),
      publicClient.readContract({
        address: KUU_CONTRACT_ADDRESS,
        abi: ERC20_ABI,
        functionName: "decimals",
      }),
    ]);

    const decimalsNumber = Number(decimals);
    const formattedBalance =
      decimalsNumber > 0
        ? Number(erc20Balance) / 10 ** decimalsNumber
        : Number(erc20Balance);
    setBalance(Math.floor(formattedBalance).toLocaleString());
  }, [wallet]);

  useEffect(() => {
    fetchERC20Balance();
  }, [fetchERC20Balance]);

  const handleTransactionExecution = useCallback(async () => {
    if (!wallet) {
      toast.error("ウォレットを接続してください。");
      return;
    }
    if (!recipient || !amount) {
      toast.error("全ての項目を入力してください。");
      return;
    }

    setIsLoading(true);
    try {
      const decimals = await publicClient.readContract({
        address: KUU_CONTRACT_ADDRESS,
        abi: ERC20_ABI,
        functionName: "decimals",
      });
      const amountWithDecimals =
        BigInt(amount) * BigInt(10 ** Number(decimals));

      const transferTxHash = await wallet.writeContract({
        address: KUU_CONTRACT_ADDRESS,
        abi: ERC20_ABI,
        functionName: "transfer",
        args: [recipient as `0x${string}`, amountWithDecimals],
      });

      await publicClient.waitForTransactionReceipt({ hash: transferTxHash });

      toast.success("トランザクションが正常に実行されました。");
      setRecipient("");
      setAmount("");
      await fetchERC20Balance();
    } catch (error) {
      console.error("Transaction execution error:", error);
      toast.error("エラーが発生しました。");
    }
    setIsLoading(false);
  }, [fetchERC20Balance, wallet, recipient, amount]);

  return (
    <div className="flex min-h-dvh flex-col bg-bg">
      <ScreenHeader title="トランザクション実行" onBack={() => navigate(-1)} />
      <PageContainer className="flex-1 pb-10">
        <section className="mt-2">
          <Typography variant="label" as="span">
            残高
          </Typography>
          <p className="mt-1">
            <span className="font-extrabold text-2xl text-text-primary">
              {balance}
            </span>{" "}
            <span className="text-base text-text-secondary">kuu</span>
          </p>
        </section>

        <section className="mt-6 flex flex-col gap-2">
          <Typography asChild variant="label">
            <label htmlFor="tx-recipient">recipient</label>
          </Typography>
          <div className="flex items-center gap-2">
            <Input
              id="tx-recipient"
              placeholder="Recipient Address"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
            />
            <QrAddressScanner onAddress={setRecipient} />
          </div>
        </section>

        <section className="mt-4 flex flex-col gap-2">
          <Typography asChild variant="label">
            <label htmlFor="tx-amount">amount</label>
          </Typography>
          <Input
            id="tx-amount"
            type="number"
            inputMode="numeric"
            placeholder="Amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </section>

        <Button
          type="button"
          full
          disabled={isLoading}
          onClick={handleTransactionExecution}
          className="mt-8"
        >
          {isLoading ? "実行中…" : "実行"}
        </Button>
      </PageContainer>
    </div>
  );
};

export default Transaction;
