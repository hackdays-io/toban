import { isAddress } from "viem";
import type { IdentityEnv } from "../providers/types.js";
import {
  type IdentityDb,
  getIdentitiesByWallet,
  getIdentitiesByWallets,
  normalizeWallet,
} from "../queries.js";
import type { Identity } from "../schema.js";

export type LookupByWalletHandlerDeps = {
  db: IdentityDb;
  env: IdentityEnv;
};

/**
 * 1 リクエストで引けるアドレスの上限。通知 1 回あたりは数十件の想定なので
 * 十分な余裕がある。上限を設けるのは、逆引きが列挙に弱い（後述）ため
 * 1 リクエストあたりのコストを抑えたいから。
 */
export const MAX_WALLETS_PER_BATCH = 200;

/** レスポンス上の identity 1 件。`wallet` は常に checksum 表記。 */
export type IdentityByWalletItem = {
  provider: string;
  accountId: string;
  wallet: string;
  updatedAt: number;
  metadata?: unknown;
};

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function serialize(row: Identity): IdentityByWalletItem {
  let metadata: unknown;
  if (row.metadata !== null && row.metadata !== undefined) {
    try {
      metadata = JSON.parse(row.metadata);
    } catch {
      metadata = row.metadata;
    }
  }
  const base = {
    provider: row.provider,
    accountId: row.accountId,
    wallet: row.wallet,
    updatedAt: row.updatedAt,
  };
  return metadata === undefined ? base : { ...base, metadata };
}

/**
 * 同じウォレットに複数アカウントが紐づく場合の並び順を決めておく。
 * 「最新の 1 件だけ使う」呼び出し元が `[0]` を取れるよう、更新が新しい順。
 * 同時刻は accountId の昇順で決定的にする（テストを安定させるため）。
 */
function sortItems(items: IdentityByWalletItem[]): IdentityByWalletItem[] {
  return items.sort((a, b) =>
    b.updatedAt !== a.updatedAt
      ? b.updatedAt - a.updatedAt
      : a.accountId < b.accountId
        ? -1
        : a.accountId > b.accountId
          ? 1
          : 0,
  );
}

/**
 * 逆引きは **server-to-server 専用**。
 *
 * 順方向 `/api/lookup` は 2 モード認証（共有シークレット + ブラウザが持つ
 * verifier_token JWT）だが、逆引きに verifier_token を許してはいけない。
 * verifier_token は「その snowflake の持ち主である」ことしか証明せず、
 * 逆引きの入力はアドレスなので、JWT の accountId と引数を突き合わせて
 * 自分自身に限定する、という順方向の絞り込みが成立しない。
 * 「アドレスを知っていれば誰と紐づくか分かる」= 順方向より情報が漏れやすいので、
 * 共有シークレットを持つ Worker からのみ叩けるようにする。
 *
 * また順方向と違い、`LOOKUP_READ_SECRET` 未設定時のフォールバックも無い。
 * 未設定ならエンドポイントごと閉じる（401）。
 */
function isAuthorized(request: Request, env: IdentityEnv): boolean {
  const sharedSecret = env.LOOKUP_READ_SECRET;
  if (!sharedSecret) return false;
  return request.headers.get("x-toban-lookup-secret") === sharedSecret;
}

/**
 * `GET /api/lookup/by-wallet?provider=discord&wallet=0x...`
 * `POST /api/lookup/by-wallet  { provider, wallets: [...] }`
 *
 * ウォレットアドレス → Web2 アカウントの逆引き。通知 automation が
 * subgraph から得たアドレスを Discord メンションに変換するために使う。
 *
 * - 見つからない場合も **200 + 空配列**。通知処理では「未連携」は正常系なので、
 *   404 にすると呼び出し側がエラーハンドリングを強いられる。
 * - 1 ウォレットに複数アカウントが紐づき得る（`identities` の PK は
 *   `(provider, account_id)`）ので、常に配列で返す。
 * - アドレスの大文字小文字は `normalizeWallet()` が吸収する。
 *   小文字（subgraph 由来）でも checksum でも引ける。詳細は `queries.ts` を参照。
 *
 * GET レスポンス:  `{ wallet, identities: [...] }`
 * POST レスポンス: `{ results: [{ wallet, identities: [...] }], invalid: [...] }`
 *   `results` は **リクエストで渡した有効なアドレス全件** を含む（未連携は
 *   `identities: []`）。`invalid` はアドレスとして解釈できなかった入力。
 */
