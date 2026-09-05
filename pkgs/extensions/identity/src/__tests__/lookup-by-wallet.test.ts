import { getAddress } from "viem";
import { describe, expect, it } from "vitest";
import {
  MAX_WALLETS_PER_BATCH,
  handleLookupByWallet,
} from "../handlers/lookup-by-wallet.js";
import type { IdentityEnv } from "../providers/types.js";
import { type IdentityDb, upsertIdentity } from "../queries.js";
import { makeTestDb } from "./fixtures.js";

const TEST_SECRET = "test-lookup-secret-1234";
const baseEnv: IdentityEnv = { LOOKUP_READ_SECRET: TEST_SECRET };

/**
 * 保存されている形（checksum, mixed-case）と、subgraph が返す形（全小文字）。
 * この 2 つが噛み合わないのが本エンドポイントの一番の罠なので、
 * テストでは常に両方を明示的に持ち回る。
 */
const WALLET_CHECKSUM = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8";
const WALLET_LOWER = WALLET_CHECKSUM.toLowerCase();
const OTHER_CHECKSUM = "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC";
const OTHER_LOWER = OTHER_CHECKSUM.toLowerCase();
const UNLINKED_LOWER = "0x90f79bf6eb2c4f870365e785982e1f101e93b906";

function getRequest(query: string, headers?: HeadersInit): Request {
  return new Request(`https://example.test/api/lookup/by-wallet?${query}`, {
    headers: headers ?? { "x-toban-lookup-secret": TEST_SECRET },
  });
}

