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
  // Wallet that registered the workspace ↔ platform binding. Matches the
  // identity worker's `installed_by` column / `installedBy` JSON field.
  installedBy: Address;
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

/**
 * IdentityClient backed by either a Cloudflare service binding (in
 * production / staging Workers) or a plain HTTPS URL (for local dev or
 * tests). Same-account Workers cannot reach each other through
 * workers.dev (Cloudflare error 1042), so production must go through the
 * service binding.
 *
 * The URL hostname when called via a Fetcher binding is irrelevant —
 * Cloudflare's binding intercepts the request and routes it directly to
 * the target Worker. We still construct a URL so the receiving Worker
 * sees a proper Request object with path + query.
 */
class IdentityFetchClient implements IdentityClient {
  constructor(private readonly fetcher: Fetcher | typeof fetch) {}

  private async go(path: string, init?: RequestInit): Promise<Response> {
    // Use a synthetic host since service bindings ignore it.
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
    const res = await this.go(path);
    if (res.status === 404) return null;
    if (!res.ok) {
      throw new Error(
        `identity lookup failed: ${res.status} ${await res.text()}`,
      );
    }
    return (await res.json()) as IdentityRecord;
  }

  async getPlatformLink(
    provider: ProviderId,
    platformId: string,
  ): Promise<PlatformLink | null> {
    const path = `/api/platform-link?provider=${encodeURIComponent(provider)}&platform_id=${encodeURIComponent(platformId)}`;
    const res = await this.go(path);
    if (res.status === 404) return null;
    if (!res.ok) {
      throw new Error(
        `platform-link lookup failed: ${res.status} ${await res.text()}`,
      );
    }
    return (await res.json()) as PlatformLink;
  }

  async upsertPlatformLink(link: PlatformLink): Promise<void> {
    const res = await this.go("/api/platform-link", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(link),
    });
    if (!res.ok) {
      throw new Error(
        `platform-link upsert failed: ${res.status} ${await res.text()}`,
      );
    }
  }
}

export function createIdentityClient(env: Env): IdentityClient {
  return new IdentityFetchClient(env.IDENTITY);
}
