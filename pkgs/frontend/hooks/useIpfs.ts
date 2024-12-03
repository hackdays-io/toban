import { useState } from "react";
import { ipfsUploadJson, ipfsUploadFile } from "utils/ipfs";

export const useUploadMetadataToIpfs = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

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
  }): Promise<{ ipfsCid: string; ipfsUri: string } | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const upload = await ipfsUploadJson({
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

      const ipfsCid = upload.IpfsHash;
      const ipfsUri = `ipfs://${ipfsCid}`;

      console.log("Successfully uploaded metadata to IPFS");
      console.log("IPFS CID:", ipfsCid);
      console.log("IPFS URI:", ipfsUri);

      return { ipfsCid, ipfsUri };
    } catch (err) {
      setError(
        err instanceof Error ? err : new Error("Unknown error occurred")
      );
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return { uploadMetadataToIpfs, isLoading, error };
};

export const useUploadImageFileToIpfs = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [error, setError] = useState<Error | null>(null);

  const uploadImageFileToIpfs = async (): Promise<{
    ipfsCid: string;
    ipfsUri: string;
  } | null> => {
    if (!imageFile || !imageFile.type.startsWith("image/")) {
      setError(new Error("Invalid or no image file selected"));
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      const upload = await ipfsUploadFile(imageFile);

      const ipfsCid = upload.IpfsHash;
      const ipfsUri = `ipfs://${ipfsCid}`;

      console.log("Successfully uploaded image file to IPFS");
      console.log("IPFS CID:", ipfsCid);
      console.log("IPFS URI:", ipfsUri);

      return { ipfsCid, ipfsUri };
    } catch (err) {
      setError(
        err instanceof Error ? err : new Error("Unknown error occurred")
      );
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return { uploadImageFileToIpfs, imageFile, setImageFile, isLoading, error };
};
