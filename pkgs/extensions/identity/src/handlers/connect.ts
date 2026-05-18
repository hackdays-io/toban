import { getAddress, isAddress } from "viem";
import type { Hex } from "viem";
import type { Address } from "viem";
import {
  IDENTITY_BINDING_DOMAIN_NAME,
  IDENTITY_BINDING_DOMAIN_VERSION,
  IDENTITY_BINDING_PRIMARY_TYPE,
  hashVerifierToken,
} from "../eip712/identity-binding.js";
import type { IdentityBindingTypedData } from "../eip712/identity-binding.js";
import { DiscordProviderError } from "../providers/discord.js";
import { providers } from "../providers/index.js";
import type { IdentityEnv, ProviderDefinition } from "../providers/types.js";
import {
  type IdentityDb,
  isNonceUsed,
  markNonceUsed,
  upsertIdentity,
} from "../queries.js";
import {
  JwtVerificationError,
  verifyIdentityBindingViaRpc,
} from "../verify.js";

/**
 * Wire shape — kept in sync with `pkgs/extensions/discord-bot` and the
 * frontend `/connect/<provider>` page.
 */
export type ConnectRequest = {
  provider: string;
  verifier_token: string;
  identity_binding: {
    typedData: IdentityBindingTypedData;
    signature: Hex;
  };
};

export type ConnectErrorCode =
  | "invalid_body"
  | "unknown_provider"
  | "verifier_token_invalid"
  | "verifier_token_expired"
  | "provider_mismatch"
  | "account_id_mismatch"
  | "verifier_token_hash_mismatch"
  | "wallet_mismatch"
  | "binding_expired"
  | "nonce_reused"
  | "domain_mismatch"
  | "internal_error";

/**
 * Signature verification function. The default implementation calls
 * `viem.publicClient.verifyTypedData` against `env.RPC_URL`, which handles
 * EOA, EIP-1271 smart wallets, and ERC-6492 counterfactual signatures
 * uniformly. Tests pass an in-process verifier (plain ECDSA recover) so
 * they stay offline.
 */
export type IdentityBindingVerifier = (
  typedData: IdentityBindingTypedData,
  signature: Hex,
  expectedAddress: Address,
) => Promise<boolean>;

export type ConnectHandlerDeps = {
  db: IdentityDb;
  env: IdentityEnv;
  /** `() => unix seconds`. Injectable for tests. Defaults to `Date.now() / 1000`. */
  now?: () => number;
  /** Provider registry override (tests pass a minimal map). */
  registry?: Record<string, ProviderDefinition>;
  /**
   * Override the IdentityBinding signature verification step.
   * Defaults to the RPC-based verifier — required for smart wallets.
   */
  verifySignature?: IdentityBindingVerifier;
};

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function errorResponse(
  status: number,
  code: ConnectErrorCode,
  details?: string,
): Response {
  return jsonResponse(
    status,
    details === undefined ? { error: code } : { error: code, details },
  );
}

function makeDefaultVerifier(env: IdentityEnv): IdentityBindingVerifier {
  return async (typedData, signature, expectedAddress) => {
    if (!env.RPC_URL) {
      throw new Error(
        "IdentityEnv.RPC_URL is required for signature verification. " +
          "Set it on the consumer Worker (smart wallets need RPC for " +
          "EIP-1271 / ERC-6492 verification).",
      );
    }
    return verifyIdentityBindingViaRpc(
      typedData,
      signature,
      expectedAddress,
      env.RPC_URL,
    );
  };
}

/**
 * Coerce a parsed JSON value into a `ConnectRequest` after structural
 * validation. Returns `null` if any required field is missing or wrong
 * type — callers then return a 400 `invalid_body`.
 */
function parseConnectRequest(raw: unknown): ConnectRequest | null {
  if (typeof raw !== "object" || raw === null) return null;
  const r = raw as Record<string, unknown>;
  if (typeof r.provider !== "string" || r.provider.length === 0) return null;
  if (typeof r.verifier_token !== "string" || r.verifier_token.length === 0)
    return null;
  if (typeof r.identity_binding !== "object" || r.identity_binding === null)
    return null;
  const ib = r.identity_binding as Record<string, unknown>;
  if (typeof ib.signature !== "string" || !ib.signature.startsWith("0x"))
    return null;
  if (typeof ib.typedData !== "object" || ib.typedData === null) return null;
  const td = ib.typedData as Record<string, unknown>;
  if (
    typeof td.domain !== "object" ||
    td.domain === null ||
    typeof td.types !== "object" ||
    td.types === null ||
    typeof td.message !== "object" ||
    td.message === null ||
    td.primaryType !== IDENTITY_BINDING_PRIMARY_TYPE
  ) {
    return null;
  }
  const msg = td.message as Record<string, unknown>;
  if (
    typeof msg.wallet !== "string" ||
    typeof msg.provider !== "string" ||
    typeof msg.accountId !== "string" ||
    typeof msg.verifierTokenHash !== "string" ||
    (typeof msg.expires !== "string" &&
      typeof msg.expires !== "number" &&
      typeof msg.expires !== "bigint") ||
    typeof msg.nonce !== "string"
  ) {
    return null;
  }
  // Normalise `expires` to bigint — JSON has no native bigint, so we accept
  // string|number|bigint and coerce.
  const expires =
    typeof msg.expires === "bigint" ? msg.expires : BigInt(msg.expires);
  return {
    provider: r.provider,
    verifier_token: r.verifier_token,
    identity_binding: {
      signature: ib.signature as Hex,
      typedData: {
        domain: td.domain as IdentityBindingTypedData["domain"],
        types: td.types as IdentityBindingTypedData["types"],
        primaryType: IDENTITY_BINDING_PRIMARY_TYPE,
        message: {
          wallet: msg.wallet as IdentityBindingTypedData["message"]["wallet"],
          provider: msg.provider,
          accountId: msg.accountId,
          verifierTokenHash: msg.verifierTokenHash as Hex,
          expires,
          nonce: msg.nonce as Hex,
        },
      },
    },
  };
}

