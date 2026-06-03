import { describe, expect, it } from "vitest";
import { handleLookup } from "../handlers/lookup.js";
import type { IdentityEnv, ProviderDefinition } from "../providers/types.js";
import { upsertIdentity } from "../queries.js";
import { makeTestDb } from "./fixtures.js";

const TEST_SECRET = "test-lookup-secret-1234";

const baseEnv: IdentityEnv = { LOOKUP_READ_SECRET: TEST_SECRET };

function authedRequest(url: string): Request {
  return new Request(url, {
    headers: { "x-toban-lookup-secret": TEST_SECRET },
  });
}

describe("handlers/lookup", () => {
  it("returns 200 and { wallet } for an existing identity", async () => {
    const { db } = makeTestDb();
    const now = Math.floor(Date.now() / 1000);
    await upsertIdentity(db, {
      provider: "discord",
      accountId: "42",
      wallet: "0x1111111111111111111111111111111111111111",
      metadata: null,
      createdAt: now,
      updatedAt: now,
    });
    const res = await handleLookup(
      authedRequest(
        "https://example.test/api/lookup?provider=discord&account_id=42",
      ),
      { db, env: baseEnv },
    );
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      wallet: "0x1111111111111111111111111111111111111111",
    });
  });

  it("parses metadata JSON when present", async () => {
    const { db } = makeTestDb();
    const now = Math.floor(Date.now() / 1000);
    await upsertIdentity(db, {
      provider: "discord",
      accountId: "42",
      wallet: "0x1111111111111111111111111111111111111111",
      metadata: JSON.stringify({ username: "alice", avatar: "abc" }),
      createdAt: now,
      updatedAt: now,
    });
    const res = await handleLookup(
      authedRequest(
        "https://example.test/api/lookup?provider=discord&account_id=42",
      ),
      { db, env: baseEnv },
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as { wallet: string; metadata?: unknown };
    expect(body.metadata).toEqual({ username: "alice", avatar: "abc" });
  });

  it("returns 404 { error: 'not_found' } when no row matches", async () => {
    const { db } = makeTestDb();
    const res = await handleLookup(
      authedRequest(
        "https://example.test/api/lookup?provider=discord&account_id=missing",
      ),
      { db, env: baseEnv },
    );
    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ error: "not_found" });
  });

  it("returns 400 invalid_query when params missing", async () => {
    const { db } = makeTestDb();
    const res = await handleLookup(
      authedRequest("https://example.test/api/lookup?provider=discord"),
      { db, env: baseEnv },
    );
    expect(res.status).toBe(400);
    expect(await res.json()).toMatchObject({ error: "invalid_query" });
  });

  it("returns 401 when no auth is supplied", async () => {
    const { db } = makeTestDb();
    const res = await handleLookup(
      new Request(
        "https://example.test/api/lookup?provider=discord&account_id=42",
      ),
      { db, env: baseEnv },
    );
    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: "unauthorized" });
  });

  it("returns 401 when the shared secret is wrong", async () => {
    const { db } = makeTestDb();
    const res = await handleLookup(
      new Request(
        "https://example.test/api/lookup?provider=discord&account_id=42",
        { headers: { "x-toban-lookup-secret": "nope" } },
      ),
      { db, env: baseEnv },
    );
    expect(res.status).toBe(401);
  });

  it("accepts a verifier_token Bearer whose accountId matches", async () => {
    const { db } = makeTestDb();
    const now = Math.floor(Date.now() / 1000);
    await upsertIdentity(db, {
      provider: "discord",
      accountId: "42",
      wallet: "0x1111111111111111111111111111111111111111",
      metadata: null,
      createdAt: now,
      updatedAt: now,
    });
    const stubProvider: ProviderDefinition = {
      name: "discord",
      verifyVerifierToken: async (token: string) => {
        if (token !== "valid-token") throw new Error("bad token");
        return { accountId: "42", expiresAt: now + 60 };
      },
    };
    const res = await handleLookup(
      new Request(
        "https://example.test/api/lookup?provider=discord&account_id=42",
        { headers: { authorization: "Bearer valid-token" } },
      ),
      { db, env: baseEnv, registry: { discord: stubProvider } },
    );
    expect(res.status).toBe(200);
  });

  it("rejects a verifier_token whose accountId does not match the lookup", async () => {
    const { db } = makeTestDb();
    const stubProvider: ProviderDefinition = {
      name: "discord",
      verifyVerifierToken: async () => ({
        accountId: "99",
        expiresAt: Math.floor(Date.now() / 1000) + 60,
      }),
    };
    const res = await handleLookup(
      new Request(
        "https://example.test/api/lookup?provider=discord&account_id=42",
        { headers: { authorization: "Bearer other-acct-token" } },
      ),
      { db, env: baseEnv, registry: { discord: stubProvider } },
    );
    expect(res.status).toBe(401);
  });
});
