import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type * as React from "react";
import { getTreatEmojiByRatio } from "utils/treatEmoji";

import { Button } from "~/components/ui/button";
import { Icon } from "~/components/ui/icon";
import { Typography } from "~/components/ui/typography";
import { cn } from "~/lib/utils";

interface TreatEmojiSliderProps {
  value: number;
  onChange: (value: number) => void;
  /** Hard upper bound for the slider's range (e.g. 2000). */
  max: number;
  /** Effective ceiling beyond which the input is invalid (e.g. mintable amount). */
  sendable?: number;
  step?: number;
  unit?: string;
  disabled?: boolean;
  className?: string;
}

function clampAmount(n: number, max: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.min(max, Math.max(0, Math.trunc(n)));
}

const REPEAT_DELAY_MS = 400;
const REPEAT_INTERVAL_MS = 80;
const REPEAT_FAST_INTERVAL_MS = 40;
/** Switch to 2× repeat speed after this long-press duration. */
const REPEAT_ACCEL_MS = 1_200;

function useRepeatingPress(action: () => boolean, enabled: boolean) {
  const actionRef = useRef(action);
  actionRef.current = action;

  const timersRef = useRef<{
    delay?: ReturnType<typeof setTimeout>;
    interval?: ReturnType<typeof setInterval>;
    accel?: ReturnType<typeof setTimeout>;
  }>({});

  const stop = useCallback(() => {
    const { delay, interval, accel } = timersRef.current;
    if (delay) clearTimeout(delay);
    if (interval) clearInterval(interval);
    if (accel) clearTimeout(accel);
    timersRef.current = {};
  }, []);

  useEffect(() => () => stop(), [stop]);

  const tick = useCallback(() => {
    if (!actionRef.current()) stop();
  }, [stop]);

  const startInterval = useCallback(
    (ms: number) => {
      if (timersRef.current.interval) clearInterval(timersRef.current.interval);
      timersRef.current.interval = setInterval(tick, ms);
    },
    [tick],
  );

  return useMemo(
    () => ({
      onPointerDown: (e: React.PointerEvent<HTMLButtonElement>) => {
        if (!enabled || e.button !== 0) return;
        e.preventDefault();
        tick();
        timersRef.current.delay = setTimeout(() => {
          startInterval(REPEAT_INTERVAL_MS);
          timersRef.current.accel = setTimeout(() => {
            startInterval(REPEAT_FAST_INTERVAL_MS);
          }, REPEAT_ACCEL_MS);
        }, REPEAT_DELAY_MS);
      },
      onPointerUp: stop,
      onPointerLeave: stop,
      onPointerCancel: stop,
      onContextMenu: (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
      },
    }),
    [enabled, startInterval, stop, tick],
  );
}

/**
 * TreatEmojiSlider — the "amount knob" for thanks/credits flows. As the value
 * crosses a milestone, the displayed treat emoji animates in from below and
 * the previous one slides up & out, preserving the playful feedback loop that
 * the legacy `AmountSelector` provided.
 */
