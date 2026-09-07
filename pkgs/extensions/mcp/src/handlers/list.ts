/**
 * `POST /api/mcp-tokens/list` — settings-page listing for one workspace.
 *
 * Authorised the same way as issuance (`handlers/issue.ts`), but with the
 * lighter `McpTokenListRequest` message (no `label`) and **without**
 * burning the nonce: listing has no side effect, so replaying the same
 * signature within its `expires` window is harmless and lets the settings
 * page reuse one signature for the whole session instead of asking for a
 * new wallet popup on every render.
 *
 * This is only safe because `McpTokenListRequest` and `McpTokenRevokeRequest`
 * are now distinct EIP-712 primary types (see `eip712/mcp-token.ts`'s module
 * doc). A `McpTokenListRequest` signature is not a valid signature for a
 * `McpTokenRevokeRequest` message — different `primaryType` means a
 * different struct hash — so replaying a captured list signature against
 * `handleRevokeToken` fails signature verification outright, regardless of
 * whether this handler burns its own nonce. Before that split, both
 * operations shared one message shape and this file's un-burned nonce is
 * exactly what made the list-signature-as-revoke replay possible; see
 * `eip712/mcp-token.ts` for the full history. Do not reunify the two types
 * to "simplify" this file.
 */
import { isAddress } from "viem";
import type { Address, Hex } from "viem";
import { wearsAnyOfHats } from "../chain.js";
import {
  MCP_TOKEN_DOMAIN_NAME,
  MCP_TOKEN_DOMAIN_VERSION,
  MCP_TOKEN_LIST_PRIMARY_TYPE,
  MCP_TOKEN_REVOKE_PRIMARY_TYPE,
  type McpTokenDomain,
  type McpTokenListMessage,
  type McpTokenListTypedData,
  type McpTokenRevokeMessage,
  type McpTokenRevokeTypedData,
} from "../eip712/mcp-token.js";
import type { Env } from "../env.js";
import { resolveWorkspaceOverview } from "../queries.js";
import { type McpDb, listTokensByTree } from "../registry.js";
import { verifyMcpTokenAuthViaRpc } from "../verify.js";

/** Either of the two "wallet speaks for treeId" typed-data shapes — list and
 *  revoke authorise identically, they just carry a different primaryType
 *  (and revoke additionally names a `tokenId`). */
type WalletTreeTypedData = McpTokenListTypedData | McpTokenRevokeTypedData;

export type ListVerifier = (
  typedData: McpTokenListTypedData,
  signature: Hex,
  expectedAddress: Address,
) => Promise<boolean>;

export type RevokeVerifier = (
  typedData: McpTokenRevokeTypedData,
  signature: Hex,
  expectedAddress: Address,
) => Promise<boolean>;

export type HatChecker = (
  wallet: Address,
  treeId: string,
  fetchImpl: typeof fetch,
) => Promise<boolean>;

export type ListHandlerDeps = {
  db: McpDb;
  env: Env;
  now?: () => number;
  verifySignature?: ListVerifier;
  checkHat?: HatChecker;
  fetchImpl?: typeof fetch;
};

type WalletTreeAuthRequest<T extends WalletTreeTypedData> = {
  typedData: T;
  signature: Hex;
};

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function errorResponse(status: number, error: string, details?: string) {
  return json(status, details === undefined ? { error } : { error, details });
}

/**
 * Shared by list.ts and revoke.ts. Parses the common envelope shape and
 * **rejects any envelope whose `primaryType` is not `expectedPrimaryType`**
 * — that check is what makes it impossible to hand a
 * `McpTokenListRequest`-signed body to the revoke path (or vice versa) and
 * have it parsed as if it were the other. Overloaded on the two primary
 * types so each caller gets back the concrete typed-data shape it expects.
 */
export function parseWalletTreeAuthRequest(
  raw: unknown,
  expectedPrimaryType: typeof MCP_TOKEN_LIST_PRIMARY_TYPE,
): WalletTreeAuthRequest<McpTokenListTypedData> | null;
export function parseWalletTreeAuthRequest(
  raw: unknown,
  expectedPrimaryType: typeof MCP_TOKEN_REVOKE_PRIMARY_TYPE,
): WalletTreeAuthRequest<McpTokenRevokeTypedData> | null;
export function parseWalletTreeAuthRequest(
  raw: unknown,
  expectedPrimaryType:
    | typeof MCP_TOKEN_LIST_PRIMARY_TYPE
    | typeof MCP_TOKEN_REVOKE_PRIMARY_TYPE,
): WalletTreeAuthRequest<WalletTreeTypedData> | null {
  if (typeof raw !== "object" || raw === null) return null;
  const r = raw as Record<string, unknown>;
  if (typeof r.signature !== "string" || !r.signature.startsWith("0x")) {
    return null;
  }
  if (typeof r.typedData !== "object" || r.typedData === null) return null;
  const td = r.typedData as Record<string, unknown>;
  if (
    typeof td.domain !== "object" ||
    td.domain === null ||
    typeof td.types !== "object" ||
    td.types === null ||
    typeof td.message !== "object" ||
    td.message === null ||
    td.primaryType !== expectedPrimaryType
  ) {
    return null;
  }
  const msg = td.message as Record<string, unknown>;
  if (
    typeof msg.wallet !== "string" ||
    typeof msg.treeId !== "string" ||
    (typeof msg.expires !== "string" &&
      typeof msg.expires !== "number" &&
      typeof msg.expires !== "bigint") ||
    typeof msg.nonce !== "string"
  ) {
    return null;
  }
  if (
    expectedPrimaryType === MCP_TOKEN_REVOKE_PRIMARY_TYPE &&
    (typeof msg.tokenId !== "string" || msg.tokenId.length === 0)
  ) {
    return null;
  }
  let expires: bigint;
  try {
    expires =
      typeof msg.expires === "bigint" ? msg.expires : BigInt(msg.expires);
  } catch {
    return null;
  }
  const base = {
    wallet: msg.wallet as Address,
    treeId: msg.treeId,
    expires,
    nonce: msg.nonce as Hex,
  };
  const signature = r.signature as Hex;
  const domain = td.domain as McpTokenDomain;

  if (expectedPrimaryType === MCP_TOKEN_LIST_PRIMARY_TYPE) {
    const message: McpTokenListMessage = base;
    return {
      signature,
      typedData: {
        domain,
        types: td.types as McpTokenListTypedData["types"],
        primaryType: MCP_TOKEN_LIST_PRIMARY_TYPE,
        message,
      },
    };
  }
  const message: McpTokenRevokeMessage = {
    ...base,
    tokenId: msg.tokenId as string,
  };
  return {
    signature,
    typedData: {
      domain,
      types: td.types as McpTokenRevokeTypedData["types"],
      primaryType: MCP_TOKEN_REVOKE_PRIMARY_TYPE,
      message,
    },
  };
}

