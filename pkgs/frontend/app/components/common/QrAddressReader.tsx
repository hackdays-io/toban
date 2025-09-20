import { Box, IconButton } from "@chakra-ui/react";
import { BrowserMultiFormatReader } from "@zxing/library";
import { type FC, useCallback, useRef, useState } from "react";
import { MdQrCodeScanner } from "react-icons/md";
import { toast } from "react-toastify";
import CommonButton from "./CommonButton";

interface QrAddressReaderProps {
  onReadValidAddress: (address: string) => void;
  disabled?: boolean;
  size?: "xs" | "sm" | "md" | "lg";
  colorScheme?: string;
  title?: string;
}

/**
 * Validates if a string is a valid Ethereum address
 * @param address - The address string to validate
 * @returns boolean indicating if the address is valid
 */
const isValidEthereumAddress = (address: string): boolean => {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
};

/**
 * QrAddressReader Component
 * A reusable QR code scanner component that validates Ethereum addresses
 * and calls a callback when a valid address is scanned
 */
export const QrAddressReader: FC<QrAddressReaderProps> = ({
  onReadValidAddress,
  disabled = false,
  size = "sm",
  colorScheme = "gray",
  title = "Scan QR code",
}) => {
  const [isScanning, setIsScanning] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const readerRef = useRef<BrowserMultiFormatReader | null>(null);

  /**
   * Stops the camera stream and cleans up resources
   */
  const stopScanning = useCallback(() => {
    if (streamRef.current) {
      for (const track of streamRef.current.getTracks()) {
        track.stop();
      }
      streamRef.current = null;
    }
    if (readerRef.current) {
      readerRef.current.reset();
    }
    setIsScanning(false);
  }, []);

  /**
   * Starts the QR code scanning process
   */
  const startScanning = useCallback(async () => {
    try {
      setIsScanning(true);

      // Request camera permission
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" }, // Use back camera if available
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;

        // Initialize QR code reader
        const codeReader = new BrowserMultiFormatReader();
        readerRef.current = codeReader;

        // Start decoding
        const result = await codeReader.decodeOnceFromVideoDevice(
          undefined,
          videoRef.current,
        );

        if (result) {
          const scannedText = result.getText();

          // Validate if it's a valid Ethereum address
          if (isValidEthereumAddress(scannedText)) {
            onReadValidAddress(scannedText);
            toast.success("Valid address scanned successfully!");
          } else {
            toast.error(
              "Scanned QR code does not contain a valid Ethereum address",
            );
          }
        }
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
  }, [onReadValidAddress, stopScanning]);

  /**
   * Handles the QR scan button click
   */
  const handleScanClick = useCallback(() => {
    if (disabled) return;

    if (isScanning) {
      stopScanning();
    } else {
      startScanning();
    }
  }, [disabled, isScanning, startScanning, stopScanning]);

  return (
    <>
      <IconButton
        aria-label="Scan QR code"
        size={size}
        colorScheme={isScanning ? "red" : colorScheme}
        onClick={handleScanClick}
        disabled={disabled}
        title={isScanning ? "Stop scanning" : title}
        variant="ghost"
      >
        <MdQrCodeScanner />
      </IconButton>

      {/* Camera scanning overlay */}
      {isScanning && (
        <Box
          position="fixed"
          top="0"
          left="0"
          right="0"
          bottom="0"
          bg="yellow.100"
          zIndex="modal"
          display="flex"
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
        >
          <Box
            position="relative"
            width="90%"
            maxWidth="400px"
            aspectRatio="1"
            bg="gray.800"
            borderRadius="lg"
            overflow="hidden"
          >
            {/* biome-ignore lint/a11y/useMediaCaption: QR scanner video doesn't need captions */}
            <video
              ref={videoRef}
              autoPlay
              playsInline
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
              }}
            />

            {/* Scanning overlay */}
            <Box
              position="absolute"
              top="50%"
              left="50%"
              transform="translate(-50%, -50%)"
              width="80%"
              height="80%"
              border="2px solid white"
              borderRadius="lg"
              _before={{
                content: '""',
                position: "absolute",
                top: "-2px",
                left: "-2px",
                right: "-2px",
                bottom: "-2px",
                border: "2px solid rgba(255, 255, 255, 0.3)",
                borderRadius: "lg",
                animation: "pulse 2s infinite",
              }}
            />
          </Box>

          <Box mt={4} textAlign="center">
            <Box fontSize="lg" fontWeight="bold" mb={2}>
              Scan QR Code
            </Box>
            <CommonButton
              aria-label="Cancel scanning"
              colorScheme="red"
              onClick={stopScanning}
            >
              Cancel
            </CommonButton>
          </Box>
        </Box>
      )}
    </>
  );
};
