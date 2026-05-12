import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { bytes32ToCid, cidToBytes32 } from "utils/cid";
import { ipfs2httpsJson, ipfsUploadJson } from "utils/ipfs";

export interface QuestMetadata {
  title: string;
  description?: string;
}

const isQuestMetadata = (value: unknown): value is QuestMetadata => {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return typeof v.title === "string";
};

// Read: bytes32 → CID → IPFS → { title, description }
export const useQuestMetadata = (metadataHash?: `0x${string}` | string) => {
  const normalized = metadataHash?.startsWith("0x")
    ? (metadataHash as `0x${string}`)
    : undefined;
  return useQuery({
    queryKey: ["quest-metadata", normalized],
    queryFn: async (): Promise<QuestMetadata | undefined> => {
      if (!normalized) return;
      const cid = bytes32ToCid(normalized);
      const json = await ipfs2httpsJson(`ipfs://${cid}`);
      return isQuestMetadata(json) ? json : undefined;
    },
    enabled: !!normalized,
    staleTime: 1000 * 60 * 60,
  });
};

// Write: { title, description } → IPFS → bytes32 ready for createQuest.
export const useUploadQuestMetadata = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const upload = async (
    metadata: QuestMetadata,
  ): Promise<{ cid: string; metadataHash: `0x${string}` } | null> => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await ipfsUploadJson(metadata);
      const cid = res.cid;
      return { cid, metadataHash: cidToBytes32(cid) };
    } catch (err) {
      setError(err instanceof Error ? err : new Error("upload failed"));
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return { upload, isLoading, error };
};