export async function handleLookupByWallet(
  request: Request,
  deps: LookupByWalletHandlerDeps,
): Promise<Response> {
  if (request.method !== "GET" && request.method !== "POST") {
    return json(405, { error: "method_not_allowed" });
  }

  if (!isAuthorized(request, deps.env)) {
    return json(401, { error: "unauthorized" });
  }

  return request.method === "GET"
    ? handleSingle(request, deps)
    : handleBatch(request, deps);
}

async function handleSingle(
  request: Request,
  deps: LookupByWalletHandlerDeps,
): Promise<Response> {
  const url = new URL(request.url);
  const provider = url.searchParams.get("provider");
  const wallet = url.searchParams.get("wallet");
  if (!provider || !wallet) {
    return json(400, {
      error: "invalid_query",
      details: "provider and wallet are required",
    });
  }
  if (!isAddress(wallet, { strict: false })) {
    return json(400, {
      error: "invalid_wallet",
      details: `not an EVM address: ${wallet}`,
    });
  }

  const rows = await getIdentitiesByWallet(deps.db, provider, wallet);
  return json(200, {
    wallet: normalizeWallet(wallet),
    identities: sortItems(rows.map(serialize)),
  });
}

async function handleBatch(
  request: Request,
  deps: LookupByWalletHandlerDeps,
): Promise<Response> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json(400, { error: "invalid_body", details: "body is not JSON" });
  }
  if (typeof body !== "object" || body === null) {
    return json(400, {
      error: "invalid_body",
      details: "body is not an object",
    });
  }

  const { provider, wallets } = body as {
    provider?: unknown;
    wallets?: unknown;
  };
  if (typeof provider !== "string" || provider.length === 0) {
    return json(400, {
      error: "invalid_body",
      details: "provider is required",
    });
  }
  if (!Array.isArray(wallets)) {
    return json(400, {
      error: "invalid_body",
      details: "wallets must be an array",
    });
  }
  if (wallets.length > MAX_WALLETS_PER_BATCH) {
    return json(400, {
      error: "too_many_wallets",
      details: `at most ${MAX_WALLETS_PER_BATCH} wallets per request`,
    });
  }

  // アドレスとして壊れている入力があってもバッチ全体を落とさない。
  // 通知処理は 1 回の実行で数十件を引くので、1 件の異常でバッチ全体が
  // 400 になると通知が丸ごと止まってしまう。壊れた入力は `invalid` で返し、
  // 呼び出し元がログに出せるようにする。
  const valid: string[] = [];
  const invalid: unknown[] = [];
  for (const w of wallets) {
    if (typeof w === "string" && isAddress(w, { strict: false })) {
      valid.push(w);
    } else {
      invalid.push(w);
    }
  }

  const rows =
    valid.length === 0
      ? []
      : await getIdentitiesByWallets(deps.db, provider, valid);

  // checksum 表記をキーにグルーピング。DB の行も引数も同じ正規形なので一致する。
  const byWallet = new Map<string, IdentityByWalletItem[]>();
  for (const wallet of valid) {
    const key = normalizeWallet(wallet);
    if (!byWallet.has(key)) byWallet.set(key, []);
  }
  for (const row of rows) {
    const bucket = byWallet.get(row.wallet);
    if (bucket) bucket.push(serialize(row));
  }

  return json(200, {
    results: [...byWallet.entries()].map(([wallet, items]) => ({
      wallet,
      identities: sortItems(items),
    })),
    invalid,
  });
}
