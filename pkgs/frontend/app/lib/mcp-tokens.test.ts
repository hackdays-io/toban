import { describe, expect, it, vi } from "vitest";
import {
  buildMcpTokenIssueTypedData,
  buildMcpTokenListTypedData,
  buildMcpTokenRevokeTypedData,
  fetchMcpTokenList,
  isListAuthUsable,
  postMcpTokenIssue,
  postMcpTokenRevoke,
} from "./mcp-tokens";

const WALLET = `0x${"11".repeat(20)}` as const;
const TREE_ID = "42";
const NONCE = `0x${"22".repeat(32)}` as const;

describe("fetchMcpTokenList (review finding #1)", () => {
  it("POSTs to /api/mcp-tokens/list — not the nonexistent GET /api/mcp-tokens", async () => {
    const typedData = buildMcpTokenListTypedData({
      wallet: WALLET,
      treeId: TREE_ID,
      chainId: 11155111,
      nonce: NONCE,
      ttlSeconds: 3600,
      nowSeconds: 1_700_000_000,
    });
    const auth = { typedData, signature: `0x${"aa".repeat(65)}` as const };

    const mockFetch = vi.fn(
      async (_url: string, _init?: RequestInit) =>
        new Response(
          JSON.stringify({
            tokens: [
              {
                tokenId: "tok_1",
                treeId: TREE_ID,
                label: "うちの OpenClaw",
                createdBy: WALLET,
                createdAt: 1_700_000_000,
                revokedAt: null,
              },
            ],
          }),
          { status: 200 },
        ),
    );
    const fetchImpl = mockFetch as unknown as typeof fetch;

    const tokens = await fetchMcpTokenList(
      "https://mcp.example.workers.dev",
      auth,
      fetchImpl,
    );

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [url, init] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://mcp.example.workers.dev/api/mcp-tokens/list");
    expect(init.method).toBe("POST");

    const body = JSON.parse(String(init.body));
    expect(body.signature).toBe(auth.signature);
    expect(body.typedData.primaryType).toBe("McpTokenListRequest");
    expect(body.typedData.message.wallet).toBe(WALLET);
    expect(body.typedData.message.treeId).toBe(TREE_ID);
    // bigint `expires` must survive JSON.stringify as a decimal string, not
    // throw or silently become `"[object BigInt]"`.
    expect(body.typedData.message.expires).toBe(String(1_700_000_000 + 3600));

    expect(tokens).toEqual([
      {
        tokenId: "tok_1",
        treeId: TREE_ID,
        label: "うちの OpenClaw",
        createdBy: WALLET,
        createdAt: 1_700_000_000,
        revokedAt: null,
      },
    ]);
  });

  it("strips a trailing slash from the worker URL", async () => {
    const typedData = buildMcpTokenListTypedData({
      wallet: WALLET,
      treeId: TREE_ID,
      chainId: 11155111,
      nonce: NONCE,
      ttlSeconds: 3600,
      nowSeconds: 1_700_000_000,
    });
    const auth = { typedData, signature: `0x${"aa".repeat(65)}` as const };
    const mockFetch = vi.fn(
      async (_url: string, _init?: RequestInit) =>
        new Response(JSON.stringify({ tokens: [] }), { status: 200 }),
    );
    const fetchImpl = mockFetch as unknown as typeof fetch;

    await fetchMcpTokenList(
      "https://mcp.example.workers.dev/",
      auth,
      fetchImpl,
    );

    const [url] = mockFetch.mock.calls[0] as [string];
    expect(url).toBe("https://mcp.example.workers.dev/api/mcp-tokens/list");
  });

  it("throws with the status code on a non-OK response", async () => {
    const typedData = buildMcpTokenListTypedData({
      wallet: WALLET,
      treeId: TREE_ID,
      chainId: 11155111,
      nonce: NONCE,
      ttlSeconds: 3600,
      nowSeconds: 1_700_000_000,
    });
    const auth = { typedData, signature: `0x${"aa".repeat(65)}` as const };
    // This is exactly what a lingering `GET /api/mcp-tokens` call used to
    // get back in production: the Worker's 405 for a route it never
    // implemented (`pkgs/extensions/mcp/src/handlers/list.ts` only serves
    // POST).
    const fetchImpl = vi.fn(
      async () =>
        new Response(JSON.stringify({ error: "method_not_allowed" }), {
          status: 405,
        }),
    ) as unknown as typeof fetch;

    await expect(
      fetchMcpTokenList("https://mcp.example.workers.dev", auth, fetchImpl),
    ).rejects.toThrow("405");
  });
});