function TreatEmojiSlider({
  value,
  onChange,
  max,
  sendable,
  step = 5,
  unit = "THX",
  disabled,
  className,
}: TreatEmojiSliderProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const valueRef = useRef(value);
  valueRef.current = value;

  const decrement = useCallback(() => {
    const next = clampAmount(valueRef.current - 1, max);
    if (next === valueRef.current) return false;
    onChange(next);
    return true;
  }, [max, onChange]);

  const increment = useCallback(() => {
    const next = clampAmount(valueRef.current + 1, max);
    if (next === valueRef.current) return false;
    onChange(next);
    return true;
  }, [max, onChange]);

  const decrementPress = useRepeatingPress(
    decrement,
    !disabled && value > 0,
  );
  const incrementPress = useRepeatingPress(
    increment,
    !disabled && value < max,
  );

  const { index: emojiKey, emoji } = useMemo(
    () => getTreatEmojiByRatio(value, max),
    [value, max],
  );
  const isOverSendable =
    typeof sendable === "number" && value > sendable && value > 0;
  const fillPct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  const sendablePct =
    typeof sendable === "number" && max > 0
      ? Math.min(100, (sendable / max) * 100)
      : undefined;

  const startEditing = () => {
    if (disabled) return;
    setDraft(value === 0 ? "" : String(value));
    setIsEditing(true);
  };

  const commitDraft = () => {
    const trimmed = draft.trim();
    const parsed = trimmed === "" ? 0 : Number.parseInt(trimmed, 10);
    onChange(clampAmount(parsed, max));
    setIsEditing(false);
  };

  const cancelEditing = () => {
    setIsEditing(false);
  };

  useEffect(() => {
    if (!isEditing || !inputRef.current) return;
    inputRef.current.focus();
    inputRef.current.select();
  }, [isEditing]);

  return (
    <div
      data-slot="treat-emoji-slider"
      className={cn(
        "min-w-0 rounded-md border border-primary/30 bg-primary-soft/60 px-3 pt-6 pb-5 sm:px-5",
        className,
      )}
    >
      {/* Big animated emoji */}
      <div className="relative mx-auto flex h-[140px] w-full items-center justify-center overflow-hidden">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.div
            key={emojiKey}
            initial={{ opacity: 0, y: 36, scale: 0.6, rotate: -8 }}
            animate={{ opacity: 1, y: 0, scale: 1, rotate: 0 }}
            exit={{ opacity: 0, y: -36, scale: 0.6, rotate: 8 }}
            transition={{ type: "spring", stiffness: 320, damping: 22 }}
            className="text-[120px] leading-none"
            aria-hidden
          >
            {emoji}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Amount readout with ±1 and tap-to-edit */}
      <div className="mt-3 flex w-full min-w-0 justify-center">
        <div className="flex min-w-0 flex-col items-center">
          <div className="inline-flex max-w-full min-w-0 items-center gap-1 sm:gap-1.5 md:gap-2">
            <Button
              type="button"
              variant="secondary"
              size="icon-sm"
              disabled={disabled || value <= 0}
              aria-label="1減らす"
              className="shrink-0 touch-none select-none"
              {...decrementPress}
            >
              <Icon name="minus" size={18} />
            </Button>

            {isEditing ? (
              <input
                ref={inputRef}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={draft}
                disabled={disabled}
                aria-label="送る量を直接入力"
                aria-invalid={isOverSendable || undefined}
                onChange={(e) => {
                  const next = e.target.value;
                  if (next === "" || /^\d+$/.test(next)) setDraft(next);
                }}
                onBlur={commitDraft}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    commitDraft();
                  }
                  if (e.key === "Escape") {
                    e.preventDefault();
                    cancelEditing();
                  }
                }}
                className={cn(
                  "h-auto min-w-[4.5ch] max-w-full rounded-sm border-0 bg-white/50 px-0 py-1 text-center text-[32px] font-bold leading-none tracking-[-2px] tabular-nums shadow-none outline-none focus-visible:ring-2 focus-visible:ring-ring/40 sm:min-w-[5ch] sm:text-[40px] md:min-w-[6ch] md:text-[48px] lg:text-[56px]",
                  isOverSendable && "text-danger",
                )}
              />
            ) : (
              <button
                type="button"
                disabled={disabled}
                aria-label="送る量を直接入力"
                onClick={startEditing}
                className={cn(
                  "rounded-sm px-1 py-1 transition-colors",
                  "hover:bg-white/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40",
                  "disabled:cursor-not-allowed disabled:opacity-60",
                )}
              >
                <Typography
                  as="span"
                  variant="statLg"
                  className={cn(
                    "inline-block min-w-[4.5ch] max-w-full text-center text-[32px] leading-none tracking-[-2px] tabular-nums sm:min-w-[5ch] sm:text-[40px] md:min-w-[6ch] md:text-[48px] lg:text-[56px]",
                    isOverSendable && "text-danger",
                  )}
                >
                  {value.toLocaleString()}
                </Typography>
              </button>
            )}

            <Button
              type="button"
              variant="secondary"
              size="icon-sm"
              disabled={disabled || value >= max}
              aria-label="1増やす"
              className="shrink-0 touch-none select-none"
              {...incrementPress}
            >
              <Icon name="plus" size={18} />
            </Button>
          </div>

          <Typography
            as="span"
            variant="body"
            weight="bold"
            className="text-[#7A5A2E]"
          >
            {unit}
          </Typography>
        </div>
      </div>

      {/* Slider track */}
      <div className="mt-5 px-1">
        <div className="relative h-6">
          {/* Background track */}
          <div className="absolute inset-x-0 top-1/2 h-2 -translate-y-1/2 rounded-full bg-white/70 shadow-[inset_0_1px_2px_rgba(31,31,31,0.06)]" />
          {/* Filled portion — no width transition; it caused visible lag while dragging. */}
          <div
            className={cn(
              "absolute top-1/2 left-0 h-2 -translate-y-1/2 rounded-full",
              isOverSendable ? "bg-danger" : "bg-primary",
            )}
            style={{ width: `${fillPct}%` }}
          />
          {/* Sendable marker */}
          {typeof sendablePct === "number" && sendablePct < 100 && (
            <div
              className="absolute top-1/2 h-4 w-[2px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-text-secondary/40"
              style={{ left: `${sendablePct}%` }}
              aria-hidden
            />
          )}
          {/* Native range input — invisible but accessible */}
          <input
            type="range"
            min={0}
            max={max}
            step={step}
            value={value}
            disabled={disabled}
            onChange={(e) => onChange(Number(e.target.value))}
            aria-label="送る量"
            className="absolute inset-0 z-10 h-6 w-full cursor-pointer appearance-none bg-transparent outline-none focus-visible:ring-2 focus-visible:ring-ring/40 disabled:cursor-not-allowed [&::-moz-range-thumb]:size-6 [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-white [&::-moz-range-thumb]:bg-primary [&::-moz-range-thumb]:shadow-2 [&::-moz-range-thumb]:transition-transform [&::-moz-range-track]:bg-transparent [&::-webkit-slider-thumb]:size-6 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:shadow-2 [&::-webkit-slider-thumb]:transition-transform active:[&::-webkit-slider-thumb]:scale-110"
          />
        </div>
        <Typography
          variant="caption"
          tone="secondary"
          className={cn(
            "mt-1.5 block",
            (value !== 0 || disabled) && "invisible",
          )}
          aria-hidden={value !== 0 || disabled}
        >
          スライド調整
        </Typography>
      </div>

      {isOverSendable && (
        <Typography
          variant="caption"
          tone="danger"
          className="mt-3 text-center"
        >
          送れる量を超えています
        </Typography>
      )}
    </div>
  );
}

export { TreatEmojiSlider };
export type { TreatEmojiSliderProps };