function postRequest(body: unknown, headers?: HeadersInit): Request {
  return new Request("https://example.test/api/lookup/by-wallet", {
    method: "POST",
    headers: headers ?? {
      "content-type": "application/json",
      "x-toban-lookup-secret": TEST_SECRET,
    },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

type ResponseItem = {
  provider: string;
  accountId: string;
  wallet: string;
  updatedAt: number;
  metadata?: unknown;
};

async function seed(
  db: IdentityDb,
  rows: Array<{
    accountId: string;
    wallet: string;
    provider?: string;
    metadata?: string | null;
    updatedAt?: number;
  }>,
): Promise<void> {
  const now = Math.floor(Date.now() / 1000);
  for (const r of rows) {
    await upsertIdentity(db, {
      provider: r.provider ?? "discord",
      accountId: r.accountId,
      wallet: r.wallet,
      metadata: r.metadata ?? null,
      createdAt: now,
      updatedAt: r.updatedAt ?? now,
    });
  }
}

describe("handlers/lookup-by-wallet — GET（単体）", () => {
  it("subgraph 由来の小文字アドレスで、checksum 保存された行を引ける", async () => {
    const { db } = makeTestDb();
    // 保存側は connect ハンドラと同じく checksum 表記。
    await seed(db, [{ accountId: "100", wallet: WALLET_CHECKSUM }]);

    const res = await handleLookupByWallet(
      getRequest(`provider=discord&wallet=${WALLET_LOWER}`),
      { db, env: baseEnv },
    );

    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      wallet: string;
      identities: ResponseItem[];
    };
    // レスポンスの wallet は常に checksum 正規形に寄る。
    expect(body.wallet).toBe(WALLET_CHECKSUM);
    expect(body.identities).toHaveLength(1);
    expect(body.identities[0]?.accountId).toBe("100");
    expect(body.identities[0]?.wallet).toBe(WALLET_CHECKSUM);
  });

  it("checksum 表記でも引ける", async () => {
    const { db } = makeTestDb();
    await seed(db, [{ accountId: "100", wallet: WALLET_CHECKSUM }]);
    const res = await handleLookupByWallet(
      getRequest(`provider=discord&wallet=${WALLET_CHECKSUM}`),
      { db, env: baseEnv },
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as { identities: ResponseItem[] };
    expect(body.identities).toHaveLength(1);
  });

  it("大文字小文字が壊れた表記（全大文字 hex）でも引ける", async () => {
    const { db } = makeTestDb();
    await seed(db, [{ accountId: "100", wallet: WALLET_CHECKSUM }]);
    const shouty = `0x${WALLET_LOWER.slice(2).toUpperCase()}`;
    const res = await handleLookupByWallet(
      getRequest(`provider=discord&wallet=${shouty}`),
      { db, env: baseEnv },
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as { identities: ResponseItem[] };
    expect(body.identities).toHaveLength(1);
  });

  it("小文字で保存されてしまった行は、checksum 正規形では引けない（保存側の正規化が前提であることの明示）", async () => {
    const { db } = makeTestDb();
    await seed(db, [{ accountId: "100", wallet: WALLET_LOWER }]);
    const res = await handleLookupByWallet(
      getRequest(`provider=discord&wallet=${WALLET_LOWER}`),
      { db, env: baseEnv },
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as { identities: ResponseItem[] };
    // connect ハンドラは必ず getAddress() を通してから upsert するので
    // 本来この行は存在しない。挙動を固定しておくためのテスト。
    expect(body.identities).toEqual([]);
  });

  it("未連携アドレスは 404 ではなく 200 + 空配列", async () => {
    const { db } = makeTestDb();
    await seed(db, [{ accountId: "100", wallet: WALLET_CHECKSUM }]);
    const res = await handleLookupByWallet(
      getRequest(`provider=discord&wallet=${UNLINKED_LOWER}`),
      { db, env: baseEnv },
    );
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      wallet: "0x90F79bf6EB2c4f870365E785982E1f101E93b906",
      identities: [],
    });
  });

  it("1 ウォレットに複数アカウントが紐づく場合は全件を配列で返す（更新が新しい順）", async () => {
    const { db } = makeTestDb();
    await seed(db, [
      { accountId: "100", wallet: WALLET_CHECKSUM, updatedAt: 1000 },
      { accountId: "200", wallet: WALLET_CHECKSUM, updatedAt: 2000 },
    ]);
    const res = await handleLookupByWallet(
      getRequest(`provider=discord&wallet=${WALLET_LOWER}`),
      { db, env: baseEnv },
    );
    const body = (await res.json()) as { identities: ResponseItem[] };
    expect(body.identities.map((i) => i.accountId)).toEqual(["200", "100"]);
  });

  it("provider が違う行は返さない", async () => {
    const { db } = makeTestDb();
    await seed(db, [
      { accountId: "100", wallet: WALLET_CHECKSUM, provider: "github" },
    ]);
    const res = await handleLookupByWallet(
      getRequest(`provider=discord&wallet=${WALLET_LOWER}`),
      { db, env: baseEnv },
    );
    const body = (await res.json()) as { identities: ResponseItem[] };
    expect(body.identities).toEqual([]);
  });

  it("metadata は JSON としてパースして返す", async () => {
    const { db } = makeTestDb();
    await seed(db, [
      {
        accountId: "100",
        wallet: WALLET_CHECKSUM,
        metadata: JSON.stringify({ username: "alice" }),
      },
    ]);
    const res = await handleLookupByWallet(
      getRequest(`provider=discord&wallet=${WALLET_LOWER}`),
      { db, env: baseEnv },
    );
    const body = (await res.json()) as { identities: ResponseItem[] };
    expect(body.identities[0]?.metadata).toEqual({ username: "alice" });
  });

  it("provider / wallet が欠けていれば 400", async () => {
    const { db } = makeTestDb();
    const res = await handleLookupByWallet(getRequest("provider=discord"), {
      db,
      env: baseEnv,
    });
    expect(res.status).toBe(400);
    expect(await res.json()).toMatchObject({ error: "invalid_query" });
  });

  it("アドレスとして壊れた入力は 400 invalid_wallet（500 にはしない）", async () => {
    const { db } = makeTestDb();
    const res = await handleLookupByWallet(
      getRequest("provider=discord&wallet=not-an-address"),
      { db, env: baseEnv },
    );
    expect(res.status).toBe(400);
    expect(await res.json()).toMatchObject({ error: "invalid_wallet" });
  });
});

describe("handlers/lookup-by-wallet — 認証（server-to-server 専用）", () => {
  it("シークレット無しは 401", async () => {
    const { db } = makeTestDb();
    const res = await handleLookupByWallet(
      getRequest(`provider=discord&wallet=${WALLET_LOWER}`, {}),
      { db, env: baseEnv },
    );
    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: "unauthorized" });
  });

  it("シークレットが違えば 401", async () => {
    const { db } = makeTestDb();
    const res = await handleLookupByWallet(
      getRequest(`provider=discord&wallet=${WALLET_LOWER}`, {
        "x-toban-lookup-secret": "nope",
      }),
      { db, env: baseEnv },
    );
    expect(res.status).toBe(401);
  });

  it("verifier_token（Bearer）では叩けない — 順方向 /api/lookup と違い 2 モード認証にしない", async () => {
    const { db } = makeTestDb();
    await seed(db, [{ accountId: "100", wallet: WALLET_CHECKSUM }]);
    // 逆引きハンドラは provider registry を一切参照しないので、
    // 正当な verifier_token を持っていても認証は通らない。
    const res = await handleLookupByWallet(
      getRequest(`provider=discord&wallet=${WALLET_LOWER}`, {
        authorization: "Bearer valid-verifier-token",
      }),
      { db, env: baseEnv },
    );
    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: "unauthorized" });
  });

  it("バッチも verifier_token では叩けない", async () => {
    const { db } = makeTestDb();
    const res = await handleLookupByWallet(
      postRequest(
        { provider: "discord", wallets: [WALLET_LOWER] },
        {
          "content-type": "application/json",
          authorization: "Bearer valid-verifier-token",
        },
      ),
      { db, env: baseEnv },
    );
    expect(res.status).toBe(401);
  });

  it("LOOKUP_READ_SECRET 未設定ならエンドポイントごと閉じる（401）", async () => {
    const { db } = makeTestDb();
    const res = await handleLookupByWallet(
      getRequest(`provider=discord&wallet=${WALLET_LOWER}`, {}),
      { db, env: {} },
    );
    expect(res.status).toBe(401);
  });

  it("GET / POST 以外は 405", async () => {
    const { db } = makeTestDb();
    const res = await handleLookupByWallet(
      new Request("https://example.test/api/lookup/by-wallet", {
        method: "DELETE",
        headers: { "x-toban-lookup-secret": TEST_SECRET },
      }),
      { db, env: baseEnv },
    );
    expect(res.status).toBe(405);
  });
});

