import { describe, expect, it } from "vitest";
import { handleLookup } from "../handlers/lookup.js";
import { upsertIdentity } from "../queries.js";
import { makeTestDb } from "./fixtures.js";

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
      new Request(
        "https://example.test/api/lookup?provider=discord&account_id=42",
      ),
      { db },
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
      new Request(
        "https://example.test/api/lookup?provider=discord&account_id=42",
      ),
      { db },
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as { wallet: string; metadata?: unknown };
    expect(body.metadata).toEqual({ username: "alice", avatar: "abc" });
  });

  it("returns 404 { error: 'not_found' } when no row matches", async () => {
    const { db } = makeTestDb();
    const res = await handleLookup(
      new Request(
        "https://example.test/api/lookup?provider=discord&account_id=missing",
      ),
      { db },
    );
    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ error: "not_found" });
  });

  it("returns 400 invalid_query when params missing", async () => {
    const { db } = makeTestDb();
    const res = await handleLookup(
      new Request("https://example.test/api/lookup?provider=discord"),
      { db },
    );
    expect(res.status).toBe(400);
    expect(await res.json()).toMatchObject({ error: "invalid_query" });
  });
});
