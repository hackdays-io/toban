import { randomBytes } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import Database from "better-sqlite3";
import {
  type BetterSQLite3Database,
  drizzle,
} from "drizzle-orm/better-sqlite3";
import { type KeyLike, SignJWT, exportSPKI, generateKeyPair } from "jose";
import type { Address, Hex } from "viem";
import { privateKeyToAccount } from "viem/accounts";

import {
  IDENTITY_BINDING_PRIMARY_TYPE,
  IDENTITY_BINDING_TYPES,
  buildIdentityBindingDomain,
  hashVerifierToken,
} from "../eip712/identity-binding.js";
import type { IdentityBindingTypedData } from "../eip712/identity-binding.js";
import type { IdentityBindingVerifier } from "../handlers/connect.js";
import { DISCORD_VERIFIER_ISSUER } from "../providers/discord.js";
import { recoverIdentityBindingSigner } from "../verify.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = join(__filename, "..");

/**
 * Build an in-memory SQLite DB pre-populated with the package migrations.
 * Returns the drizzle instance plus the raw `better-sqlite3` handle (the
 * tests sometimes want to assert table contents directly).
 */
export function makeTestDb(): {
  db: BetterSQLite3Database;
  raw: Database.Database;
} {
  const raw = new Database(":memory:");
  const sql = readFileSync(
    join(__dirname, "..", "..", "migrations", "0001_init.sql"),
    "utf8",
  );
  raw.exec(sql);
  const db = drizzle(raw);
  return { db, raw };
}

export type Es256Keys = {
  privateKey: KeyLike;
  publicKey: KeyLike;
  publicKeyPem: string;
};

/** Generate an ES256 (P-256) keypair and the PEM SPKI form of its public half. */
export async function makeEs256Keys(): Promise<Es256Keys> {
  const { privateKey, publicKey } = await generateKeyPair("ES256", {
    extractable: true,
  });
  const publicKeyPem = await exportSPKI(publicKey);
  return { privateKey, publicKey, publicKeyPem };
}

/**
 * Sign a `verifier_token` JWT as the Discord bot would (issuer pinned).
 */
export async function signDiscordVerifierToken(opts: {
  privateKey: KeyLike;
  accountId: string;
  expSeconds: number;
  // Allow tests to deliberately produce malformed tokens.
  provider?: string;
  issuer?: string;
}): Promise<string> {
  return new SignJWT({
    provider: opts.provider ?? "discord",
    accountId: opts.accountId,
  })
    .setProtectedHeader({ alg: "ES256" })
    .setIssuer(opts.issuer ?? DISCORD_VERIFIER_ISSUER)
    .setExpirationTime(opts.expSeconds)
    .sign(opts.privateKey);
}

/**
 * A deterministic test wallet — same private key on every run so failing
 * assertions print stable addresses.
 */
export const TEST_PRIVATE_KEY: Hex =
  "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";

export function getTestAccount() {
  return privateKeyToAccount(TEST_PRIVATE_KEY);
}

/**
 * Build a fresh random 32-byte nonce as `0x...` hex.
 */
export function makeNonce(): Hex {
  return `0x${randomBytes(32).toString("hex")}` as Hex;
}

/**
 * Build a valid `IdentityBindingTypedData` payload + signature for the
 * happy path. Tests override individual fields to exercise failure paths.
 */
export async function buildSignedBinding(opts: {
  account: ReturnType<typeof getTestAccount>;
  chainId: number;
  provider: string;
  accountId: string;
  verifierToken: string;
  /** Defaults to a random fresh nonce. */
  nonce?: Hex;
  /** Defaults to now + 5 minutes. */
  expires?: bigint;
  /** Optional override of the wallet field — for wallet-mismatch tests. */
  walletOverride?: Address;
  /** Optional override of the verifierTokenHash field. */
  verifierTokenHashOverride?: Hex;
  /** Optional override of the accountId message field. */
  accountIdOverride?: string;
  /** Optional override of the provider message field. */
  providerOverride?: string;
}): Promise<{
  typedData: IdentityBindingTypedData;
  signature: Hex;
  nonce: Hex;
}> {
  const nonce = opts.nonce ?? makeNonce();
  const expires = opts.expires ?? BigInt(Math.floor(Date.now() / 1000) + 300);

  const typedData: IdentityBindingTypedData = {
    domain: buildIdentityBindingDomain(opts.chainId),
    types: IDENTITY_BINDING_TYPES,
    primaryType: IDENTITY_BINDING_PRIMARY_TYPE,
    message: {
      wallet: opts.walletOverride ?? opts.account.address,
      provider: opts.providerOverride ?? opts.provider,
      accountId: opts.accountIdOverride ?? opts.accountId,
      verifierTokenHash:
        opts.verifierTokenHashOverride ?? hashVerifierToken(opts.verifierToken),
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

  return { typedData, signature, nonce };
}

/**
 * Offline verifier matching the production `verifyTypedData` contract but
 * without an RPC dep: recovers the EOA signer and compares against
 * `expectedAddress`. Use this in tests so they stay hermetic — production
 * uses the RPC-based verifier that additionally handles EIP-1271 / 6492.
 */
export function makeOfflineRecoverVerifier(): IdentityBindingVerifier {
  return async (typedData, signature, expectedAddress) => {
    const recovered = await recoverIdentityBindingSigner(typedData, signature);
    return recovered.toLowerCase() === expectedAddress.toLowerCase();
  };
}

/**
 * Serialise a `ConnectRequest` body. `bigint` is not JSON-native — we
 * emit `expires` as a decimal string, which `handleConnect` accepts.
 */
export function serialiseConnectBody(body: {
  provider: string;
  verifier_token: string;
  identity_binding: { typedData: IdentityBindingTypedData; signature: Hex };
}): string {
  return JSON.stringify(body, (_key, value) =>
    typeof value === "bigint" ? value.toString() : value,
  );
}