describe("handlers/lookup-by-wallet — POST（バッチ）", () => {
  it("小文字アドレスの配列で複数件まとめて引ける", async () => {
    const { db } = makeTestDb();
    await seed(db, [
      { accountId: "100", wallet: WALLET_CHECKSUM },
      { accountId: "200", wallet: OTHER_CHECKSUM },
    ]);

    const res = await handleLookupByWallet(
      postRequest({
        provider: "discord",
        wallets: [WALLET_LOWER, OTHER_LOWER],
      }),
      { db, env: baseEnv },
    );

    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      results: Array<{ wallet: string; identities: ResponseItem[] }>;
      invalid: unknown[];
    };
    expect(body.results).toHaveLength(2);
    expect(body.results[0]?.wallet).toBe(WALLET_CHECKSUM);
    expect(body.results[0]?.identities.map((i) => i.accountId)).toEqual([
      "100",
    ]);
    expect(body.results[1]?.wallet).toBe(OTHER_CHECKSUM);
    expect(body.results[1]?.identities.map((i) => i.accountId)).toEqual([
      "200",
    ]);
    expect(body.invalid).toEqual([]);
  });

  it("未連携アドレスも結果に含まれ、identities が空配列になる", async () => {
    const { db } = makeTestDb();
    await seed(db, [{ accountId: "100", wallet: WALLET_CHECKSUM }]);
    const res = await handleLookupByWallet(
      postRequest({
        provider: "discord",
        wallets: [WALLET_LOWER, UNLINKED_LOWER],
      }),
      { db, env: baseEnv },
    );
    const body = (await res.json()) as {
      results: Array<{ wallet: string; identities: ResponseItem[] }>;
    };
    expect(body.results).toHaveLength(2);
    expect(body.results[1]?.identities).toEqual([]);
  });

  it("表記が混在していても、同じアドレスは 1 件に寄せられる", async () => {
    const { db } = makeTestDb();
    await seed(db, [{ accountId: "100", wallet: WALLET_CHECKSUM }]);
    const res = await handleLookupByWallet(
      postRequest({
        provider: "discord",
        wallets: [WALLET_LOWER, WALLET_CHECKSUM],
      }),
      { db, env: baseEnv },
    );
    const body = (await res.json()) as {
      results: Array<{ wallet: string; identities: ResponseItem[] }>;
    };
    expect(body.results).toHaveLength(1);
    expect(body.results[0]?.identities).toHaveLength(1);
  });

  it("1 ウォレットに複数アカウントが紐づく場合もバッチで配列を返す", async () => {
    const { db } = makeTestDb();
    await seed(db, [
      { accountId: "100", wallet: WALLET_CHECKSUM, updatedAt: 1000 },
      { accountId: "200", wallet: WALLET_CHECKSUM, updatedAt: 2000 },
      { accountId: "300", wallet: OTHER_CHECKSUM, updatedAt: 3000 },
    ]);
    const res = await handleLookupByWallet(
      postRequest({
        provider: "discord",
        wallets: [WALLET_LOWER, OTHER_LOWER],
      }),
      { db, env: baseEnv },
    );
    const body = (await res.json()) as {
      results: Array<{ wallet: string; identities: ResponseItem[] }>;
    };
    expect(body.results[0]?.identities.map((i) => i.accountId)).toEqual([
      "200",
      "100",
    ]);
    expect(body.results[1]?.identities.map((i) => i.accountId)).toEqual([
      "300",
    ]);
  });

  it("壊れたアドレスはバッチ全体を落とさず invalid に落ちる", async () => {
    const { db } = makeTestDb();
    await seed(db, [{ accountId: "100", wallet: WALLET_CHECKSUM }]);
    const res = await handleLookupByWallet(
      postRequest({
        provider: "discord",
        wallets: [WALLET_LOWER, "0xdeadbeef", 42],
      }),
      { db, env: baseEnv },
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      results: Array<{ wallet: string; identities: ResponseItem[] }>;
      invalid: unknown[];
    };
    expect(body.results).toHaveLength(1);
    expect(body.results[0]?.identities).toHaveLength(1);
    expect(body.invalid).toEqual(["0xdeadbeef", 42]);
  });

  it("空配列は 200 + 空の results", async () => {
    const { db } = makeTestDb();
    const res = await handleLookupByWallet(
      postRequest({ provider: "discord", wallets: [] }),
      { db, env: baseEnv },
    );
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ results: [], invalid: [] });
  });

  it("D1 のバインド変数上限を跨ぐ件数（チャンク分割）でも全件引ける", async () => {
    const { db } = makeTestDb();
    // queries.ts の WALLET_IN_CHUNK_SIZE = 90 を跨ぐ 120 件。
    const wallets: string[] = [];
    for (let i = 1; i <= 120; i++) {
      const lower = `0x${i.toString(16).padStart(40, "0")}`;
      wallets.push(lower);
      // 保存側は本番同様 checksum 表記、リクエストは subgraph 同様の小文字。
      await seed(db, [{ accountId: `acct-${i}`, wallet: getAddress(lower) }]);
    }

    const res = await handleLookupByWallet(
      postRequest({ provider: "discord", wallets }),
      { db, env: baseEnv },
    );
    const body = (await res.json()) as {
      results: Array<{ wallet: string; identities: ResponseItem[] }>;
    };
    expect(body.results).toHaveLength(120);
    expect(body.results.every((r) => r.identities.length === 1)).toBe(true);
  });

  it("上限を超える件数は 400 too_many_wallets", async () => {
    const { db } = makeTestDb();
    const wallets = Array.from(
      { length: MAX_WALLETS_PER_BATCH + 1 },
      () => WALLET_LOWER,
    );
    const res = await handleLookupByWallet(
      postRequest({ provider: "discord", wallets }),
      { db, env: baseEnv },
    );
    expect(res.status).toBe(400);
    expect(await res.json()).toMatchObject({ error: "too_many_wallets" });
  });

  it("body が JSON でなければ 400", async () => {
    const { db } = makeTestDb();
    const res = await handleLookupByWallet(postRequest("{not json"), {
      db,
      env: baseEnv,
    });
    expect(res.status).toBe(400);
    expect(await res.json()).toMatchObject({ error: "invalid_body" });
  });

  it("wallets が配列でなければ 400", async () => {
    const { db } = makeTestDb();
    const res = await handleLookupByWallet(
      postRequest({ provider: "discord", wallets: WALLET_LOWER }),
      { db, env: baseEnv },
    );
    expect(res.status).toBe(400);
    expect(await res.json()).toMatchObject({ error: "invalid_body" });
  });

  it("provider が無ければ 400", async () => {
    const { db } = makeTestDb();
    const res = await handleLookupByWallet(
      postRequest({ wallets: [WALLET_LOWER] }),
      { db, env: baseEnv },
    );
    expect(res.status).toBe(400);
    expect(await res.json()).toMatchObject({ error: "invalid_body" });
  });
});
