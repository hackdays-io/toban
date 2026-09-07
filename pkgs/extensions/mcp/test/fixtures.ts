import { randomBytes } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import Database from "better-sqlite3";
import {
  type BetterSQLite3Database,
  drizzle,
} from "drizzle-orm/better-sqlite3";
import type { Address, Hex } from "viem";
import { recoverTypedDataAddress } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import {
  MCP_TOKEN_ISSUE_PRIMARY_TYPE,
  MCP_TOKEN_ISSUE_TYPES,
  MCP_TOKEN_LIST_PRIMARY_TYPE,
  MCP_TOKEN_LIST_TYPES,
  MCP_TOKEN_REVOKE_PRIMARY_TYPE,
  MCP_TOKEN_REVOKE_TYPES,
  type McpTokenIssueTypedData,
  type McpTokenListTypedData,
  type McpTokenRevokeTypedData,
  buildMcpTokenDomain,
} from "../src/eip712/mcp-token.js";
import type {
  HatChecker,
  IssueVerifier,
  ListVerifier,
  RevokeVerifier,
} from "../src/handlers/auth.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = join(__filename, "..");

/** In-memory D1-shaped SQLite DB, pre-populated with this package's migration. */
export function makeTestDb(): {
  db: BetterSQLite3Database;
  raw: Database.Database;
} {
  const raw = new Database(":memory:");
  const sql = readFileSync(
    join(__dirname, "..", "migrations", "0001_init.sql"),
    "utf8",
  );
  raw.exec(sql);
  const db = drizzle(raw);
  return { db, raw };
}

/** Deterministic test wallet — stable across runs. */
export const TEST_PRIVATE_KEY: Hex =
  "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";

export function getTestAccount() {
  return privateKeyToAccount(TEST_PRIVATE_KEY);
}

export function makeNonce(): Hex {
  return `0x${randomBytes(32).toString("hex")}` as Hex;
}

export async function buildSignedIssueRequest(opts: {
  account: ReturnType<typeof getTestAccount>;
  chainId: number;
  treeId: string;
  label: string;
  nonce?: Hex;
  expires?: bigint;
  walletOverride?: Address;
}): Promise<{ typedData: McpTokenIssueTypedData; signature: Hex }> {
  const nonce = opts.nonce ?? makeNonce();
  const expires = opts.expires ?? BigInt(Math.floor(Date.now() / 1000) + 300);
  const typedData: McpTokenIssueTypedData = {
    domain: buildMcpTokenDomain(opts.chainId),
    types: MCP_TOKEN_ISSUE_TYPES,
    primaryType: MCP_TOKEN_ISSUE_PRIMARY_TYPE,
    message: {
      wallet: opts.walletOverride ?? opts.account.address,
      treeId: opts.treeId,
      label: opts.label,
      expires,
      nonce,
    },
  };
  const signature = await opts.account.signTypedData({
    domain: typedData.domain,
    types: typedData.types,
    primaryType: typedData.primaryType,
    message: typedData.message,
  });
  return { typedData, signature };
}

export async function buildSignedListRequest(opts: {
  account: ReturnType<typeof getTestAccount>;
  chainId: number;
  treeId: string;
  nonce?: Hex;
  expires?: bigint;
  walletOverride?: Address;
}): Promise<{ typedData: McpTokenListTypedData; signature: Hex }> {
  const nonce = opts.nonce ?? makeNonce();
  const expires = opts.expires ?? BigInt(Math.floor(Date.now() / 1000) + 300);
  const typedData: McpTokenListTypedData = {
    domain: buildMcpTokenDomain(opts.chainId),
    types: MCP_TOKEN_LIST_TYPES,
    primaryType: MCP_TOKEN_LIST_PRIMARY_TYPE,
    message: {
      wallet: opts.walletOverride ?? opts.account.address,
      treeId: opts.treeId,
      expires,
      nonce,
    },
  };
  const signature = await opts.account.signTypedData({
    domain: typedData.domain,
    types: typedData.types,
    primaryType: typedData.primaryType,
    message: typedData.message,
  });
  return { typedData, signature };
}

export async function buildSignedRevokeRequest(opts: {
  account: ReturnType<typeof getTestAccount>;
  chainId: number;
  treeId: string;
  tokenId: string;
  nonce?: Hex;
  expires?: bigint;
  walletOverride?: Address;
}): Promise<{ typedData: McpTokenRevokeTypedData; signature: Hex }> {
  const nonce = opts.nonce ?? makeNonce();
  const expires = opts.expires ?? BigInt(Math.floor(Date.now() / 1000) + 300);
  const typedData: McpTokenRevokeTypedData = {
    domain: buildMcpTokenDomain(opts.chainId),
    types: MCP_TOKEN_REVOKE_TYPES,
    primaryType: MCP_TOKEN_REVOKE_PRIMARY_TYPE,
    message: {
      wallet: opts.walletOverride ?? opts.account.address,
      treeId: opts.treeId,
      tokenId: opts.tokenId,
      expires,
      nonce,
    },
  };
  const signature = await opts.account.signTypedData({
    domain: typedData.domain,
    types: typedData.types,
    primaryType: typedData.primaryType,
    message: typedData.message,
  });
  return { typedData, signature };
}

/**
 * Offline verifiers — recover the EOA signer and compare, matching
 * production's contract without an RPC dependency (same convention as
 * `@toban/identity`'s `makeOfflineRecoverVerifier`).
 */
export const offlineIssueVerifier: IssueVerifier = async (
  typedData,
  signature,
  expectedAddress,
) => {
  const recovered = await recoverTypedDataAddress({
    domain: typedData.domain,
    types: typedData.types,
    primaryType: typedData.primaryType,
    message: typedData.message,
    signature,
  });
  return recovered.toLowerCase() === expectedAddress.toLowerCase();
};

export const offlineListVerifier: ListVerifier = async (
  typedData,
  signature,
  expectedAddress,
) => {
  const recovered = await recoverTypedDataAddress({
    domain: typedData.domain,
    types: typedData.types,
    primaryType: typedData.primaryType,
    message: typedData.message,
    signature,
  });
  return recovered.toLowerCase() === expectedAddress.toLowerCase();
};

export const offlineRevokeVerifier: RevokeVerifier = async (
  typedData,
  signature,
  expectedAddress,
) => {
  const recovered = await recoverTypedDataAddress({
    domain: typedData.domain,
    types: typedData.types,
    primaryType: typedData.primaryType,
    message: typedData.message,
    signature,
  });
  return recovered.toLowerCase() === expectedAddress.toLowerCase();
};

/** Always-authorised hat checker, for tests that aren't exercising the hat gate. */
export const alwaysAuthorized: HatChecker = async () => true;
