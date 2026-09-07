import { beforeEach, describe, expect, it } from "vitest";
import type { Env } from "../src/env";
import { handleIssueToken } from "../src/handlers/issue";
import { handleListTokens } from "../src/handlers/list";
import { handleRevokeToken } from "../src/handlers/revoke";
import { getToken } from "../src/registry";
import {
  alwaysAuthorized,
  buildSignedIssueRequest,
  buildSignedListRequest,
  buildSignedRevokeRequest,
  getTestAccount,
  makeTestDb,
  offlineIssueVerifier,
  offlineListVerifier,
  offlineRevokeVerifier,
} from "./fixtures";

const CHAIN_ID = 11155111;
const TREE_ID = "42";

function fakeEnv(): Env {
  return {
    DB: {} as unknown as D1Database,
    IDENTITY: {} as unknown as Fetcher,
    CONFIRM: {} as unknown as Fetcher,
    GOLDSKY_GRAPHQL_ENDPOINT: "https://goldsky.example.invalid/graphql",
    HATS_GRAPHQL_ENDPOINT: "https://hats.example.invalid/graphql",
    TOBAN_FRONTEND_URL: "https://toban.xyz",
    RPC_URL: "https://example.invalid",
    CHAIN_ID: String(CHAIN_ID),
    TURNKEY_BOT_SIGNER_ADDRESS: `0x${"bb".repeat(20)}`,
    MCP_TOKEN_SECRET: "test-secret",
    LOOKUP_READ_SECRET: "lookup-secret",
    MCP_INTERNAL_PROPOSE_SECRET: "propose-secret",
  };
}

/** A workspace overview fetch stub — the hat checker never runs since the
 *  default one is overridden in these tests via `checkHat`. */
function overviewFetchStub(): typeof fetch {
  return (async () =>
    new Response(
      JSON.stringify({
        data: {
          workspace: {
            creator: "0x0",
            owner: "0x0",
            topHatId: "1",
            hatterHatId: "2",
            memberHatId: "3",
            operatorHatId: "4",
            creatorHatId: "5",
            minterHatId: "6",
            questAgentHatId: "7",
            hatsTimeFrameModule: "0x0",
            hatsHatCreatorModule: "0x0",
            hatsQuestModule: "0x0",
            splitCreator: "0x0",
            blockTimestamp: "1700000000",
            thanksToken: null,
            hatsFractionTokenModule: null,
          },
        },
      }),
      { headers: { "content-type": "application/json" } },
    )) as unknown as typeof fetch;
}

function makeRequest(body: unknown): Request {
  return new Request("https://mcp.example.test/api/mcp-tokens", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body, (_k, v) =>
      typeof v === "bigint" ? v.toString() : v,
    ),
  });
}

