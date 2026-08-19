import {
  ChainName,
  type OffchainClient,
  type SubnameDTO,
  SubnameNotFoundError,
  createOffchainClient,
  getCoinType,
} from "@thenamespace/offchain-manager";
import axios from "axios";
import type { NameData } from "types/ens";
import type { NameProvider, UpsertNameParams } from "./provider";

const ETH_COIN_TYPE = String(getCoinType(ChainName.Ethereum));

/** Namespace caps `size` at 100. Toban never has more than a handful per owner. */
const PAGE_SIZE = 100;

export interface NamespaceProviderOptions {
  client: OffchainClient;
  /** Parent domain that owns every subname, e.g. `toban.eth`. */
  parentName: string;
}

const isNotFound = (error: unknown): boolean => {
  if (error instanceof SubnameNotFoundError) return true;
  return axios.isAxiosError(error) && error.response?.status === 404;
};

/**
 * Namespace-backed implementation of {@link NameProvider}.
 *
 * Three quirks of `@thenamespace/offchain-manager@1.0.13` shape this file:
 *
 * 1. **Writes only ever go through `createSubname`.** `POST /subnames` is an
 *    upsert, and every other write helper (`updateSubname`, `addTextRecord`,
 *    `setDefaultEvmAddress`, …) rebuilds the record without `owner`, silently
 *    wiping ownership. Sending the full record each time is the only safe path.
 * 2. **`getSingleSubname` does not return `null` on 404.** Its 404 handler sits
 *    in a `try` around a *returned* (un-awaited) promise, so the rejection
 *    escapes. We catch it here instead.
 * 3. **`getFilteredSubnames` discards the key mapping it builds** and posts the
 *    raw query, so the OpenAPI keys (`parentName`, `owner`, `page`, `size`,
 *    `labelSearch`) are the ones that actually take effect.
 */
export class NamespaceProvider implements NameProvider {
  private readonly client: OffchainClient;
  private readonly parentName: string;

  constructor({ client, parentName }: NamespaceProviderOptions) {
    this.client = client;
    this.parentName = parentName;
  }

  private fullName(label: string): string {
    return `${label}.${this.parentName}`;
  }

  /**
   * Prefer deriving the label from `fullName` over trusting `dto.label`:
   * Toban registers dotted labels for splits (`foo.split.toban.eth`) and the
   * API is free to split those into `label: "foo"` / `parentName:
   * "split.toban.eth"`, which would truncate the name Toban stored.
   */
  private toNameData = (dto: SubnameDTO): NameData => {
    const suffix = `.${this.parentName}`;
    const name = dto.fullName?.endsWith(suffix)
      ? dto.fullName.slice(0, -suffix.length)
      : dto.label;

    return {
      name,
      address: dto.addresses?.[ETH_COIN_TYPE] ?? dto.owner ?? "",
      domain: this.parentName,
      text_records: dto.texts ?? {},
    };
  };

  async resolveByAddresses(addresses: string[]): Promise<NameData[][]> {
    return Promise.all(
      addresses.map(async (address) => {
        const owner = address.toLowerCase();
        const page = await this.client.getFilteredSubnames({
          parentName: this.parentName,
          owner,
          page: 1,
          size: PAGE_SIZE,
        });
        // The owner filter is server-side, but it is an opaque string match —
        // re-check locally so a case mismatch can never leak someone else's
        // profile into another address's slot.
        return (page?.items ?? [])
          .filter((dto) => (dto.owner ?? "").toLowerCase() === owner)
          .map(this.toNameData);
      }),
    );
  }

  async resolveByName(name: string, exactMatch: boolean): Promise<NameData[]> {
    if (exactMatch) {
      const dto = await this.getSubnameOrNull(name);
      return dto ? [this.toNameData(dto)] : [];
    }

    const page = await this.client.getFilteredSubnames({
      parentName: this.parentName,
      labelSearch: name,
      page: 1,
      size: PAGE_SIZE,
    });
    return (page?.items ?? []).map(this.toNameData);
  }

  async isAvailable(name: string): Promise<boolean> {
    const { isAvailable } = await this.client.isSubnameAvailable(
      this.fullName(name),
    );
    return isAvailable;
  }

  async upsert({
    name,
    address,
    text_records,
  }: UpsertNameParams): Promise<void> {
    const owner = address.toLowerCase();
    // `POST /subnames` replaces the whole record, so an omitted key is a
    // deletion. Dropping empty values is what lets a user clear their bio.
    const texts = Object.entries(text_records ?? {})
      .filter(([, value]) => typeof value === "string" && value !== "")
      .map(([key, value]) => ({ key, value }));

    await this.client.createSubname({
      parentName: this.parentName,
      label: name,
      owner,
      addresses: [{ chain: ChainName.Ethereum, value: owner }],
      texts,
    });
  }

  async delete(name: string): Promise<void> {
    try {
      await this.client.deleteSubname(this.fullName(name));
    } catch (error) {
      // Deleting an already-absent name is the state the caller wanted.
      if (!isNotFound(error)) throw error;
    }
  }

  private async getSubnameOrNull(name: string): Promise<SubnameDTO | null> {
    try {
      return await this.client.getSingleSubname(this.fullName(name));
    } catch (error) {
      if (isNotFound(error)) return null;
      throw error;
    }
  }
}

export interface CreateNamespaceProviderConfig {
  apiKey: string;
  parentName: string;
  mode: "mainnet" | "sepolia";
  timeoutMs: number;
}

export const createNamespaceProvider = ({
  apiKey,
  parentName,
  mode,
  timeoutMs,
}: CreateNamespaceProviderConfig): NamespaceProvider => {
  const client = createOffchainClient({
    mode,
    // NameStone's outage hung every request until the platform killed the
    // function (#555). An explicit timeout keeps a dead upstream cheap.
    timeout: timeoutMs,
    defaultApiKey: apiKey,
    domainApiKeys: { [parentName]: apiKey },
  });

  return new NamespaceProvider({ client, parentName });
};
