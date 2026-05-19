/**
 * Turnkey-backed viem signer.
 *
 * Turnkey's TEE (AWS Nitro Enclave) holds the bot's Ethereum private key.
 * This Worker authenticates to Turnkey's HTTP API using a P-256 "stamper"
 * key pair; the stamp is a request-bound signature attached as a header.
 *
 * Authentication: we sign the *exact* JSON request body with the stamper
 * private key (P-256 ECDSA, SHA-256), then put the base64url-JSON envelope
 * { publicKey, scheme: "SIGNATURE_SCHEME_TK_API_P256", signature } into
 * the `X-Stamp` header. This is implemented with WebCrypto rather than
 * `jose` because:
 *
 *   - we need raw ECDSA-over-arbitrary-bytes, not a JWS;
 *   - WebCrypto is built into the Workers runtime, no extra bundle;
 *   - `jose`'s sign helpers wrap output as JWS — we'd have to unpack it.
 *
 * `jose.importPKCS8` is still used to parse the PEM, since WebCrypto's
 * `importKey('pkcs8', ...)` wants raw DER bytes and decoding PEM by hand
 * is error-prone enough to pull in the dep we already have.
 *
 * Result: a `viem`-compatible {@link LocalAccount}. `signTransaction` is
 * the only path used in production (we only ever broadcast `mintFrom`
 * txs). `signMessage` and `signTypedData` proxy to the same Turnkey
 * endpoint so the wrapper is complete; they may be useful for future
 * `EIP-712` flows.
 */
import { importPKCS8 } from "jose";
import {
  type Hex,
  type LocalAccount,
  type SerializeTransactionFn,
  type SignableMessage,
  type TransactionSerializable,
  type TypedData,
  type TypedDataDefinition,
  hashMessage,
  hashTypedData,
  hexToBytes,
  keccak256,
  serializeTransaction,
  signatureToHex,
  toHex,
} from "viem";
import type { Env } from "../env";

// ---------------------------------------------------------------------------
// Turnkey API stamp authentication
// ---------------------------------------------------------------------------

/** P-256 ECDSA signature in JOSE compact form (r || s, 64 bytes), base64url. */
function bytesToBase64Url(bytes: Uint8Array): string {
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}

function strToBase64Url(s: string): string {
  return bytesToBase64Url(new TextEncoder().encode(s));
}

export interface TurnkeyStamp {
  /** Value to put in the `X-Stamp` header. */
  header: string;
}

/**
 * Build the `X-Stamp` header value for a Turnkey API request.
 *
 * Exported for unit-testing — production code uses {@link callTurnkey}.
 */
async function importStamperKey(material: string): Promise<CryptoKey> {
  const trimmed = material.trim();
  // Turnkey UI hands the API stamper private key out as a 64-hex-char
  // raw scalar (32 bytes). jose's importPKCS8 only accepts PEM, so accept
  // both forms here and convert hex → raw P-256 PKCS8 ourselves using
  // WebCrypto's pkcs8 importer.
  if (/^(0x)?[0-9a-fA-F]{64}$/.test(trimmed)) {
    const hex = trimmed.startsWith("0x") ? trimmed.slice(2) : trimmed;
    const scalar = new Uint8Array(32);
    for (let i = 0; i < 32; i += 1) {
      scalar[i] = Number.parseInt(hex.slice(i * 2, i * 2 + 2), 16);
    }
    return crypto.subtle.importKey(
      "pkcs8",
      buildP256Pkcs8(scalar),
      { name: "ECDSA", namedCurve: "P-256" },
      false,
      ["sign"],
    );
  }
  return importPKCS8(trimmed, "ES256");
}

/**
 * Build a minimal PKCS#8 PrivateKeyInfo blob for a P-256 (secp256r1)
 * raw scalar. Avoids a full ASN.1 lib by relying on the fixed prefix
 * `0x308141020100301306072a8648ce3d020106082a8648ce3d0301070427302502...`
 * sequence used by every P-256 PKCS8. Confirmed against OpenSSL output.
 */