describe("POST /api/mcp-tokens — issuance", () => {
  let ctx: { db: ReturnType<typeof makeTestDb>["db"]; env: Env };
  const account = getTestAccount();

  beforeEach(() => {
    const { db } = makeTestDb();
    ctx = { db, env: fakeEnv() };
  });

  it("issues a tbn2 token when the wallet wears the operator/top hat", async () => {
    const { typedData, signature } = await buildSignedIssueRequest({
      account,
      chainId: CHAIN_ID,
      treeId: TREE_ID,
      label: "うちの OpenClaw",
    });
    const res = await handleIssueToken(makeRequest({ typedData, signature }), {
      db: ctx.db,
      env: ctx.env,
      verifySignature: offlineIssueVerifier,
      checkHat: alwaysAuthorized,
      fetchImpl: overviewFetchStub(),
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as { token: string; tokenId: string };
    expect(body.token.startsWith(`tbn2.${TREE_ID}.`)).toBe(true);

    const row = await getToken(ctx.db, body.tokenId);
    expect(row).toMatchObject({
      treeId: TREE_ID,
      label: "うちの OpenClaw",
      createdBy: account.address,
      revokedAt: null,
    });
  });

  it("refuses a wallet that does not wear the operator or top hat", async () => {
    const { typedData, signature } = await buildSignedIssueRequest({
      account,
      chainId: CHAIN_ID,
      treeId: TREE_ID,
      label: "not authorized",
    });
    const res = await handleIssueToken(makeRequest({ typedData, signature }), {
      db: ctx.db,
      env: ctx.env,
      verifySignature: offlineIssueVerifier,
      checkHat: async () => false,
      fetchImpl: overviewFetchStub(),
    });
    expect(res.status).toBe(403);
    expect(await res.json()).toMatchObject({ error: "unauthorized_wallet" });
  });

  it("refuses an expired request", async () => {
    const { typedData, signature } = await buildSignedIssueRequest({
      account,
      chainId: CHAIN_ID,
      treeId: TREE_ID,
      label: "expired",
      expires: BigInt(Math.floor(Date.now() / 1000) - 10),
    });
    const res = await handleIssueToken(makeRequest({ typedData, signature }), {
      db: ctx.db,
      env: ctx.env,
      verifySignature: offlineIssueVerifier,
      checkHat: alwaysAuthorized,
      fetchImpl: overviewFetchStub(),
    });
    expect(res.status).toBe(400);
    expect(await res.json()).toMatchObject({ error: "expired" });
  });

  it("refuses a reused nonce", async () => {
    const nonce = (
      await buildSignedIssueRequest({
        account,
        chainId: CHAIN_ID,
        treeId: TREE_ID,
        label: "x",
      })
    ).typedData.message.nonce;
    const first = await buildSignedIssueRequest({
      account,
      chainId: CHAIN_ID,
      treeId: TREE_ID,
      label: "first",
      nonce,
    });
    const deps = {
      db: ctx.db,
      env: ctx.env,
      verifySignature: offlineIssueVerifier,
      checkHat: alwaysAuthorized,
      fetchImpl: overviewFetchStub(),
    };
    const ok = await handleIssueToken(makeRequest(first), deps);
    expect(ok.status).toBe(200);

    const second = await buildSignedIssueRequest({
      account,
      chainId: CHAIN_ID,
      treeId: TREE_ID,
      label: "second",
      nonce,
    });
    const replay = await handleIssueToken(makeRequest(second), deps);
    expect(replay.status).toBe(400);
    expect(await replay.json()).toMatchObject({ error: "nonce_reused" });
  });

  it("refuses a signature that does not match message.wallet", async () => {
    const { typedData, signature } = await buildSignedIssueRequest({
      account,
      chainId: CHAIN_ID,
      treeId: TREE_ID,
      label: "x",
      walletOverride: `0x${"ff".repeat(20)}`,
    });
    const res = await handleIssueToken(makeRequest({ typedData, signature }), {
      db: ctx.db,
      env: ctx.env,
      verifySignature: offlineIssueVerifier,
      checkHat: alwaysAuthorized,
      fetchImpl: overviewFetchStub(),
    });
    expect(res.status).toBe(400);
    expect(await res.json()).toMatchObject({ error: "wallet_mismatch" });
  });

  it("rejects a domain chainId that does not match the Worker's CHAIN_ID", async () => {
    const { typedData, signature } = await buildSignedIssueRequest({
      account,
      chainId: 1, // mainnet, not the Worker's sepolia
      treeId: TREE_ID,
      label: "x",
    });
    const res = await handleIssueToken(makeRequest({ typedData, signature }), {
      db: ctx.db,
      env: ctx.env,
      verifySignature: offlineIssueVerifier,
      checkHat: alwaysAuthorized,
      fetchImpl: overviewFetchStub(),
    });
    expect(res.status).toBe(400);
    expect(await res.json()).toMatchObject({ error: "domain_mismatch" });
  });
});

describe("POST /api/mcp-tokens/list and /revoke", () => {
  let ctx: { db: ReturnType<typeof makeTestDb>["db"]; env: Env };
  const account = getTestAccount();

  const deps = () => ({
    db: ctx.db,
    env: ctx.env,
    verifySignature: offlineListVerifier,
    checkHat: alwaysAuthorized,
    fetchImpl: overviewFetchStub(),
  });
  const revokeDeps = () => ({
    db: ctx.db,
    env: ctx.env,
    verifySignature: offlineRevokeVerifier,
    checkHat: alwaysAuthorized,
    fetchImpl: overviewFetchStub(),
  });

  beforeEach(async () => {
    const { db } = makeTestDb();
    ctx = { db, env: fakeEnv() };
    const issue = await buildSignedIssueRequest({
      account,
      chainId: CHAIN_ID,
      treeId: TREE_ID,
      label: "token A",
    });
    await handleIssueToken(makeRequest(issue), {
      db: ctx.db,
      env: ctx.env,
      verifySignature: offlineIssueVerifier,
      checkHat: alwaysAuthorized,
      fetchImpl: overviewFetchStub(),
    });
  });

  it("lists tokens for the authorised treeId", async () => {
    const { typedData, signature } = await buildSignedListRequest({
      account,
      chainId: CHAIN_ID,
      treeId: TREE_ID,
    });
    const res = await handleListTokens(
      makeRequest({ typedData, signature }),
      deps(),
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as { tokens: Array<{ label: string }> };
    expect(body.tokens).toHaveLength(1);
    expect(body.tokens[0].label).toBe("token A");
  });

  it("does not burn the nonce on a list call (replay within expiry is fine)", async () => {
    const { typedData, signature } = await buildSignedListRequest({
      account,
      chainId: CHAIN_ID,
      treeId: TREE_ID,
    });
    const first = await handleListTokens(
      makeRequest({ typedData, signature }),
      deps(),
    );
    const second = await handleListTokens(
      makeRequest({ typedData, signature }),
      deps(),
    );
    expect(first.status).toBe(200);
    expect(second.status).toBe(200);
  });

  it("regression: a McpTokenListRequest signature cannot be replayed as a " +
    "McpTokenRevokeRequest (the tbn2 list/revoke signature-confusion bug)", async () => {
    const list = await handleListTokens(
      makeRequest(
        await buildSignedListRequest({
          account,
          chainId: CHAIN_ID,
          treeId: TREE_ID,
        }),
      ),
      deps(),
    );
    const { tokens } = (await list.json()) as {
      tokens: Array<{ tokenId: string }>;
    };
    const tokenId = tokens[0].tokenId;

    // A signature an admin produced purely to list their tokens...
    const { typedData, signature } = await buildSignedListRequest({
      account,
      chainId: CHAIN_ID,
      treeId: TREE_ID,
    });
    expect(typedData.primaryType).not.toBe(
      (
        await buildSignedRevokeRequest({
          account,
          chainId: CHAIN_ID,
          treeId: TREE_ID,
          tokenId,
        })
      ).typedData.primaryType,
    );

    // First prove the signature is genuinely valid for listing...
    const listRes = await handleListTokens(
      makeRequest({ typedData, signature }),
      deps(),
    );
    expect(listRes.status).toBe(200);

    // ...then replay that exact typed data + signature against revoke,
    // smuggling in the target tokenId as a bare body field the way the
    // pre-fix client did. The revoke handler must reject the envelope
    // outright (wrong primaryType) rather than accepting it and reading
    // tokenId from the unsigned field.
    const revokeRes = await handleRevokeToken(
      makeRequest({ typedData, signature, tokenId }),
      revokeDeps(),
    );
    expect(revokeRes.status).toBe(400);
    expect(await revokeRes.json()).toMatchObject({ error: "invalid_body" });

    const row = await getToken(ctx.db, tokenId);
    expect(row?.revokedAt).toBeNull();
  });

  it("revokes a token belonging to the authorised treeId", async () => {
    const list = await handleListTokens(
      makeRequest(
        await buildSignedListRequest({
          account,
          chainId: CHAIN_ID,
          treeId: TREE_ID,
        }),
      ),
      deps(),
    );
    const { tokens } = (await list.json()) as {
      tokens: Array<{ tokenId: string }>;
    };
    const tokenId = tokens[0].tokenId;

    const { typedData, signature } = await buildSignedRevokeRequest({
      account,
      chainId: CHAIN_ID,
      treeId: TREE_ID,
      tokenId,
    });
    const res = await handleRevokeToken(
      makeRequest({ typedData, signature }),
      revokeDeps(),
    );
    expect(res.status).toBe(200);

    const row = await getToken(ctx.db, tokenId);
    expect(row?.revokedAt).not.toBeNull();
  });

  it("a revoke signature naming token A cannot revoke token B", async () => {
    // Issue a second token in the same workspace.
    const issueB = await buildSignedIssueRequest({
      account,
      chainId: CHAIN_ID,
      treeId: TREE_ID,
      label: "token B",
    });
    const issuedB = await handleIssueToken(makeRequest(issueB), {
      db: ctx.db,
      env: ctx.env,
      verifySignature: offlineIssueVerifier,
      checkHat: alwaysAuthorized,
      fetchImpl: overviewFetchStub(),
    });
    const { tokenId: tokenBId } = (await issuedB.json()) as {
      tokenId: string;
    };

    const list = await handleListTokens(
      makeRequest(
        await buildSignedListRequest({
          account,
          chainId: CHAIN_ID,
          treeId: TREE_ID,
        }),
      ),
      deps(),
    );
    const { tokens } = (await list.json()) as {
      tokens: Array<{ tokenId: string; label: string }>;
    };
    const tokenAId = tokens.find((t) => t.label === "token A")?.tokenId;
    if (!tokenAId) throw new Error("token A not found in list");

    // A validly-signed revoke request naming token A...
    const { typedData, signature } = await buildSignedRevokeRequest({
      account,
      chainId: CHAIN_ID,
      treeId: TREE_ID,
      tokenId: tokenAId,
    });

    // ...cannot be retargeted at token B by editing the signed message: the
    // signature no longer matches the (now-tampered) message, so
    // verification fails rather than silently revoking B.
    const tampered = {
      ...typedData,
      message: { ...typedData.message, tokenId: tokenBId },
    };
    const res = await handleRevokeToken(
      makeRequest({ typedData: tampered, signature }),
      revokeDeps(),
    );
    expect(res.status).toBe(400);
    expect(await res.json()).toMatchObject({ error: "wallet_mismatch" });

    const rowA = await getToken(ctx.db, tokenAId);
    const rowB = await getToken(ctx.db, tokenBId);
    expect(rowA?.revokedAt).toBeNull();
    expect(rowB?.revokedAt).toBeNull();
  });

  it("refuses to revoke a token belonging to a different treeId", async () => {
    // Issue a second token under a different workspace.
    const otherIssue = await buildSignedIssueRequest({
      account,
      chainId: CHAIN_ID,
      treeId: "999",
      label: "other workspace's token",
    });
    const issued = await handleIssueToken(makeRequest(otherIssue), {
      db: ctx.db,
      env: ctx.env,
      verifySignature: offlineIssueVerifier,
      checkHat: alwaysAuthorized,
      fetchImpl: overviewFetchStub(),
    });
    const { tokenId: otherTokenId } = (await issued.json()) as {
      tokenId: string;
    };

    // Authorised for TREE_ID, try to revoke the "999" token — the signature
    // itself names otherTokenId (proving intent to revoke it), but that
    // token belongs to a workspace this wallet was never authorised for.
    const { typedData, signature } = await buildSignedRevokeRequest({
      account,
      chainId: CHAIN_ID,
      treeId: TREE_ID,
      tokenId: otherTokenId,
    });
    const res = await handleRevokeToken(
      makeRequest({ typedData, signature }),
      revokeDeps(),
    );
    expect(res.status).toBe(404);
    const row = await getToken(ctx.db, otherTokenId);
    expect(row?.revokedAt).toBeNull();
  });

  it("refuses a replayed revoke nonce", async () => {
    const list = await handleListTokens(
      makeRequest(
        await buildSignedListRequest({
          account,
          chainId: CHAIN_ID,
          treeId: TREE_ID,
        }),
      ),
      deps(),
    );
    const { tokens } = (await list.json()) as {
      tokens: Array<{ tokenId: string }>;
    };
    const tokenId = tokens[0].tokenId;

    const { typedData, signature } = await buildSignedRevokeRequest({
      account,
      chainId: CHAIN_ID,
      treeId: TREE_ID,
      tokenId,
    });
    const first = await handleRevokeToken(
      makeRequest({ typedData, signature }),
      revokeDeps(),
    );
    expect(first.status).toBe(200);

    const replay = await handleRevokeToken(
      makeRequest({ typedData, signature }),
      revokeDeps(),
    );
    expect(replay.status).toBe(400);
    expect(await replay.json()).toMatchObject({ error: "nonce_reused" });
  });

  it("revocation is a one-way latch, and a re-revoke consumes a fresh nonce without effect", async () => {
    const list = await handleListTokens(
      makeRequest(
        await buildSignedListRequest({
          account,
          chainId: CHAIN_ID,
          treeId: TREE_ID,
        }),
      ),
      deps(),
    );
    const { tokens } = (await list.json()) as {
      tokens: Array<{ tokenId: string }>;
    };
    const tokenId = tokens[0].tokenId;

    const first = await handleRevokeToken(
      makeRequest(
        await buildSignedRevokeRequest({
          account,
          chainId: CHAIN_ID,
          treeId: TREE_ID,
          tokenId,
        }),
      ),
      revokeDeps(),
    );
    expect(first.status).toBe(200);
    const rowAfterFirst = await getToken(ctx.db, tokenId);

    const second = await handleRevokeToken(
      makeRequest(
        await buildSignedRevokeRequest({
          account,
          chainId: CHAIN_ID,
          treeId: TREE_ID,
          tokenId,
        }),
      ),
      revokeDeps(),
    );
    expect(second.status).toBe(200);
    const rowAfterSecond = await getToken(ctx.db, tokenId);
    expect(rowAfterSecond?.revokedAt).toBe(rowAfterFirst?.revokedAt);
  });
});
