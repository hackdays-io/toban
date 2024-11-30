import { useEffect, useState } from "react";
import NameStone, { NameData } from "namestone-sdk";

const ns = new NameStone(import.meta.env.VITE_NAMESTONE_API_KEY);
const domain = "toban.eth";

export const useNamesByAddresses = (addresses: string[]) => {
  const [names, setNames] = useState<NameData[][]>([]);

  useEffect(() => {
    const fetchNames = async () => {
      try {
        const data: NameData[][] = await Promise.all(
          addresses.map((address) => ns.getNames({ domain, address }))
        );
        setNames(data);
      } catch (error) {
        console.error(error);
      }
    };

    fetchNames();
  }, [addresses]);

  return names;
};
