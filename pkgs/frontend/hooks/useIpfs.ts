import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import type { HatsDetailSchama, HatsDetailsData } from "types/hats";
import { ipfs2httpsJson, ipfsUploadFile, ipfsUploadJson } from "utils/ipfs";

export const useUploadMetadataToIpfs = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const uploadMetadataToIpfs = async (
    metadata: object,
  ): Promise<{ ipfsCid: string; ipfsUri: string } | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const upload = await ipfsUploadJson(metadata);

      const ipfsCid = upload.cid;
      const ipfsUri = `ipfs://${ipfsCid}`;

      return { ipfsCid, ipfsUri };
    } catch (err) {
      setError(
        err instanceof Error ? err : new Error("Unknown error occurred"),
      );
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return { uploadMetadataToIpfs, isLoading, error };
};

export const useUploadHatsDetailsToIpfs = () => {
  const { uploadMetadataToIpfs, isLoading, error } = useUploadMetadataToIpfs();

  const uploadHatsDetailsToIpfs = async ({
    name,
    description,
    responsabilities,
    authorities,
  }: HatsDetailsData): Promise<{ ipfsCid: string; ipfsUri: string } | null> => {
    const details: HatsDetailSchama = {
      type: "1.0",
      data: {
        name,
        description,
        responsabilities,
        authorities,
      },
    };

    const res = await uploadMetadataToIpfs(details);

    return res;
  };

  return { uploadHatsDetailsToIpfs, isLoading, error };
};

export const useUploadImageFileToIpfs = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);

  const uploadImageFileToIpfs = async (fileToUpload?: File) => {
    const fileToUse = fileToUpload || imageFile;

    if (!fileToUse) return null;
    if (!fileToUse?.type.startsWith("image/")) {
      setError(new Error("Invalid or no image file selected"));
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      const upload = await ipfsUploadFile(fileToUse);

      const ipfsCid = upload.cid;
      const ipfsUri = `ipfs://${ipfsCid}`;

      return { ipfsCid, ipfsUri };
    } catch (err) {
      setError(
        err instanceof Error ? err : new Error("Unknown error occurred"),
      );
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return { uploadImageFileToIpfs, isLoading, error, imageFile, setImageFile };
};

export const useQueryIpfsJsonData = (cid?: string) => {
  const res = useQuery({
    queryKey: ["ipfs", cid],
    queryFn: () => ipfs2httpsJson(cid),
    staleTime: 1000 * 60 * 60,
  });

  return res;
};
