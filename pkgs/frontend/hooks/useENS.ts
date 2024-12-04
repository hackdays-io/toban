import { useCallback, useEffect, useState } from "react";
import { NameData, TextRecords } from "namestone-sdk";
import axios from "axios";

export const useNamesByAddresses = (addresses?: string[]) => {
  const [names, setNames] = useState<NameData[][]>([]);

  useEffect(() => {
    if (!addresses) return;
    fetchNames(addresses);
  }, [addresses]);

  const fetchNames = async (addresses: string[]) => {
    try {
      const { data } = await axios.get("/api/namestone/resolve-names", {
        params: { addresses: addresses.join(",") },
      });
      setNames(data);
      return data as NameData[][];
    } catch (error) {
      console.error(error);
    }
  };

  return { names, fetchNames };
};

export const useAddressesByNames = (names?: string[]) => {
  const [addresses, setAddresses] = useState<NameData[][]>([]);

  const fetchAddresses = useCallback(async (resolveNames: string[]) => {
    try {
      const { data } = await axios.get("/api/namestone/resolve-addresses", {
        params: { names: resolveNames.join(",") },
      });
      setAddresses(data);
      return data as NameData[][];
    } catch (error) {
      console.error(error);
    }
  }, []);

  useEffect(() => {
    if (!names || names.length === 0 || names.includes("")) return;
    fetchAddresses(names);
  }, [names]);

  return { addresses, fetchAddresses };
};

export const useSetName = () => {
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
      } catch (error) {
        console.error(error);
      }
      setIsLoading(false);
    },
    []
  );

  return { setName, isLoading };
};
