import { errors, importSPKI, jwtVerify } from "jose";
import { recoverTypedDataAddress } from "viem";
import type { Address, Hex } from "viem";
import type { IdentityBindingTypedData } from "./eip712/identity-binding.js";

/**
 * Recover the EIP-712 signer of an `IdentityBinding` typed-data payload.
 *
 * This is a thin wrapper around viem's `recoverTypedDataAddress` that
 * pins the `primaryType` so callers cannot accidentally recover a sibling
 * type. The return is the recovered address; the caller is responsible
 * for comparing it (case-insensitively) against `typedData.message.wallet`.
 */
export async function recoverIdentityBindingSigner(
  typedData: IdentityBindingTypedData,
  signature: Hex,
): Promise<Address> {
  return recoverTypedDataAddress({
    domain: typedData.domain,
    types: typedData.types,
    primaryType: typedData.primaryType,
    message: typedData.message,
    signature,
  });
}

export type IdentityJwtClaims = {
  iss: string;
  provider: string;
  accountId: string;
  exp: number;
};

export class JwtVerificationError extends Error {
  readonly code: JwtErrorCode;
  constructor(code: JwtErrorCode, message: string) {
    super(message);
    this.name = "JwtVerificationError";
    this.code = code;
  }
}

export type JwtErrorCode =
  | "invalid_public_key"
  | "expired"
  | "invalid_signature"
  | "missing_claim"
  | "wrong_issuer"
  | "wrong_algorithm"
  | "invalid_token";

/**
 * Verify an ES256 (P-256) JWT against a PEM-encoded SPKI public key.
 *
 * The key is imported every call. Cloudflare Workers cache `CryptoKey`
 * instances per isolate, so the work is mostly amortised, and explicit
 * caching here would add cross-request mutable state that is hostile to
 * the Worker model. If profiling shows it matters, wrap the result in a
 * `Map<pem, CryptoKey>` at the consumer level — keep this function pure.
 *
 * Throws `JwtVerificationError` with a stable `code` for each failure
 * mode. Callers (e.g. `handlers/connect.ts`) propagate `code` directly
 * into the HTTP `error` field so clients can branch deterministically.
 */
export async function verifyJwtES256(
  token: string,
  publicKeyPem: string,
  expectedIssuer: string,
): Promise<IdentityJwtClaims> {
  let key: CryptoKey;
  try {
    key = await importSPKI(publicKeyPem, "ES256");
  } catch (cause) {
    throw new JwtVerificationError(
      "invalid_public_key",
      "Failed to import verifier public key",
    );
  }

  let payload: Record<string, unknown>;
  try {
    const result = await jwtVerify(token, key, {
      algorithms: ["ES256"],
      issuer: expectedIssuer,
    });
    payload = result.payload as Record<string, unknown>;
  } catch (cause) {
    if (cause instanceof errors.JWTExpired) {
      throw new JwtVerificationError("expired", "Verifier token expired");
    }
    if (cause instanceof errors.JWTClaimValidationFailed) {
      // jose throws this for issuer mismatch among other claim issues.
      if (cause.claim === "iss") {
        throw new JwtVerificationError(
          "wrong_issuer",
          `Issuer mismatch: ${cause.message}`,
        );
      }
      throw new JwtVerificationError("missing_claim", cause.message);
    }
    if (cause instanceof errors.JOSEAlgNotAllowed) {
      throw new JwtVerificationError("wrong_algorithm", "JWT alg is not ES256");
    }
    if (cause instanceof errors.JWSSignatureVerificationFailed) {
      throw new JwtVerificationError(
        "invalid_signature",
        "JWT signature invalid",
      );
    }
    throw new JwtVerificationError("invalid_token", "JWT verification failed");
  }

  const provider = payload.provider;
  const accountId = payload.accountId;
  const exp = payload.exp;
  const iss = payload.iss;

  if (typeof provider !== "string" || provider.length === 0) {
    throw new JwtVerificationError(
      "missing_claim",
      "JWT missing string claim: provider",
    );
  }
  if (typeof accountId !== "string" || accountId.length === 0) {
    throw new JwtVerificationError(
      "missing_claim",
      "JWT missing string claim: accountId",
    );
  }
  if (typeof exp !== "number") {
    throw new JwtVerificationError(
      "missing_claim",
      "JWT missing numeric claim: exp",
    );
  }
  if (typeof iss !== "string") {
    throw new JwtVerificationError(
      "missing_claim",
      "JWT missing string claim: iss",
    );
  }

  return { iss, provider, accountId, exp };
}
