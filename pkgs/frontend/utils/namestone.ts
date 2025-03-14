import NameStone from "namestone-sdk";
import type { NameData } from "namestone-sdk";

// Initialize the NameStone client
export const getNameStoneClient = (apiKey: string): NameStone => {
  return new NameStone(apiKey);
};

// Constants
export const DEFAULT_DOMAIN = "toban.eth";

// Check if a name is already taken
export const isNameTaken = async (
  ns: NameStone,
  domain: string,
  name: string,
): Promise<boolean> => {
  const existingNames = await ns.searchNames({
    domain,
    name,
    exact_match: 1 as unknown as boolean,
  });

  return existingNames.length > 0;
};

// Check if a name exists and is owned by a specific address
export const isNameOwnedBy = async (
  ns: NameStone,
  domain: string,
  name: string,
  address: string,
): Promise<boolean> => {
  const existingNames = await ns.searchNames({
    domain,
    name,
    exact_match: 1 as unknown as boolean,
  });

  return (
    existingNames.length > 0 &&
    existingNames[0].address.toLowerCase() === address.toLowerCase()
  );
};

// Resolve addresses to names
export const resolveNames = async (
  ns: NameStone,
  domain: string,
  addresses: string[],
): Promise<NameData[][]> => {
  return Promise.all(
    addresses.map((address) => ns.getNames({ domain, address })),
  );
};

// Resolve names to addresses
export const resolveAddresses = async (
  ns: NameStone,
  domain: string,
  names: string[],
  exactMatch: boolean,
): Promise<NameData[][]> => {
  return Promise.all(
    names.map((name) =>
      ns.searchNames({
        domain,
        name,
        exact_match: (exactMatch ? 1 : 0) as unknown as boolean,
      }),
    ),
  );
};

// Set a new name
export const setName = async (
  ns: NameStone,
  domain: string,
  name: string,
  address: string,
  textRecords?: Record<string, string>,
): Promise<{ success: boolean }> => {
  await ns.setName({ domain, name, address, text_records: textRecords });
  return { success: true };
};

// Update a name with verification
export const updateNameWithVerification = async (
  ns: NameStone,
  domain: string,
  name: string,
  address: string,
  textRecords?: Record<string, string>,
): Promise<{ success: boolean; verification?: NameData[] }> => {
  // Attempt to set the name
  await ns.setName({
    domain,
    name,
    address,
    text_records: textRecords,
  });

  // Double-check that the name was actually set by querying it back
  const verification = await ns.searchNames({
    domain,
    name,
    exact_match: 1 as unknown as boolean,
  });

  if (
    verification.length === 0 ||
    verification[0].address.toLowerCase() !== address.toLowerCase()
  ) {
    throw new Error("Name update verification failed");
  }

  return { success: true, verification };
};
