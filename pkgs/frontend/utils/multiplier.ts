/**
 * Per-role distribution multiplier (分配係数) shared by the splits authoring
 * flow and the scheduled-distribution flow.
 *
 * The value is kept as the raw string the user typed so partial input ("1.",
 * "") stays editable, and is packed into the contract's
 * `multiplierTop` / `multiplierBottom` pair only at submit time.
 *
 * Why the packing is a *batch* operation instead of one fraction per role:
 * `SplitsCreator` collapses the pair with integer division
 * (`roleMultiplier = multiplierTop / multiplierBottom`, SplitsCreator.sol:322),
 * so handing it `3 / 2` for "1.5倍" would truncate to `1` and the input would
 * silently do nothing — and `1 / 2` for "0.5倍" would zero the role out. Role
 * allocations are normalised against their own total afterwards
 * (SplitsCreator.sol:212), so scaling *every* active role by the same constant
 * leaves the outcome untouched. That lets us express fractional multipliers as
 * a common-denominator integer ratio the contract can evaluate exactly:
 * `1.5, 1` → `3, 2`, `0.5, 1` → `1, 2`.
 *
 * Digits are also assembled string-wise rather than through float math:
 * `1.15 * 100` is `114.99999999999999` in IEEE-754 and `BigInt()` throws on it.
 */

/** Seed value for a freshly added role — "1倍", i.e. no adjustment. */
export const DEFAULT_MULTIPLIER = "1";

/**
 * Decimal places accepted. Two is plenty for a weighting knob and keeps the
 * common-denominator scaling (and therefore the on-chain integers) small.
 */
export const MAX_MULTIPLIER_DECIMALS = 2;

export const MULTIPLIER_HINT = `0より大きい数を小数第${MAX_MULTIPLIER_DECIMALS}位まで入力してください（例: 1、1.5）`;

export interface MultiplierFraction {
  top: bigint;
  bottom: bigint;
}

interface ParsedMultiplier {
  /** All digits with the decimal point removed, e.g. "1.5" → 15n. */
  digits: bigint;
  /** Number of decimal places, e.g. "1.5" → 1. */
  decimals: number;
}

const MULTIPLIER_PATTERN = /^(\d*)(?:\.(\d*))?$/;

const parseMultiplier = (input: string): ParsedMultiplier | null => {
  const match = MULTIPLIER_PATTERN.exec(input.trim());
  if (!match) return null;
  const intPart = match[1] ?? "";
  const fracPart = match[2] ?? "";
  if (fracPart.length > MAX_MULTIPLIER_DECIMALS) return null;
  const digits = `${intPart}${fracPart}`;
  // Rejects "" and "." — the pattern matches both.
  if (digits.length === 0) return null;
  const value = BigInt(digits);
  // A zero multiplier drops every wearer of the role to a 0 allocation, which
  // is what deselecting the role is for.
  if (value === 0n) return null;
  return { digits: value, decimals: fracPart.length };
};

/** True when the raw input is a positive number within the decimal limit. */
export const isValidMultiplier = (input: string): boolean =>
  parseMultiplier(input) !== null;

const gcd = (a: bigint, b: bigint): bigint => (b === 0n ? a : gcd(b, a % b));

/**
 * Pack the active roles' multipliers into contract fractions, preserving their
 * ratios exactly. Returns `null` if any input is invalid — callers gate on
 * {@link isValidMultiplier} first and treat `null` as a bug guard.
 */
export const packMultipliers = (
  inputs: string[],
): MultiplierFraction[] | null => {
  const parsed: ParsedMultiplier[] = [];
  for (const input of inputs) {
    const value = parseMultiplier(input);
    if (!value) return null;
    parsed.push(value);
  }
  if (parsed.length === 0) return [];

  // Lift everything onto the widest decimal place so the ratios become whole
  // numbers, then divide through by the common factor — a uniform scale
  // cancels out, so this only keeps the on-chain integers small.
  const maxDecimals = parsed.reduce((max, p) => Math.max(max, p.decimals), 0);
  const tops = parsed.map(
    (p) => p.digits * 10n ** BigInt(maxDecimals - p.decimals),
  );
  const divisor = tops.reduce(gcd);
  return tops.map((top) => ({ top: top / divisor, bottom: 1n }));
};
