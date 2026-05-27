/**
 * Privy's smart-wallet iframe transport JSON.stringify's the message
 * payload before posting to the signing iframe; bigint fields (viem
 * types EIP-712 `uint256` as bigint) throw without an opt-in
 * `BigInt.prototype.toJSON`.
 *
 * Originally we patched the prototype globally at the entry point. That
 * had two problems (#15 review finding):
 *   (a) every `JSON.stringify` in the app silently serialised bigint
 *       as decimal — Apollo variables, fetch bodies, error payloads —
 *       masking type bugs the previous throw-canary surfaced.
 *   (b) the patch persisted for the lifetime of the app, far beyond
 *       the actual Privy signing window.
 *
 * This helper installs the patch *only for the duration of `fn`* and
 * restores the prior state on completion (success or failure). It does
 * not eliminate the global side-effect — anything that JSON.stringify's
 * a bigint while we're awaiting a signing call still sees the patched
 * behaviour — but it shrinks the surface from "app lifetime" to "one
 * signing call" and gives us a single, named, grep-able boundary.
 *
 * Use this at every signTypedData / signMessage callsite that may pass
 * bigint fields.
 */
export async function withBigIntJSON<T>(fn: () => Promise<T>): Promise<T> {
  // biome-ignore lint/suspicious/noExplicitAny: prototype patch
  const proto = BigInt.prototype as any;
  const had = Object.prototype.hasOwnProperty.call(proto, "toJSON");
  const original = proto.toJSON;
  proto.toJSON = function () {
    return this.toString();
  };
  try {
    return await fn();
  } finally {
    if (had) {
      proto.toJSON = original;
    } else {
      proto.toJSON = undefined;
    }
  }
}
