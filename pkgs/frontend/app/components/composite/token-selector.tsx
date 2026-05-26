import { useMemo } from "react";
import type { Address } from "viem";
import { Input } from "~/components/ui/input";
import { Typography } from "~/components/ui/typography";
import {
  type TokenPreset,
  findTokenPreset,
  getTokenPresets,
} from "~/lib/tokens";
import { cn } from "~/lib/utils";

interface TokenSelectorProps {
  chainId: number;
  /** Current ERC20 address (lowercased or checksummed). Empty string = nothing picked. */
  value: string;
  onChange: (next: { address: string; preset?: TokenPreset }) => void;
  /** Address strings that have already been picked elsewhere in the form and should be disabled. */
  excludeAddresses?: string[];
  className?: string;
}

const OTHER = "__other__" as const;

// Drop-down + custom-address selector for picking an ERC20.
// Shows a `<select>` of canonical presets per chain plus an "Other" option
// that reveals a free-form contract-address input.
function TokenSelector({
  chainId,
  value,
  onChange,
  excludeAddresses,
  className,
}: TokenSelectorProps) {
  const presets = useMemo(() => getTokenPresets(chainId), [chainId]);
  const matched = useMemo(
    () => findTokenPreset(chainId, value),
    [chainId, value],
  );
  const excludedLc = useMemo(
    () => new Set((excludeAddresses ?? []).map((a) => a.toLowerCase())),
    [excludeAddresses],
  );

  const selectValue = matched
    ? matched.address.toLowerCase()
    : value
      ? OTHER
      : "";

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <select
        value={selectValue}
        onChange={(e) => {
          const v = e.target.value;
          if (v === OTHER) {
            // Clear the address so the user types one in.
            onChange({ address: "" });
            return;
          }
          if (v === "") {
            onChange({ address: "" });
            return;
          }
          const preset = presets.find((p) => p.address.toLowerCase() === v);
          onChange({ address: v as Address, preset });
        }}
        className="h-10 rounded-[10px] border border-border bg-surface px-3 text-[14px] text-text-primary outline-none focus:border-primary"
      >
        <option value="">トークンを選択</option>
        {presets.map((p) => {
          const lc = p.address.toLowerCase();
          const disabled = excludedLc.has(lc) && lc !== value.toLowerCase();
          return (
            <option key={lc} value={lc} disabled={disabled}>
              {p.symbol} — {p.name}
              {disabled ? "（選択済み）" : ""}
            </option>
          );
        })}
        <option value={OTHER}>その他（アドレスを入力）</option>
      </select>

      {selectValue === OTHER && (
        <div className="flex flex-col gap-1">
          <Input
            placeholder="0x…"
            value={value}
            onChange={(e) => onChange({ address: e.target.value })}
          />
          <Typography variant="micro" tone="secondary">
            ERC20 トークンのコントラクトアドレスを入力してください
          </Typography>
        </div>
      )}
    </div>
  );
}

export { TokenSelector };
export type { TokenSelectorProps };