/**
 * Provider-agnostic `/api/connect` handler.
 *
 * Validation order is structured so that the cheapest checks run first and
 * crypto work runs once. All failures return HTTP 400 with a stable `error`
 * code (see `ConnectErrorCode`) so callers can branch deterministically.
 */
export async function handleConnect(
  request: Request,
  deps: ConnectHandlerDeps,
): Promise<Response> {
  if (request.method !== "POST") {
    return errorResponse(405, "invalid_body", "Method not allowed");
  }

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return errorResponse(400, "invalid_body", "Request body is not valid JSON");
  }

  const parsed = parseConnectRequest(raw);
  if (parsed === null) {
    return errorResponse(
      400,
      "invalid_body",
      "Request body does not match ConnectRequest shape",
    );
  }

  const registry = deps.registry ?? providers;
  const provider = registry[parsed.provider];
  if (!provider) {
    return errorResponse(
      400,
      "unknown_provider",
      `No provider registered for '${parsed.provider}'`,
    );
  }

  // Cheap shape checks that don't need crypto.
  const td = parsed.identity_binding.typedData;
  if (
    td.domain.name !== IDENTITY_BINDING_DOMAIN_NAME ||
    td.domain.version !== IDENTITY_BINDING_DOMAIN_VERSION ||
    typeof td.domain.chainId !== "number"
  ) {
    return errorResponse(
      400,
      "domain_mismatch",
      "EIP-712 domain name/version/chainId invalid",
    );
  }
  if (td.message.provider !== parsed.provider) {
    return errorResponse(
      400,
      "provider_mismatch",
      "Message provider differs from request provider",
    );
  }
  if (!isAddress(td.message.wallet)) {
    return errorResponse(
      400,
      "invalid_body",
      "Message wallet is not an address",
    );
  }

  const now = (deps.now ?? (() => Math.floor(Date.now() / 1000)))();
  if (td.message.expires <= BigInt(now)) {
    return errorResponse(
      400,
      "binding_expired",
      "IdentityBinding `expires` is in the past",
    );
  }

  const expectedHash = hashVerifierToken(parsed.verifier_token);
  if (
    td.message.verifierTokenHash.toLowerCase() !== expectedHash.toLowerCase()
  ) {
    return errorResponse(
      400,
      "verifier_token_hash_mismatch",
      "Message verifierTokenHash does not match keccak256(verifier_token)",
    );
  }

  // JWT verify.
  let verified: { accountId: string; expiresAt: number };
  try {
    verified = await provider.verifyVerifierToken(
      parsed.verifier_token,
      deps.env,
    );
  } catch (err) {
    if (err instanceof JwtVerificationError) {
      const code: ConnectErrorCode =
        err.code === "expired"
          ? "verifier_token_expired"
          : "verifier_token_invalid";
      return errorResponse(400, code, err.message);
    }
    if (err instanceof DiscordProviderError) {
      return errorResponse(400, "verifier_token_invalid", err.message);
    }
    if (err instanceof Error) {
      return errorResponse(400, "verifier_token_invalid", err.message);
    }
    return errorResponse(
      500,
      "internal_error",
      "Unknown provider verification error",
    );
  }

  if (td.message.accountId !== verified.accountId) {
    return errorResponse(
      400,
      "account_id_mismatch",
      "Message accountId differs from verified accountId",
    );
  }

  // Verify the signature against message.wallet. Handles EOA, EIP-1271
  // smart wallets, and ERC-6492 counterfactual signatures through viem.
  const verify = deps.verifySignature ?? makeDefaultVerifier(deps.env);
  let isValid: boolean;
  try {
    isValid = await verify(
      td,
      parsed.identity_binding.signature,
      td.message.wallet as Address,
    );
  } catch (err) {
    const details =
      err instanceof Error
        ? err.message
        : "Signature verification call threw an unknown error";
    return errorResponse(400, "wallet_mismatch", details);
  }
  if (!isValid) {
    return errorResponse(
      400,
      "wallet_mismatch",
      "Signature is not valid for message.wallet (EOA recovery / EIP-1271 / ERC-6492 all failed)",
    );
  }

  // Nonce check + record. We re-check inside the insert via PRIMARY KEY,
  // but the prior `isNonceUsed` lets us return the right error code instead
  // of leaking a constraint-violation message.
  if (await isNonceUsed(deps.db, td.message.nonce)) {
    return errorResponse(
      400,
      "nonce_reused",
      "IdentityBinding nonce already consumed",
    );
  }

  try {
    await markNonceUsed(deps.db, td.message.nonce, now);
  } catch (err) {
    // Race: another concurrent request consumed the same nonce between our
    // check and insert. Surface as nonce_reused.
    return errorResponse(
      400,
      "nonce_reused",
      "IdentityBinding nonce already consumed (race)",
    );
  }

  // Persist the binding. Wallet is stored in checksum form so downstream
  // consumers don't have to re-checksum every read.
  const checksumWallet = getAddress(td.message.wallet);
  await upsertIdentity(deps.db, {
    provider: parsed.provider,
    accountId: verified.accountId,
    wallet: checksumWallet,
    metadata: null,
    createdAt: now,
    updatedAt: now,
  });

  return jsonResponse(200, { ok: true });
}
