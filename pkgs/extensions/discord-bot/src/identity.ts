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
}

export interface IdentityClient {
  /** Resolve `(provider, accountId) -> wallet`, or null if not bound. */
  getIdentity(
    provider: ProviderId,
    accountId: string,
  ): Promise<IdentityRecord | null>;

  /**
   * 逆引き: `(provider, wallet) -> identities[]`。
   *
   * 通知処理は subgraph からアドレスしか得られない（「コマンドを実行した人」
   * という文脈が無い）ので、Discord メンションに落とすには逆引きが要る。
   *
   * - 未連携はエラーではなく **空配列**。通知では正常系。
   * - `identities` の PK は `(provider, account_id)` なので 1 ウォレットに
   *   複数アカウントが紐づき得る。配列の先頭が最終更新の新しいものになる。
   * - `wallet` の大文字小文字は identity Worker 側が吸収する。subgraph 由来の
   *   全小文字アドレスをそのまま渡してよい。
   */
  getIdentitiesByWallet(
    provider: ProviderId,
    wallet: string,
  ): Promise<IdentityRecord[]>;

  /**
   * 逆引きのバッチ版。1 回の通知で数十件のアドレスを引くので、1 件ずつ
   * HTTP を叩くと automation の実行時間を食う。
   *
   * 戻り値のキーは **全小文字のアドレス**。subgraph が返すアドレスをそのまま
   * キーに使えるようにするため（checksum 表記でキーにすると、呼び出し側が
   * 毎回 `getAddress()` を通す羽目になる）。
   * 引数に渡した有効なアドレスは、未連携でも空配列のエントリとして必ず入る。
   */
  getIdentitiesByWallets(
    provider: ProviderId,
    wallets: readonly string[],
  ): Promise<Map<string, IdentityRecord[]>>;

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

  async getIdentitiesByWallet(
    provider: ProviderId,
    wallet: string,
  ): Promise<IdentityRecord[]> {
    const path = `/api/lookup/by-wallet?provider=${encodeURIComponent(provider)}&wallet=${encodeURIComponent(wallet)}`;
    const res = await this.go(path, {
      headers: { "x-toban-lookup-secret": this.secrets.lookupSecret },
    });
    if (!res.ok) {
      throw new Error(
        `identity reverse lookup failed: ${res.status} ${await res.text()}`,
      );
    }
    const body = (await res.json()) as {
      wallet: Address;
      identities: Array<{ accountId: string; wallet: Address }>;
    };
    return body.identities.map((i) => ({
      provider,
      accountId: i.accountId,
      wallet: i.wallet,
    }));
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
        "x-toban-lookup-secret": this.secrets.lookupSecret,
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
      headers: {
        "content-type": "application/json",
        "x-toban-platform-link-secret": this.secrets.writeSecret,
      },
      body: JSON.stringify(link),
    });
    if (!res.ok) {
      throw new Error(
        `platform-link upsert failed: ${res.status} ${await res.text()}`,
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