function buildP256Pkcs8(scalar32: Uint8Array): ArrayBuffer {
  // PKCS8 DER prefix for an EC P-256 private key, followed by the
  // 32-byte scalar inside an OCTET STRING within a SEQUENCE. Encoded
  // statically; only the trailing 32 bytes vary.
  const prefix = new Uint8Array([
    0x30, 0x41, 0x02, 0x01, 0x00, 0x30, 0x13, 0x06, 0x07, 0x2a, 0x86, 0x48,
    0xce, 0x3d, 0x02, 0x01, 0x06, 0x08, 0x2a, 0x86, 0x48, 0xce, 0x3d, 0x03,
    0x01, 0x07, 0x04, 0x27, 0x30, 0x25, 0x02, 0x01, 0x01, 0x04, 0x20,
  ]);
  const out = new Uint8Array(prefix.length + scalar32.length);
  out.set(prefix, 0);
  out.set(scalar32, prefix.length);
  return out.buffer;
}

/**
 * DER-encode a raw ECDSA `r || s` blob (64 bytes for P-256). Turnkey
 * expects this DER form, lowercase hex, in the stamp envelope's
 * `signature` field — WebCrypto's `crypto.subtle.sign` returns raw
 * concatenated r‖s instead, so we convert here.
 */
function rsToDerHex(rs: Uint8Array): string {
  if (rs.length !== 64) {
    throw new Error(
      `unexpected ECDSA signature length: ${rs.length} (want 64 for P-256 r||s)`,
    );
  }
  const encodeInteger = (value: Uint8Array): Uint8Array => {
    let start = 0;
    while (start < value.length - 1 && value[start] === 0) start += 1;
    let body = value.slice(start);
    // DER INTEGER is two's-complement signed; prepend 0x00 if the high
    // bit of the first byte would otherwise mark the value negative.
    if (body[0] & 0x80) {
      const padded = new Uint8Array(body.length + 1);
      padded[0] = 0x00;
      padded.set(body, 1);
      body = padded;
    }
    const out = new Uint8Array(body.length + 2);
    out[0] = 0x02; // INTEGER tag
    out[1] = body.length;
    out.set(body, 2);
    return out;
  };
  const rEnc = encodeInteger(rs.slice(0, 32));
  const sEnc = encodeInteger(rs.slice(32, 64));
  const seqLen = rEnc.length + sEnc.length;
  const der = new Uint8Array(seqLen + 2);
  der[0] = 0x30; // SEQUENCE tag
  der[1] = seqLen;
  der.set(rEnc, 2);
  der.set(sEnc, 2 + rEnc.length);
  return Array.from(der)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function createStamp(
  privateKeyPem: string,
  publicKeyHex: string,
  requestBody: string,
): Promise<TurnkeyStamp> {
  const key = await importStamperKey(privateKeyPem);
  const sigBytes = new Uint8Array(
    await crypto.subtle.sign(
      { name: "ECDSA", hash: { name: "SHA-256" } },
      key as unknown as CryptoKey,
      new TextEncoder().encode(requestBody),
    ),
  );
  const envelope = JSON.stringify({
    publicKey: publicKeyHex,
    scheme: "SIGNATURE_SCHEME_TK_API_P256",
    signature: rsToDerHex(sigBytes),
  });
  return { header: strToBase64Url(envelope) };
}

// ---------------------------------------------------------------------------
// Turnkey HTTP client
// ---------------------------------------------------------------------------

interface TurnkeySignRawPayloadResult {
  /** Hex r (0x-prefixed, 32 bytes). */
  r: Hex;
  /** Hex s (0x-prefixed, 32 bytes). */
  s: Hex;
  /** Hex v (0x-prefixed, 1 byte, "00" or "01" — recovery id). */
  v: Hex;
}

/**
 * POST to Turnkey's `sign_raw_payload` endpoint and return the
 * three signature components. The `signWith` parameter is the Turnkey
 * "private key id" or Ethereum address of the signing key.
 */
async function signRawPayload(
  env: Env,
  signWith: string,
  /** 32-byte hash (0x-prefixed) to be signed. */
  payload: Hex,
): Promise<TurnkeySignRawPayloadResult> {
  const url = `${env.TURNKEY_API_BASE_URL}/public/v1/submit/sign_raw_payload`;
  const body = JSON.stringify({
    type: "ACTIVITY_TYPE_SIGN_RAW_PAYLOAD_V2",
    timestampMs: Date.now().toString(),
    organizationId: env.TURNKEY_ORGANIZATION_ID,
    parameters: {
      signWith,
      payload,
      encoding: "PAYLOAD_ENCODING_HEXADECIMAL",
      hashFunction: "HASH_FUNCTION_NO_OP",
    },
  });
  const stamp = await createStamp(
    env.TURNKEY_API_PRIVATE_KEY,
    env.TURNKEY_API_PUBLIC_KEY,
    body,
  );
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "X-Stamp": stamp.header,
    },
    body,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Turnkey sign_raw_payload failed: ${res.status} ${text}`);
  }
  const json = (await res.json()) as {
    activity?: {
      result?: {
        signRawPayloadResult?: TurnkeySignRawPayloadResult;
      };
    };
  };
  const result = json.activity?.result?.signRawPayloadResult;
  if (!result) {
    throw new Error("Turnkey sign_raw_payload: empty result");
  }
  return result;
}

// ---------------------------------------------------------------------------
// viem LocalAccount wrapper
// ---------------------------------------------------------------------------

function packSignature(r: Hex, s: Hex, v: Hex): Hex {
  // Turnkey returns v as "00" or "01"; viem expects 27/28 for legacy or
  // the raw recovery id (yParity) for EIP-1559.
  const vNum = Number.parseInt(v.slice(2), 16);
  return signatureToHex({
    r,
    s,
    yParity: vNum === 0 ? 0 : 1,
  });
}

/**
 * Build a viem `LocalAccount` whose signing operations call Turnkey.
 *
 * The returned object satisfies viem's account interface — pass it to
 * `createWalletClient({ account, ... })` and ordinary `walletClient.
 * writeContract()` calls work transparently.
 *
 * @param overrideFetcher Optional dependency injection for tests; replace
 *   the underlying `signRawPayload` call without monkey-patching fetch.
 */
export function createTurnkeySigner(
  env: Env,
  overrideFetcher?: (payload: Hex) => Promise<TurnkeySignRawPayloadResult>,
): LocalAccount {
  const address = env.TURNKEY_BOT_SIGNER_ADDRESS as Hex;
  const fetcher =
    overrideFetcher ??
    ((payload: Hex) =>
      signRawPayload(env, env.TURNKEY_BOT_SIGNER_ADDRESS, payload));

  return {
    address,
    type: "local",
    source: "custom",
    publicKey: "0x" as Hex,

    async signMessage({ message }: { message: SignableMessage }) {
      const hash = hashMessage(message);
      const { r, s, v } = await fetcher(hash);
      return packSignature(r, s, v);
    },

    async signTransaction<TSerializable extends TransactionSerializable>(
      transaction: TSerializable,
      args?: { serializer?: SerializeTransactionFn<TSerializable> },
    ): Promise<Hex> {
      const serializer = args?.serializer ?? serializeTransaction;
      // viem serializes the unsigned tx then asks us to sign the
      // keccak256 of those bytes. We hash here (rather than using
      // Turnkey's KECCAK256 hashFunction) so that the tx hash we
      // return to viem matches exactly what we signed.
      const unsigned = serializer(transaction);
      const hash = keccak256(hexToBytes(unsigned));
      const { r, s, v } = await fetcher(hash);
      return serializer(transaction, {
        r,
        s,
        yParity: Number.parseInt(v.slice(2), 16) === 0 ? 0 : 1,
      });
    },

    async signTypedData<
      const TTypedData extends TypedData | { [key: string]: unknown },
      TPrimaryType extends string = string,
    >(typedData: TypedDataDefinition<TTypedData, TPrimaryType>) {
      const hash = hashTypedData(typedData);
      const { r, s, v } = await fetcher(hash);
      return packSignature(r, s, v);
    },

    // viem 2.x LocalAccount fields that aren't meaningful for a remote
    // signer — provide minimal stubs.
    nonceManager: undefined,
    sign: undefined,
  } as unknown as LocalAccount;
}

export const __testing = {
  bytesToBase64Url,
  packSignature,
  signRawPayload,
  toHex,
};