describe("isListAuthUsable", () => {
  const typedData = buildMcpTokenListTypedData({
    wallet: WALLET,
    treeId: TREE_ID,
    chainId: 11155111,
    nonce: NONCE,
    ttlSeconds: 3600,
    nowSeconds: 1_700_000_000,
  });
  const auth = { typedData, signature: `0x${"aa".repeat(65)}` as const };

  it("is false for null", () => {
    expect(isListAuthUsable(null, 1_700_000_000)).toBe(false);
  });

  it("is true well before expiry", () => {
    expect(isListAuthUsable(auth, 1_700_000_000 + 10)).toBe(true);
  });

  it("is false once within the safety skew of expiry", () => {
    // expires = 1_700_000_000 + 3600; default skew is 30s.
    expect(isListAuthUsable(auth, 1_700_003_600 - 10)).toBe(false);
  });

  it("is false once actually expired", () => {
    expect(isListAuthUsable(auth, 1_700_003_600 + 10)).toBe(false);
  });
});

describe("postMcpTokenIssue (review finding #1)", () => {
  it("POSTs the McpTokenIssueRequest to /api/mcp-tokens with bigint-safe expires", async () => {
    const typedData = buildMcpTokenIssueTypedData({
      wallet: WALLET,
      treeId: TREE_ID,
      label: "うちの OpenClaw",
      chainId: 11155111,
      nonce: NONCE,
      ttlSeconds: 600,
      nowSeconds: 1_700_000_000,
    });
    const signature = `0x${"bb".repeat(65)}` as const;

    const mockFetch = vi.fn(
      async (_url: string, _init?: RequestInit) =>
        new Response(
          JSON.stringify({
            token: "tbn2.42.tok_1.deadbeef",
            tokenId: "tok_1",
            treeId: TREE_ID,
            label: "うちの OpenClaw",
            createdAt: 1_700_000_000,
          }),
          { status: 200 },
        ),
    );
    const fetchImpl = mockFetch as unknown as typeof fetch;

    const issued = await postMcpTokenIssue(
      "https://mcp.example.workers.dev",
      typedData,
      signature,
      fetchImpl,
    );

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [url, init] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://mcp.example.workers.dev/api/mcp-tokens");
    expect(init.method).toBe("POST");

    const body = JSON.parse(String(init.body));
    expect(body.signature).toBe(signature);
    expect(body.typedData.primaryType).toBe("McpTokenIssueRequest");
    expect(body.typedData.message.label).toBe("うちの OpenClaw");
    // bigint `expires` must survive JSON.stringify as a decimal string.
    expect(body.typedData.message.expires).toBe(String(1_700_000_000 + 600));

    expect(issued.tokenId).toBe("tok_1");
    expect(issued.token).toBe("tbn2.42.tok_1.deadbeef");
  });

  it("surfaces the Worker's error message on a non-OK response", async () => {
    const typedData = buildMcpTokenIssueTypedData({
      wallet: WALLET,
      treeId: TREE_ID,
      label: "うちの OpenClaw",
      chainId: 11155111,
      nonce: NONCE,
      ttlSeconds: 600,
      nowSeconds: 1_700_000_000,
    });
    const fetchImpl = vi.fn(
      async () =>
        new Response(JSON.stringify({ error: "not a hat wearer" }), {
          status: 403,
        }),
    ) as unknown as typeof fetch;

    await expect(
      postMcpTokenIssue(
        "https://mcp.example.workers.dev",
        typedData,
        `0x${"bb".repeat(65)}`,
        fetchImpl,
      ),
    ).rejects.toThrow("発行に失敗しました: not a hat wearer");
  });

  it("falls back to the status code when the Worker sends no error body", async () => {
    const typedData = buildMcpTokenIssueTypedData({
      wallet: WALLET,
      treeId: TREE_ID,
      label: "うちの OpenClaw",
      chainId: 11155111,
      nonce: NONCE,
      ttlSeconds: 600,
      nowSeconds: 1_700_000_000,
    });
    const fetchImpl = vi.fn(
      async () => new Response("", { status: 500 }),
    ) as unknown as typeof fetch;

    await expect(
      postMcpTokenIssue(
        "https://mcp.example.workers.dev",
        typedData,
        `0x${"bb".repeat(65)}`,
        fetchImpl,
      ),
    ).rejects.toThrow("発行に失敗しました (500)");
  });
});

