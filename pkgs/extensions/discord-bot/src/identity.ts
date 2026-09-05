/**
 * HTTP client for the `@toban/identity` Worker.
 *
 * The bot Worker doesn't touch identity D1 tables directly — all
 * `(provider, account_id) -> wallet` lookups and `guild -> tree_id`
 * platform-link writes go through the identity Worker's `/api/*`
 * surface. In production both Workers live on the same Cloudflare
 * account, so the client uses a service binding (env.IDENTITY) rather
 * than the public workers.dev URL (Cloudflare blocks same-account
 * cross-Worker fetches via workers.dev with error 1042).
 *
 * Test code stubs `IdentityClient` directly via the {@link ThxDeps}
 * `identity` field rather than mocking `fetch`, so HTTP plumbing here
 * stays a thin pass-through.
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
  /**
   * 通知の投稿先チャンネル（`platform_links.metadata` の `notify.channelId`
   * 由来）。**読み取り専用**で、GET のときだけ入る。設定は
   * {@link IdentityClient.setNotifyChannelId} を使うこと —
   * {@link IdentityClient.upsertPlatformLink} はこのフィールドを送らない。
   */
  notifyChannelId?: string | null;
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

  /**
   * ギルドの通知チャンネルを読む。未設定なら `null`。
   * platform link 自体が無いときも `null`。
   */
  getNotifyChannelId(
    provider: ProviderId,
    platformId: string,
  ): Promise<string | null>;

  /**
   * ギルドの通知チャンネルを設定する。`null` で解除。
   *
   * identity Worker 側で read-modify-write されるので、`metadata` の他の
   * キー（例: MCP トークンのバージョン）は保たれる。チャンネル ID の
   * snowflake 検証も Worker 側で行われ、不正なら `invalid_channel_id` で
   * 落ちる。platform link が存在しないギルドは `not_found`。
   */
  setNotifyChannelId(
    provider: ProviderId,
    platformId: string,
    channelId: string | null,
  ): Promise<void>;

  /**
   * Single-use claim for an OAuth-install state-JWT `jti`. Resolves
   * `{ ok: true }` on first claim, `{ ok: false, reason: 'already_used' }`
   * on replay. Any other failure (transient D1, auth, network) throws.
   */
  claimInstallStateJti(
    jti: string,
  ): Promise<{ ok: true } | { ok: false; reason: "already_used" }>;
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
  constructor(
    private readonly fetcher: Fetcher | typeof fetch,
    private readonly secrets: {
      writeSecret: string;
      lookupSecret: string;
    },
  ) {}

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
    const res = await this.go(path, {
      headers: { "x-toban-lookup-secret": this.secrets.lookupSecret },
    });
    if (res.status === 404) return null;
    if (!res.ok) {
      throw new Error(
        `identity lookup failed: ${res.status} ${await res.text()}`,
      );
    }
    // The lookup worker returns only `{ wallet }` (plus optional metadata)
    // on the wire — `provider`/`accountId` are not part of the response.
    // Parse to that real shape, then reconstruct the boundary
    // IdentityRecord from the request context instead of lying with a cast.
    const body = (await res.json()) as { wallet: Address };
    return { provider, accountId, wallet: body.wallet };
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
    // `notifyChannelId` は読み取り専用の派生フィールドなので送らない。送ると
    // Worker 側で無視されるだけだが、書き込み経路が 2 本あるように見えるのを
    // 避ける（設定は setNotifyChannelId 一本）。また `metadata` キーを
    // 含めないことで、Worker 側が既存の metadata を保持してくれる。
    const { notifyChannelId: _ignored, ...body } = link;
    const res = await this.go("/api/platform-link", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-toban-platform-link-secret": this.secrets.writeSecret,
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      throw new Error(
        `platform-link upsert failed: ${res.status} ${await res.text()}`,
      );
    }
  }

  async getNotifyChannelId(
    provider: ProviderId,
    platformId: string,
  ): Promise<string | null> {
    const link = await this.getPlatformLink(provider, platformId);
    return link?.notifyChannelId ?? null;
  }

  async setNotifyChannelId(
    provider: ProviderId,
    platformId: string,
    channelId: string | null,
  ): Promise<void> {
    const res = await this.go("/api/platform-link/notify-channel", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-toban-platform-link-secret": this.secrets.writeSecret,
      },
      body: JSON.stringify({ provider, platformId, channelId }),
    });
    if (!res.ok) {
      throw new Error(
        `notify-channel update failed: ${res.status} ${await res.text()}`,
      );
    }
  }

  async claimInstallStateJti(
    jti: string,
  ): Promise<{ ok: true } | { ok: false; reason: "already_used" }> {
    const res = await this.go("/api/install-state/claim-jti", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-toban-platform-link-secret": this.secrets.writeSecret,
      },
      body: JSON.stringify({ jti }),
    });
    if (res.status === 409) return { ok: false, reason: "already_used" };
    if (!res.ok) {
      throw new Error(
        `install-state claim failed: ${res.status} ${await res.text()}`,
      );
    }
    return { ok: true };
  }
}

export function createIdentityClient(env: Env): IdentityClient {
  return new IdentityFetchClient(env.IDENTITY, {
    writeSecret: env.PLATFORM_LINK_WRITE_SECRET,
    lookupSecret: env.LOOKUP_READ_SECRET,
  });
}
