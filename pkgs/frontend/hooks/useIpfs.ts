import { useState } from "react";
import { PinataSDK } from "pinata-web3";
import { Readable } from "stream";

export const useUploadMetadataToIpfs = () => {
  const [isLoading, setIsLoading] = useState(false);

  const uploadMetadataToIpfs = async ({
    name,
    description,
    responsibilities,
    authorities,
    eligibility,
    toggle,
  }: {
    name: string;
    description: string;
    responsibilities: string;
    authorities: string;
    eligibility: boolean;
    toggle: boolean;
  }) => {
    setIsLoading(true);

    try {
      const pinata = new PinataSDK({ pinataJwt: process.env.VITE_PINATA_JWT });

      const upload = await pinata.upload.json({
        type: "1.0",
        data: {
          name,
          description,
          responsibilities,
          authorities,
          eligibility,
          toggle,
        },
      });

      console.log("CID:", upload.IpfsHash);
      console.log("URI:", `ipfs://${upload.IpfsHash}`);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return { uploadMetadataToIpfs, isLoading };
};

export const useUploadImageToIpfs = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);

  const uploadImageToIpfs = async () => {
    if (!imageFile) return;

    setIsLoading(true);

    try {
      const pinata = new PinataSDK({ pinataJwt: process.env.VITE_PINATA_JWT });

      const buffer = await imageFile.arrayBuffer();
      const stream = Readable.from(Buffer.from(buffer));

      const upload = await pinata.upload.stream(stream, {
        metadata: { name: `TobanFrontend_${new Date().getTime()}` },
      });

      console.log("CID:", upload.IpfsHash);
      console.log("URI:", `ipfs://${upload.IpfsHash}`);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return { uploadImageToIpfs, setImageFile, isLoading };
};
