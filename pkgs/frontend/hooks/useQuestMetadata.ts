import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
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

// Indexed metadata resolved by the subgraph File Data Source (`quest.metadata`).
// Null/undefined until graph-node fetches the IPFS object asynchronously.
export interface IndexedQuestMetadata {
  title?: string | null;
  description?: string | null;
}

// Read with fallback: prefer the subgraph-indexed `quest.metadata` (no network
// round-trip); only resolve the IPFS object via the gateway when the indexer
// hasn't materialized it yet. `metadataUri` is the on-chain `ipfs://<cid>`.
export const useQuestMetadata = (params?: {
  metadataUri?: string | null;
  indexed?: IndexedQuestMetadata | null;
}) => {
  const metadataUri = params?.metadataUri ?? undefined;
  const indexed = params?.indexed ?? undefined;
  const hasIndexed = typeof indexed?.title === "string";
  return useQuery({
    queryKey: ["quest-metadata", metadataUri, hasIndexed],
    // React Query v5 disallows `undefined` from queryFn (it can't distinguish
    // "no data yet" from "fetched nothing"). Return `null` for the gateway
    // failure / wrong-shape paths so the consumer can still render a fallback.
    queryFn: async (): Promise<QuestMetadata | null> => {
      if (indexed && typeof indexed.title === "string") {
        return {
          title: indexed.title,
          description: indexed.description ?? undefined,
        };
      }
      if (!metadataUri) return null;
      const json = await ipfs2httpsJson(metadataUri);
      return isQuestMetadata(json) ? json : null;
    },
    enabled: hasIndexed || !!metadataUri,
    staleTime: 1000 * 60 * 60,
  });
};

// Write: { title, description } → IPFS → `ipfs://<cid>` ready for createQuest.
export const useUploadQuestMetadata = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const upload = async (
    metadata: QuestMetadata,
  ): Promise<{ cid: string; ipfsUri: string } | null> => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await ipfsUploadJson(metadata);
      const cid = res.cid;
      return { cid, ipfsUri: `ipfs://${cid}` };
    } catch (err) {
      setError(err instanceof Error ? err : new Error("upload failed"));
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return { upload, isLoading, error };
};
