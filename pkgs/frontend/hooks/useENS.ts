import {
  type QueryClient,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import axios from "axios";
import type { NameData, TextRecords } from "namestone-sdk";
import { useCallback, useMemo, useState } from "react";
import { useActiveWallet } from "./useWallet";

const NAMES_QUERY_KEY = "namestone-names";
const ADDRESSES_QUERY_KEY = "namestone-addresses";
const NAMES_STALE_TIME = 1000 * 60 * 10;
const NAMES_GC_TIME = 1000 * 60 * 60;

const normalizeAddress = (address: string) => address.toLowerCase();

const syntheticUnresolved = (address: string): NameData[] => [
  { address, name: "", domain: "" },
];

// Preserves the legacy return shape: data entries in input order (with `[]`
// for unresolved addresses) followed by synthetic tail entries so consumers
// that scan the flattened list still see unregistered addresses as
// selectable items.
const buildLegacyShape = (
  addresses: string[],
  map: Record<string, NameData[]>,
): NameData[][] => {
  const byInput = addresses.map((addr) => map[normalizeAddress(addr)] ?? []);
  const tail = addresses
    .filter((addr) => (map[normalizeAddress(addr)] ?? []).length === 0)
    .map(syntheticUnresolved);
  return [...byInput, ...tail];
};

const fetchNamesFromApi = async (
  addresses: string[],
): Promise<NameData[][]> => {
  if (addresses.length === 0) return [];
  const { data } = await axios.get<NameData[][]>(
    "/api/namestone/resolve-names",
    { params: { addresses: addresses.join(",") } },
  );
  return data;
};

const readCachedAddress = (
  queryClient: QueryClient,
  addr: string,
): NameData[] | undefined =>
  queryClient.getQueryData<NameData[]>([NAMES_QUERY_KEY, "addr", addr]);

const writeCachedAddress = (
  queryClient: QueryClient,
  addr: string,
  value: NameData[],
) => {
  queryClient.setQueryData([NAMES_QUERY_KEY, "addr", addr], value);
};

const resolveBatchViaCache = async (
  queryClient: QueryClient,
  addresses: string[],
): Promise<Record<string, NameData[]>> => {
  const result: Record<string, NameData[]> = {};
  const missing: string[] = [];
  for (const addr of addresses) {
    const cached = readCachedAddress(queryClient, addr);
    if (cached) result[addr] = cached;
    else missing.push(addr);
  }
  if (missing.length > 0) {
    const fetched = await fetchNamesFromApi(missing);
    for (const addr of missing) {
      const match = fetched.find((nd) => nd[0]?.address.toLowerCase() === addr);
      const value = match ?? [];
      result[addr] = value;
      writeCachedAddress(queryClient, addr, value);
    }
  }
  return result;
};

export const useActiveWalletIdentity = () => {
  const { wallet } = useActiveWallet();

  const address = useMemo(() => {
    if (!wallet) return [];
    return [wallet.account.address];
  }, [wallet]);
  const { names } = useNamesByAddresses(address);

  const identity = useMemo(() => {
    if (!wallet || !names || names.length === 0) return;
    return names[0][0];
  }, [names, wallet]);

  return { identity };
};

export const useIdentity = (address?: string) => {
  const addressArray = useMemo(() => {
    if (!address) return [];
    return [address];
  }, [address]);
  const { names } = useNamesByAddresses(addressArray);

  const identity = useMemo(() => {
    if (!names || names.length === 0) return;
    return names[0][0];
  }, [names]);

  return { identity };
};

export const useNamesByAddresses = (addresses?: string[]) => {
  const queryClient = useQueryClient();

  const normalized = useMemo(() => {
    if (!addresses) return [];
    return Array.from(new Set(addresses.filter(Boolean).map(normalizeAddress)));
  }, [addresses]);

  const batchKey = useMemo(
    () => [NAMES_QUERY_KEY, "batch", [...normalized].sort().join(",")],
    [normalized],
  );

  const { data: namesByAddress, isLoading } = useQuery({
    queryKey: batchKey,
    queryFn: () => resolveBatchViaCache(queryClient, normalized),
    enabled: normalized.length > 0,
    staleTime: NAMES_STALE_TIME,
    gcTime: NAMES_GC_TIME,
  });

  const names = useMemo<NameData[][]>(() => {
    if (!addresses || addresses.length === 0) return [];
    return buildLegacyShape(addresses, namesByAddress ?? {});
  }, [addresses, namesByAddress]);

  const fetchNames = useCallback(
    async (addrs: string[]) => {
      const normalizedAddrs = Array.from(
        new Set(addrs.filter(Boolean).map(normalizeAddress)),
      );
      if (normalizedAddrs.length === 0) return [];
      const key = [
        NAMES_QUERY_KEY,
        "batch",
        [...normalizedAddrs].sort().join(","),
      ];
      const map = await queryClient.fetchQuery({
        queryKey: key,
        queryFn: () => resolveBatchViaCache(queryClient, normalizedAddrs),
        staleTime: NAMES_STALE_TIME,
      });
      return buildLegacyShape(addrs, map);
    },
    [queryClient],
  );

  return { names, fetchNames, isLoading };
};

const fetchAddressesFromApi = async (
  names: string[],
  exactMatch?: boolean,
): Promise<NameData[][]> => {
  if (names.length === 0) return [];
  const { data } = await axios.get<NameData[][]>(
    "/api/namestone/resolve-addresses",
    { params: { names: names.join(","), exact_match: exactMatch } },
  );
  return data;
};

export const useAddressesByNames = (names?: string[], exactMatch?: boolean) => {
  const queryClient = useQueryClient();

  const normalized = useMemo(() => {
    if (!names) return [];
    return names.filter(Boolean);
  }, [names]);

  const key = useMemo(
    () => [ADDRESSES_QUERY_KEY, !!exactMatch, [...normalized].sort().join(",")],
    [normalized, exactMatch],
  );

  const { data, isLoading } = useQuery({
    queryKey: key,
    queryFn: () => fetchAddressesFromApi(normalized, exactMatch),
    enabled: normalized.length > 0,
    staleTime: NAMES_STALE_TIME,
    gcTime: NAMES_GC_TIME,
  });

  const fetchAddresses = useCallback(
    async (resolveNames: string[]) => {
      const normalizedNames = resolveNames.filter(Boolean);
      if (normalizedNames.length === 0) return;
      const fetchKey = [
        ADDRESSES_QUERY_KEY,
        !!exactMatch,
        [...normalizedNames].sort().join(","),
      ];
      return queryClient.fetchQuery({
        queryKey: fetchKey,
        queryFn: () => fetchAddressesFromApi(normalizedNames, exactMatch),
        staleTime: NAMES_STALE_TIME,
      });
    },
    [queryClient, exactMatch],
  );

  return { addresses: data ?? [], fetchAddresses, isLoading };
};

export const useSetName = () => {
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);

  const setName = useCallback(
    async (params: {
      name: string;
      address?: string;
      text_records?: TextRecords;
    }) => {
      if (!params.address || !params.name) return;
      setIsLoading(true);
      try {
        await axios.post("/api/namestone/set-name", params);
        await queryClient.invalidateQueries({ queryKey: [NAMES_QUERY_KEY] });
        await queryClient.invalidateQueries({
          queryKey: [ADDRESSES_QUERY_KEY],
        });
      } catch (error) {
        setIsLoading(false);
        throw error;
      }
      setIsLoading(false);
    },
    [queryClient],
  );

  return { setName, isLoading };
};

export const useUpdateName = () => {
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);

  const updateName = useCallback(
    async (params: {
      name: string;
      address?: string;
      text_records?: TextRecords;
    }) => {
      if (!params.address || !params.name) {
        throw new Error("Address and name are required");
      }

      setIsLoading(true);
      try {
        const response = await axios.post("/api/namestone/update-name", params);
        console.log("API response:", {
          status: response.status,
          statusText: response.statusText,
          data: response.data,
        });

        if (response.status !== 200) {
          throw new Error(`Failed to update name: ${response.statusText}`);
        }

        await queryClient.invalidateQueries({ queryKey: [NAMES_QUERY_KEY] });
        await queryClient.invalidateQueries({
          queryKey: [ADDRESSES_QUERY_KEY],
        });

        return response.data;
      } catch (error) {
        console.error("Error updating name:", error);
        // Re-throw the error to propagate it to the caller
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [queryClient],
  );

  return { updateName, isLoading };
};
