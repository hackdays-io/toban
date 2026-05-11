import { AnimatePresence, motion } from "framer-motion";
import { useMemo } from "react";
import { getTreatEmojiByRatio } from "utils/treatEmoji";

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

  return (
    <div
      data-slot="treat-emoji-slider"
      className={cn(
        "rounded-md border border-primary/30 bg-primary-soft/60 px-5 pt-6 pb-5",
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

      {/* Big number readout */}
      <div className="mt-3 flex items-baseline justify-center gap-1.5">
        <Typography
          as="span"
          variant="statLg"
          className={cn(
            "text-[56px] tracking-[-2px] tabular-nums",
            isOverSendable && "text-danger",
          )}
        >
          {value.toLocaleString()}
        </Typography>
        <Typography
          as="span"
          variant="body"
          weight="bold"
          className="text-[#7A5A2E]"
        >
          {unit}
        </Typography>
      </div>

      {/* Slider track */}
      <div className="mt-5 px-1">
        <div className="relative h-6">
          {/* Background track */}
          <div className="absolute inset-x-0 top-1/2 h-2 -translate-y-1/2 rounded-full bg-white/70 shadow-[inset_0_1px_2px_rgba(31,31,31,0.06)]" />
          {/* Filled portion */}
          <div
            className={cn(
              "absolute top-1/2 left-0 h-2 -translate-y-1/2 rounded-full transition-[width] duration-150 ease-out",
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
