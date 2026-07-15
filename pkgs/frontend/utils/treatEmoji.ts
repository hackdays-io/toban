// Shared THX → 食べ物 emoji vocabulary. Used by `TreatEmojiSlider` (slider
// "play" element) and the workspace home activity row. Same emoji list, two
// lookup modes:
//
//   - `getTreatEmojiByAmount` — absolute amount → emoji (200 THX per step).
//     Use when displaying a recorded amount in context (activity feed, etc).
//   - `getTreatEmojiByRatio`  — value / max → emoji along the slider's range.
//     Use only for the slider visualisation so the emoji cycles through the
//     full ramp as the user drags, regardless of the slider's actual cap.

export const TREAT_EMOJIS = [
  "🍪",
  "🍩",
  "🍫",
  "🍰",
  "🍦",
  "🍭",
  "🥐",
  "🥨",
  "🍺",
  "🍷",
  "🎁",
] as const;

/** THX per step in the absolute mapping (200 THX → next emoji). */
export const TREAT_EMOJI_STEP_AMOUNT = 200;

export interface TreatEmojiResult {
  index: number;
  emoji: string;
}

/**
 * Absolute lookup: every {@link TREAT_EMOJI_STEP_AMOUNT} THX moves to the next
 * emoji. Clamped to the last step at the top end.
 */
export function getTreatEmojiByAmount(amount: number): TreatEmojiResult {
  const safe = Number.isFinite(amount) ? Math.max(0, amount) : 0;
  const index = Math.min(
    TREAT_EMOJIS.length - 1,
    Math.floor(safe / TREAT_EMOJI_STEP_AMOUNT),
  );
  return { index, emoji: TREAT_EMOJIS[index] };
}

/**
 * Ratio lookup: snaps `value / max` to the nearest emoji milestone along the
 * full ramp. The slider uses this so the emoji visibly *changes* as you drag,
 * even when `max` is much smaller than the absolute mapping's range.
 */
export function getTreatEmojiByRatio(
  value: number,
  max: number,
): TreatEmojiResult {
  const denom = max > 0 ? max : 1;
  const ratio = Math.min(1, Math.max(0, value / denom));
  const stepCount = TREAT_EMOJIS.length - 1;
  const index = Math.round(ratio * stepCount);
  return { index, emoji: TREAT_EMOJIS[index] };
}
