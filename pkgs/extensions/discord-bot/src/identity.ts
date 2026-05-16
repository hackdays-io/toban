/**
 * Interface to the @toban/identity worker.
 *
 * @toban/identity is implemented by a sibling agent (#507) and is not yet
 * present in this worktree. We declare the contract here as a structural
 * interface plus a thin fetch client. When the package is merged we can
 * either:
 *   (a) keep this client (HTTP boundary stays explicit), or
 *   (b) swap to a `type`-only import from `@toban/identity` and use a
 *       direct D1 query helper if/when the packages decide to share a
 *       library entry-point.
 *
 * Test code should stub `IdentityClient` directly rather than mocking
 * `fetch`. Production code should construct a single client per request
 * via {@link createIdentityClient}.
 */
import type { Address } from "viem";
import type { Env } from "./env";

export type ProviderId = "discord" | "github" | "twitter";

export interface IdentityRecord {
  provider: ProviderId;
  accountId: string;
  wallet: Address;
}

export interface PlatformLink {
  provider: ProviderId;
  platformId: string;
  treeId: string;
  adminWallet: Address;
}

export interface IdentityClient {
  /** Resolve `(provider, accountId) -> wallet`, or null if not bound. */
  getIdentity(
    provider: ProviderId,
    accountId: string,
  ): Promise<IdentityRecord | null>;

  /** Resolve a Discord guild -> tree_id binding, or null if not linked. */
  getPlatformLink(
    provider: ProviderId,
    platformId: string,
  ): Promise<PlatformLink | null>;

  /**
   * Bind a Discord guild to a Toban tree. Called from the bot-install
   * OAuth callback after the admin Hat check passes.
   */
  upsertPlatformLink(link: PlatformLink): Promise<void>;
}

class HttpIdentityClient implements IdentityClient {
  constructor(private readonly baseUrl: string) {}

  async getIdentity(
    provider: ProviderId,
    accountId: string,
  ): Promise<IdentityRecord | null> {
    const res = await fetch(
      `${this.baseUrl}/api/lookup?provider=${encodeURIComponent(provider)}&accountId=${encodeURIComponent(accountId)}`,
    );
    if (res.status === 404) return null;
    if (!res.ok) {
      throw new Error(`identity lookup failed: ${res.status}`);
    }
    return (await res.json()) as IdentityRecord;
  }

  async getPlatformLink(
    provider: ProviderId,
    platformId: string,
  ): Promise<PlatformLink | null> {
    const res = await fetch(
      `${this.baseUrl}/api/platform-link?provider=${encodeURIComponent(provider)}&platformId=${encodeURIComponent(platformId)}`,
    );
    if (res.status === 404) return null;
    if (!res.ok) {
      throw new Error(`platform-link lookup failed: ${res.status}`);
    }
    return (await res.json()) as PlatformLink;
  }

  async upsertPlatformLink(link: PlatformLink): Promise<void> {
    const res = await fetch(`${this.baseUrl}/api/platform-link`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(link),
    });
    if (!res.ok) {
      throw new Error(`platform-link upsert failed: ${res.status}`);
    }
  }
}

export function createIdentityClient(env: Env): IdentityClient {
  return new HttpIdentityClient(env.IDENTITY_WORKER_URL);
}
