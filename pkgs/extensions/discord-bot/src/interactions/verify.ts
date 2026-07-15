/**
 * Discord interaction request verification.
 *
 * Discord signs every interaction POST with Ed25519 over
 * `(timestamp || raw body)` using the application's public key. We verify
 * this using the Workers runtime's built-in WebCrypto (`crypto.subtle`)
 * so we do not need `tweetnacl` (which pulls a CommonJS dep that the
 * Workers bundler dislikes).
 */

function hexToBytes(hex: string): Uint8Array {
  const clean = hex.startsWith("0x") ? hex.slice(2) : hex;
  if (clean.length % 2 !== 0) throw new Error("invalid hex length");
  const out = new Uint8Array(clean.length / 2);
  for (let i = 0; i < out.length; i++) {
    out[i] = Number.parseInt(clean.slice(i * 2, i * 2 + 2), 16);
  }
  return out;
}

function utf8(s: string): Uint8Array {
  return new TextEncoder().encode(s);
}

function concat(a: Uint8Array, b: Uint8Array): Uint8Array {
  const out = new Uint8Array(a.length + b.length);
  out.set(a, 0);
  out.set(b, a.length);
  return out;
}

/**
 * Maximum tolerated skew between `X-Signature-Timestamp` and our clock,
 * in seconds. Discord's docs require 5 minutes — any wider window
 * leaves a replay surface for captured interaction POSTs (proxy logs,
 * webhook relay, etc.).
 */
export const DISCORD_INTERACTION_MAX_SKEW_SECONDS = 300;

/**
 * Verify a Discord interaction request.
 *
 * @param publicKeyHex Hex-encoded Ed25519 public key (Discord "Public Key").
 * @param signatureHex Hex-encoded signature from `X-Signature-Ed25519`.
 * @param timestamp    Value of `X-Signature-Timestamp` header.
 * @param rawBody      The exact, untouched request body (string).
 * @param opts.now     Unix-seconds source (injectable for tests).
 *                     Defaults to `Math.floor(Date.now()/1000)`.
 */
export async function verifyDiscordInteraction(
  publicKeyHex: string,
  signatureHex: string,
  timestamp: string,
  rawBody: string,
  opts: { now?: () => number } = {},
): Promise<boolean> {
  if (!publicKeyHex || !signatureHex || !timestamp) return false;

  // Freshness window: reject signatures whose declared timestamp is more
  // than DISCORD_INTERACTION_MAX_SKEW_SECONDS away from our clock.
  // Without this, a captured signed POST replays forever within the
  // signing key's lifetime.
  const tsSeconds = Number(timestamp);
  if (!Number.isFinite(tsSeconds)) return false;
  const now = (opts.now ?? (() => Math.floor(Date.now() / 1000)))();
  if (Math.abs(now - tsSeconds) > DISCORD_INTERACTION_MAX_SKEW_SECONDS) {
    return false;
  }

  let key: CryptoKey;
  try {
    key = await crypto.subtle.importKey(
      "raw",
      hexToBytes(publicKeyHex),
      { name: "Ed25519" },
      false,
      ["verify"],
    );
  } catch {
    return false;
  }

  let sig: Uint8Array;
  try {
    sig = hexToBytes(signatureHex);
  } catch {
    return false;
  }

  const message = concat(utf8(timestamp), utf8(rawBody));
  try {
    return await crypto.subtle.verify({ name: "Ed25519" }, key, sig, message);
  } catch {
    return false;
  }
}
