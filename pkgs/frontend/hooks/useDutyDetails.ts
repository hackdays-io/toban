import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { useMemo } from "react";
import type { HatsDetailSchama } from "types/hats";
import { ipfs2https } from "utils/ipfs";
import type { Address } from "viem";

export interface DutyOption {
  hatId: Address;
  detailsUri?: string;
  imageUri?: string;
  wearers: Address[];
}

export interface DutyDetail {
  hatId: Address;
  name: string;
  description?: string;
  imageUrl?: string;
}

// Fetch the IPFS-hosted detail blob for each duty hat in `options` and pair it
// with the on-chain `imageUri`. One blob per duty — small enough to fan out,
// large enough that React Query's cache spares us a re-fetch when a wizard
// step navigates back and forth. `fallbackName` is used per-duty when the
// detail blob is unavailable.
export const useDutyDetails = (
  options: DutyOption[],
  fallbackName = "当番",
): DutyDetail[] => {
  const queries = options.map((o) => o.detailsUri);
  const detailResults = useQuery({
    queryKey: ["duty-details-batch", queries.join("|")],
    enabled: options.length > 0,
    staleTime: 1000 * 60 * 60,
    queryFn: async () => {
      const fetched = await Promise.all(
        options.map(async (o) => {
          if (!o.detailsUri) return undefined;
          const url = ipfs2https(o.detailsUri);
          if (!url) return undefined;
          try {
            const { data } = await axios.get<HatsDetailSchama>(url);
            return data;
          } catch (error) {
            console.error("Failed to fetch duty details:", error);
            return undefined;
          }
        }),
      );
      return fetched;
    },
  });
  return useMemo(() => {
    return options.map((o, i): DutyDetail => {
      const data = detailResults.data?.[i];
      return {
        hatId: o.hatId,
        name: data?.data?.name ?? fallbackName,
        description: data?.data?.description,
        imageUrl: ipfs2https(o.imageUri),
      };
    });
  }, [options, detailResults.data, fallbackName]);
};