const defaultVerifier =
  (env: Env) =>
  (typedData: WalletTreeTypedData, signature: Hex, expected: Address) =>
    verifyMcpTokenAuthViaRpc(typedData, signature, expected, env.RPC_URL);

/**
 * Verify a `McpTokenListRequest` or `McpTokenRevokeRequest` envelope: domain,
 * expiry, signature, and "does this wallet wear treeId's operator/top hat".
 * Shared by list and revoke — both authorise the same way, they differ only
 * in what they do once authorised (revoke additionally burns the nonce and
 * targets the `tokenId` carried inside its own signed message).
 */
export async function verifyWalletTreeAuth<T extends WalletTreeTypedData>(
  parsed: WalletTreeAuthRequest<T>,
  deps: {
    env: Env;
    now?: () => number;
    verifySignature?: (
      typedData: T,
      signature: Hex,
      expectedAddress: Address,
    ) => Promise<boolean>;
    checkHat?: HatChecker;
    fetchImpl?: typeof fetch;
  },
): Promise<
  | { ok: true; wallet: Address; treeId: string; now: number }
  | { ok: false; response: Response }
> {
  const { typedData, signature } = parsed;
  const { message: msg, domain } = typedData;

  if (
    domain.name !== MCP_TOKEN_DOMAIN_NAME ||
    domain.version !== MCP_TOKEN_DOMAIN_VERSION ||
    typeof domain.chainId !== "number" ||
    domain.chainId !== Number(deps.env.CHAIN_ID)
  ) {
    return { ok: false, response: errorResponse(400, "domain_mismatch") };
  }
  if (!isAddress(msg.wallet)) {
    return {
      ok: false,
      response: errorResponse(
        400,
        "invalid_body",
        "message.wallet is not an address",
      ),
    };
  }
  if (!/^\d+$/.test(msg.treeId)) {
    return {
      ok: false,
      response: errorResponse(
        400,
        "invalid_body",
        "message.treeId must be numeric",
      ),
    };
  }

  const now = (deps.now ?? (() => Math.floor(Date.now() / 1000)))();
  if (msg.expires <= BigInt(now)) {
    return { ok: false, response: errorResponse(400, "expired") };
  }

  const verify = deps.verifySignature ?? defaultVerifier(deps.env);
  let signatureValid: boolean;
  try {
    signatureValid = await verify(typedData, signature, msg.wallet);
  } catch (err) {
    return {
      ok: false,
      response: errorResponse(
        400,
        "wallet_mismatch",
        err instanceof Error ? err.message : "signature verification threw",
      ),
    };
  }
  if (!signatureValid) {
    return { ok: false, response: errorResponse(400, "wallet_mismatch") };
  }

  const fetchImpl = deps.fetchImpl ?? fetch;
  const overview = await resolveWorkspaceOverview(
    deps.env,
    msg.treeId,
    fetchImpl,
  );
  if (!overview) {
    return {
      ok: false,
      response: errorResponse(404, "workspace_not_found"),
    };
  }
  const checkHat =
    deps.checkHat ??
    ((wallet: Address, treeId: string, fi: typeof fetch) =>
      wearsAnyOfHats(
        deps.env,
        wallet,
        treeId,
        [overview.hats.operatorHatId, overview.hats.topHatId],
        fi,
      ));
  const authorized = await checkHat(msg.wallet, msg.treeId, fetchImpl);
  if (!authorized) {
    return {
      ok: false,
      response: errorResponse(403, "unauthorized_wallet"),
    };
  }

  return { ok: true, wallet: msg.wallet, treeId: msg.treeId, now };
}

export async function handleListTokens(
  request: Request,
  deps: ListHandlerDeps,
): Promise<Response> {
  if (request.method !== "POST") {
    return errorResponse(405, "method_not_allowed");
  }
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return errorResponse(400, "invalid_body");
  }
  const parsed = parseWalletTreeAuthRequest(raw, MCP_TOKEN_LIST_PRIMARY_TYPE);
  if (!parsed) return errorResponse(400, "invalid_body");

  const auth = await verifyWalletTreeAuth(parsed, deps);
  if (!auth.ok) return auth.response;

  const rows = await listTokensByTree(deps.db, auth.treeId);
  return json(200, {
    tokens: rows.map((r) => ({
      tokenId: r.tokenId,
      label: r.label,
      createdBy: r.createdBy,
      createdAt: r.createdAt,
      revokedAt: r.revokedAt,
    })),
  });
}
