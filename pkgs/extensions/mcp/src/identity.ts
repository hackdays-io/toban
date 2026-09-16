/**
 * HTTP client for the `@toban/identity` Worker — read-only subset.
 *
 * `@toban/mcp` never writes an identity table (no `upsertPlatformLink`, no
 * notify-channel setter): the invariant "nothing bypasses the identity HTTP
 * boundary" applies here the same as in discord-bot, but this package's
 * surface is smaller because it has no install flow of its own. See
 * `docs/mcp-extraction.md` §6 for why `getIdentity` /
 * `getIdentitiesByWallets` must only ever be called for the token's home
 * `treeId` — that restriction lives in `tools.ts`, not here; this client is
 * a plain transport and enforces nothing about which tree is asking.
 */
import type { Address } from "viem";
import type { Env } from "./env.js";

export type ProviderId = "discord" | "github" | "twitter";

export interface IdentityRecord {
  provider: ProviderId;
  accountId: string;
  wallet: Address;
}

export interface IdentityClient {
  /** Resolve `(provider, accountId) -> wallet`, or null if not bound. */
  getIdentity(
    provider: ProviderId,
    accountId: string,
  ): Promise<IdentityRecord | null>;

  /**
   * Batch reverse lookup: `wallet -> identities[]`. Keys in the returned map
   * are lowercased addresses. A wallet with no binding maps to an empty
   * array, not an absent key.
   */
  getIdentitiesByWallets(
    provider: ProviderId,
    wallets: readonly string[],
  ): Promise<Map<string, IdentityRecord[]>>;
}

class IdentityFetchClient implements IdentityClient {
  constructor(
    private readonly fetcher: Fetcher | typeof fetch,
    private readonly lookupSecret: string,
  ) {}

  private async go(path: string, init?: RequestInit): Promise<Response> {
    // Synthetic host: service bindings ignore it, and this matches the
    // convention discord-bot's IdentityFetchClient already uses.
    const url = `https://identity.toban.internal${path}`;
    if (typeof this.fetcher === "function") {
      return this.fetcher(url, init);
    }
    return this.fetcher.fetch(url, init);
  }

  async getIdentity(
    provider: ProviderId,
    accountId: string,
  ): Promise<IdentityRecord | null> {
    const path = `/api/lookup?provider=${encodeURIComponent(provider)}&account_id=${encodeURIComponent(accountId)}`;
    const res = await this.go(path, {
      headers: { "x-toban-lookup-secret": this.lookupSecret },
    });
    if (res.status === 404) return null;
    if (!res.ok) {
      throw new Error(
        `identity lookup failed: ${res.status} ${await res.text()}`,
      );
    }
    const body = (await res.json()) as { wallet: Address };
    return { provider, accountId, wallet: body.wallet };
  }

  async getIdentitiesByWallets(
    provider: ProviderId,
    wallets: readonly string[],
  ): Promise<Map<string, IdentityRecord[]>> {
    const out = new Map<string, IdentityRecord[]>();
    if (wallets.length === 0) return out;

    const res = await this.go("/api/lookup/by-wallet", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-toban-lookup-secret": this.lookupSecret,
      },
      body: JSON.stringify({ provider, wallets }),
    });
    if (!res.ok) {
      throw new Error(
        `identity reverse lookup (batch) failed: ${res.status} ${await res.text()}`,
      );
    }
    const body = (await res.json()) as {
      results: Array<{
        wallet: Address;
        identities: Array<{ accountId: string; wallet: Address }>;
      }>;
    };
    for (const r of body.results) {
      out.set(
        r.wallet.toLowerCase(),
        r.identities.map((i) => ({
          provider,
          accountId: i.accountId,
          wallet: i.wallet,
        })),
      );
    }
    return out;
  }
}

export function createIdentityClient(env: Env): IdentityClient {
  return new IdentityFetchClient(env.IDENTITY, env.LOOKUP_READ_SECRET);
}