describe("postMcpTokenRevoke (review finding #1)", () => {
  it("POSTs the McpTokenRevokeRequest, tokenId included, to /api/mcp-tokens/revoke", async () => {
    const typedData = buildMcpTokenRevokeTypedData({
      wallet: WALLET,
      treeId: TREE_ID,
      tokenId: "tok_1",
      chainId: 11155111,
      nonce: NONCE,
      ttlSeconds: 600,
      nowSeconds: 1_700_000_000,
    });
    const signature = `0x${"cc".repeat(65)}` as const;
    const mockFetch = vi.fn(
      async (_url: string, _init?: RequestInit) =>
        new Response(null, { status: 204 }),
    );
    const fetchImpl = mockFetch as unknown as typeof fetch;

    await postMcpTokenRevoke(
      "https://mcp.example.workers.dev",
      typedData,
      signature,
      fetchImpl,
    );

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [url, init] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://mcp.example.workers.dev/api/mcp-tokens/revoke");
    expect(init.method).toBe("POST");

    const body = JSON.parse(String(init.body));
    expect(body.signature).toBe(signature);
    expect(body.typedData.primaryType).toBe("McpTokenRevokeRequest");
    expect(body.typedData.message.tokenId).toBe("tok_1");
    expect(body.typedData.message.expires).toBe(String(1_700_000_000 + 600));
  });

  it("surfaces the Worker's error message on a non-OK response", async () => {
    const typedData = buildMcpTokenRevokeTypedData({
      wallet: WALLET,
      treeId: TREE_ID,
      tokenId: "tok_1",
      chainId: 11155111,
      nonce: NONCE,
      ttlSeconds: 600,
      nowSeconds: 1_700_000_000,
    });
    const fetchImpl = vi.fn(
      async () =>
        new Response(
          JSON.stringify({ error: "token belongs to another tree" }),
          {
            status: 403,
          },
        ),
    ) as unknown as typeof fetch;

    await expect(
      postMcpTokenRevoke(
        "https://mcp.example.workers.dev",
        typedData,
        `0x${"cc".repeat(65)}`,
        fetchImpl,
      ),
    ).rejects.toThrow("失効に失敗しました: token belongs to another tree");
  });

  it("falls back to the status code when the Worker sends no error body", async () => {
    const typedData = buildMcpTokenRevokeTypedData({
      wallet: WALLET,
      treeId: TREE_ID,
      tokenId: "tok_1",
      chainId: 11155111,
      nonce: NONCE,
      ttlSeconds: 600,
      nowSeconds: 1_700_000_000,
    });
    const fetchImpl = vi.fn(
      async () => new Response("", { status: 500 }),
    ) as unknown as typeof fetch;

    await expect(
      postMcpTokenRevoke(
        "https://mcp.example.workers.dev",
        typedData,
        `0x${"cc".repeat(65)}`,
        fetchImpl,
      ),
    ).rejects.toThrow("失効に失敗しました (500)");
  });
});
