import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { useActiveWalletIdentity, useNamesByAddresses } from "hooks/useENS";
import {
  useGetBalanceOfFractionTokens,
  useTransferFractionToken,
} from "hooks/useFractionToken";
import { useTreeInfo } from "hooks/useHats";
import type { NameData } from "namestone-sdk";
import { type FC, Fragment, useMemo, useState } from "react";
import { LuCheck } from "react-icons/lu";
import { toast } from "sonner";
import type { HatsDetailSchama } from "types/hats";
import { ipfs2https } from "utils/ipfs";
import { abbreviateAddress } from "utils/wallet";
import type { Address } from "viem";
import { Chip } from "~/components/composite/chip";
import { Divider } from "~/components/composite/divider";
import { EmptyState } from "~/components/composite/empty-state";
import { FieldLabel } from "~/components/composite/field-label";
import { Row } from "~/components/composite/row";
import { SectionLabel } from "~/components/composite/section-label";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Button } from "~/components/ui/button";
import { Icon } from "~/components/ui/icon";
import { Input } from "~/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "~/components/ui/sheet";
import { Typography } from "~/components/ui/typography";
import { cn } from "~/lib/utils";

type Step = "recipient" | "compose" | "sending" | "done";

// Hard per-transaction cap, irrespective of the holder's balance.
const PER_TX_CAP = 2000;

const sameAddress = (a?: string, b?: string) =>
  !!a && !!b && a.toLowerCase() === b.toLowerCase();

interface AssistCreditSendSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  treeId: string;
  hatId: bigint;
  /** Address of the role wearer whose token-shard balance is being spent. */
  wearer: Address;
  /** Called after a successful transfer (toast is already fired). */
  onSent?: () => void;
}

const AssistCreditSendSheet: FC<AssistCreditSendSheetProps> = ({
  open,
  onOpenChange,
  treeId,
  hatId,
  wearer,
  onSent,
}) => {
  const me = useActiveWalletIdentity();
  const tree = useTreeInfo(Number(treeId));

  // ── Role context (image + name) ────────────────────────────
  const hat = useMemo(
    () => tree?.hats?.find((h) => h.id === `0x${hatId.toString(16)}`),
    [tree, hatId],
  );
  const detailsHttps = useMemo(() => ipfs2https(hat?.details), [hat?.details]);
  const { data: roleDetail } = useQuery({
    queryKey: ["hats-detail", detailsHttps],
    queryFn: async (): Promise<HatsDetailSchama | undefined> => {
      if (!detailsHttps) return;
      const { data } = await axios.get<HatsDetailSchama>(detailsHttps);
      return data;
    },
    enabled: !!detailsHttps,
    staleTime: 1000 * 60 * 60,
  });
  const roleName = roleDetail?.data?.name ?? "当番";
  const roleImage = useMemo(() => ipfs2https(hat?.imageUri), [hat?.imageUri]);

  // ── My balance for this (hat, wearer) shard ────────────────
  const { data: balanceData } = useGetBalanceOfFractionTokens({
    where: {
      workspaceId: treeId,
      hatId: hatId.toString(),
      wearer: wearer.toLowerCase(),
      owner: me.identity?.address?.toLowerCase(),
    },
  });
  const myBalance = useMemo(
    () => Number(balanceData?.balanceOfFractionTokens.at(0)?.balance ?? 0),
    [balanceData],
  );
  const effectiveMax = useMemo(
    () => Math.max(0, Math.min(PER_TX_CAP, myBalance)),
    [myBalance],
  );

  // ── Members directory (exclude self) ───────────────────────
  const memberAddresses = useMemo(() => {
    if (!tree?.hats) return [];
    const addrs = tree.hats
      .filter((h) => h.levelAtLocalTree && h.levelAtLocalTree >= 2)
      .flatMap((h) => h.wearers ?? [])
      .filter(Boolean)
      .map((w) => w.id.toLowerCase());
    return Array.from(new Set(addrs)).filter(
      (a) => !sameAddress(a, me.identity?.address),
    );
  }, [tree, me.identity?.address]);
  const { names: memberNames, isLoading: isMembersLoading } =
    useNamesByAddresses(memberAddresses);

  // ── Local state ────────────────────────────────────────────
  const [step, setStep] = useState<Step>("recipient");
  const [recipients, setRecipients] = useState<NameData[]>([]);
  const [amountInput, setAmountInput] = useState<string>("");
  const [search, setSearch] = useState<string>("");

  // Parse the numeric input. State stays as a string so the user can clear
  // the field and re-type without intermediate `0` flicker.
  const amount = useMemo(() => {
    const trimmed = amountInput.trim();
    if (!trimmed) return 0;
    const n = Number(trimmed);
    return Number.isFinite(n) && n > 0 ? Math.floor(n) : 0;
  }, [amountInput]);

  const isOverMax = amount > effectiveMax;
  const valid = amount > 0 && !isOverMax && recipients.length > 0;

  // ── Transfer hook ──────────────────────────────────────────
  const { transferFractionToken, batchTransferFractionToken, isLoading } =
    useTransferFractionToken(treeId, hatId, wearer);

  const filteredMembers = useMemo(() => {
    const list = memberNames
      .map((g) => g[0])
      .filter(
        (u): u is NameData =>
          !!u && !!u.address && !sameAddress(u.address, me.identity?.address),
      );
    const q = search.trim().toLowerCase();
    if (!q) return list;
    return list.filter((u) => {
      if (u.name?.toLowerCase().includes(q)) return true;
      if (u.address?.toLowerCase().includes(q)) return true;
      return false;
    });
  }, [memberNames, search, me.identity?.address]);

  const toggleRecipient = (user: NameData) => {
    setRecipients((prev) => {
      const exists = prev.some((u) => sameAddress(u.address, user.address));
      if (exists)
        return prev.filter((u) => !sameAddress(u.address, user.address));
      return [...prev, user];
    });
  };
  const isSelected = (user: NameData) =>
    recipients.some((u) => sameAddress(u.address, user.address));

  const presets = useMemo(() => {
    const candidates = [10, 50, 100, 500];
    return candidates.filter((c) => c <= effectiveMax);
  }, [effectiveMax]);

  const reset = () => {
    setStep("recipient");
    setRecipients([]);
    setAmountInput("");
    setSearch("");
  };

  const handleOpenChange = (next: boolean) => {
    if (!next && (step === "sending" || isLoading)) return; // block close mid-tx
    if (!next) reset();
    onOpenChange(next);
  };

  const submit = async () => {
    if (!valid || isLoading) return;
    setStep("sending");
    try {
      if (recipients.length === 1) {
        const res = await transferFractionToken(
          recipients[0].address as Address,
          BigInt(amount),
        );
        if (res?.error) throw new Error(res.error);
      } else {
        const tos = recipients.map((r) => r.address as Address);
        const amounts = recipients.map(() => BigInt(amount));
        const res = await batchTransferFractionToken(tos, amounts);
        if (res?.error) throw new Error(res.error);
      }
      setStep("done");
      toast.success("ロールシェアを送りました");
      onSent?.();
    } catch (e) {
      console.error("AssistCredit send error:", e);
      toast.error("送信に失敗しました");
      setStep("compose");
    }
  };

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent
        side="bottom"
        className="max-h-[90dvh] gap-0 md:left-1/2 md:right-auto md:w-full md:max-w-2xl md:-translate-x-1/2"
        showCloseButton={false}
      >
        <SheetHeader className="pt-2 pb-3">
          <div className="flex items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-sm bg-[#F2EAD9]">
              {roleImage ? (
                <img
                  src={roleImage}
                  alt={roleName}
                  className="size-full object-cover"
                />
              ) : (
                <Icon name="duty" size={18} className="text-[#7A5A2E]" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <SheetTitle>ロールシェアを送る</SheetTitle>
              <SheetDescription className="truncate">
                {roleName} ・ 残高 {myBalance.toLocaleString()}
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        {step === "recipient" && (
          <RecipientPanel
            search={search}
            onSearchChange={setSearch}
            isLoading={isMembersLoading}
            members={filteredMembers}
            isSelected={isSelected}
            onToggle={toggleRecipient}
            count={recipients.length}
            onNext={() => recipients.length > 0 && setStep("compose")}
          />
        )}

        {step === "compose" && recipients.length > 0 && (
          <ComposePanel
            recipients={recipients}
            onEditRecipients={() => setStep("recipient")}
            amountInput={amountInput}
            onAmountInputChange={setAmountInput}
            amount={amount}
            myBalance={myBalance}
            effectiveMax={effectiveMax}
            presets={presets}
            isOverMax={isOverMax}
            valid={valid}
            isLoading={isLoading}
            onSubmit={submit}
          />
        )}

        {step === "sending" && <SendingPanel />}

        {step === "done" && recipients.length > 0 && (
          <DonePanel
            recipients={recipients}
            amount={amount}
            onClose={() => handleOpenChange(false)}
            onSendAnother={() => {
              setRecipients([]);
              setAmountInput("");
              setSearch("");
              setStep("recipient");
            }}
          />
        )}
      </SheetContent>
    </Sheet>
  );
};

export { AssistCreditSendSheet };
export type { AssistCreditSendSheetProps };

// ───────────────────────────────────────────────────────────────
// Panels
// ───────────────────────────────────────────────────────────────

const RecipientPanel: FC<{
  search: string;
  onSearchChange: (s: string) => void;
  isLoading: boolean;
  members: NameData[];
  isSelected: (u: NameData) => boolean;
  onToggle: (u: NameData) => void;
  count: number;
  onNext: () => void;
}> = ({
  search,
  onSearchChange,
  isLoading,
  members,
  isSelected,
  onToggle,
  count,
  onNext,
}) => (
  <div className="flex min-h-0 flex-1 flex-col">
    <div className="px-5 pb-3">
      <Input
        icon={<Icon name="search" size={18} />}
        placeholder="ユーザー名 or アドレスで検索"
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
      />
    </div>
    <SectionLabel className="px-5">送る相手を選ぶ</SectionLabel>
    <div className="min-h-0 flex-1 overflow-y-auto px-5">
      {isLoading && members.length === 0 ? (
        <Skeleton />
      ) : members.length === 0 ? (
        <EmptyState
          icon={<Icon name="search" size={20} />}
          title={search ? "見つかりませんでした" : "メンバーがいません"}
          body={search ? "別のキーワードで検索してみてください" : undefined}
        />
      ) : (
        <div className="overflow-hidden rounded-md border bg-card">
          {members.map((u, i) => {
            const selected = isSelected(u);
            return (
              <Fragment key={u.address}>
                <Row
                  left={<UserAvatar user={u} />}
                  title={
                    u.name ?? abbreviateAddress(u.address as `0x${string}`)
                  }
                  subtitle={abbreviateAddress(u.address as `0x${string}`)}
                  right={<SelectionIndicator selected={selected} />}
                  onClick={() => onToggle(u)}
                  className={cn(selected && "bg-primary-soft/40")}
                />
                {i < members.length - 1 && <Divider inset={64} />}
              </Fragment>
            );
          })}
        </div>
      )}
    </div>
    <div className="px-5 pt-3">
      <Button full disabled={count === 0} onClick={onNext}>
        {count > 0 ? `${count}人に送る` : "送る相手を選んでください"}
        {count > 0 && <Icon name="chevron-right" size={16} />}
      </Button>
    </div>
  </div>
);

const ComposePanel: FC<{
  recipients: NameData[];
  onEditRecipients: () => void;
  amountInput: string;
  onAmountInputChange: (s: string) => void;
  amount: number;
  myBalance: number;
  effectiveMax: number;
  presets: number[];
  isOverMax: boolean;
  valid: boolean;
  isLoading: boolean;
  onSubmit: () => void;
}> = ({
  recipients,
  onEditRecipients,
  amountInput,
  onAmountInputChange,
  amount,
  myBalance,
  effectiveMax,
  presets,
  isOverMax,
  valid,
  isLoading,
  onSubmit,
}) => {
  const isMulti = recipients.length > 1;
  const recipientLabel = isMulti
    ? `${recipients.length}人`
    : (recipients[0].name ??
      abbreviateAddress(recipients[0].address as `0x${string}`));
  const total = amount * recipients.length;
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto px-5">
        {/* Recipient summary */}
        <FieldLabel>送る相手</FieldLabel>
        <button
          type="button"
          onClick={onEditRecipients}
          className="flex w-full items-center gap-3 rounded-md border bg-card px-3.5 py-3 transition-colors hover:bg-bg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
        >
          {isMulti ? (
            <div className="flex -space-x-2">
              {recipients.slice(0, 3).map((r) => (
                <UserAvatar key={r.address} user={r} />
              ))}
              {recipients.length > 3 && (
                <div className="flex size-9 items-center justify-center rounded-full border-2 border-background bg-muted text-xs font-semibold text-text-secondary">
                  +{recipients.length - 3}
                </div>
              )}
            </div>
          ) : (
            <UserAvatar user={recipients[0]} />
          )}
          <div className="min-w-0 flex-1 text-left">
            <Typography variant="body" weight="semibold" truncate>
              {recipientLabel}
            </Typography>
            <Typography variant="caption" tone="secondary">
              タップで変更
            </Typography>
          </div>
          <Icon
            name="chevron-right"
            size={16}
            className="text-text-secondary"
          />
        </button>

        {/* Amount input — single column, no message field for assist credit. */}
        <div className="mt-5">
          <div className="mb-2 flex items-baseline justify-between">
            <FieldLabel htmlFor="ac-amount" className="mb-0">
              送る量
            </FieldLabel>
            <Typography variant="caption" tone="secondary">
              残高 {myBalance.toLocaleString()}
            </Typography>
          </div>
          <Input
            id="ac-amount"
            inputMode="numeric"
            pattern="[0-9]*"
            placeholder="0"
            value={amountInput}
            onChange={(e) => {
              const v = e.target.value;
              if (v === "" || /^\d+$/.test(v)) onAmountInputChange(v);
            }}
            aria-invalid={isOverMax || undefined}
            className={cn(
              "text-right text-[18px] font-bold tabular-nums",
              isOverMax && "border-destructive",
            )}
          />
          {isOverMax && (
            <Typography variant="caption" tone="danger" className="mt-1.5">
              {effectiveMax === 0
                ? "送れる残高がありません"
                : `${effectiveMax.toLocaleString()} まで送れます`}
            </Typography>
          )}
          {presets.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {presets.map((p) => (
                <Chip
                  key={p}
                  active={amount === p}
                  onClick={() => onAmountInputChange(p.toString())}
                >
                  {p.toLocaleString()}
                </Chip>
              ))}
              {effectiveMax > 0 && (
                <Chip
                  active={amount === effectiveMax}
                  onClick={() => onAmountInputChange(effectiveMax.toString())}
                >
                  {effectiveMax === PER_TX_CAP ? "上限" : "すべて"}
                </Chip>
              )}
            </div>
          )}
          <Typography variant="caption" tone="secondary" className="mt-2 block">
            1回あたり最大 {Math.min(PER_TX_CAP, myBalance).toLocaleString()}{" "}
            まで
            {isMulti && (
              <>
                ・合計{" "}
                <strong className="font-semibold text-text-primary">
                  {total.toLocaleString()}
                </strong>
              </>
            )}
          </Typography>
        </div>
      </div>

      <div className="px-5 pt-3">
        <Button full disabled={!valid || isLoading} onClick={onSubmit}>
          送信する
        </Button>
      </div>
    </div>
  );
};

const SendingPanel: FC = () => (
  <CenteredPanel>
    <div className="mb-6 flex size-16 items-center justify-center rounded-full bg-primary-soft animate-pulse">
      <Icon name="send" size={28} className="text-primary" />
    </div>
    <Typography variant="body" weight="bold">
      ロールシェアを送信しています…
    </Typography>
    <Typography variant="bodySm" tone="secondary" className="mt-2">
      ブロックチェーンへの書き込みを待っています
    </Typography>
  </CenteredPanel>
);

const DonePanel: FC<{
  recipients: NameData[];
  amount: number;
  onClose: () => void;
  onSendAnother: () => void;
}> = ({ recipients, amount, onClose, onSendAnother }) => {
  const isMulti = recipients.length > 1;
  const label = isMulti
    ? `${recipients.length}人`
    : (recipients[0].name ??
      abbreviateAddress(recipients[0].address as `0x${string}`));
  const total = amount * recipients.length;
  return (
    <CenteredPanel>
      <div
        className="mb-5 flex size-[72px] items-center justify-center rounded-full bg-contrib text-white"
        style={{ boxShadow: "0 0 0 10px rgba(101,201,138,0.15)" }}
      >
        <Icon name="check" size={36} />
      </div>
      <Typography variant="body" weight="bold">
        送信が完了しました
      </Typography>
      <Typography variant="bodySm" tone="secondary" className="mt-1.5">
        <strong className="font-semibold text-text-primary">{label}</strong>
        {" に "}
        <strong className="font-semibold text-text-primary">
          {amount.toLocaleString()}
          {isMulti && ` ずつ (合計 ${total.toLocaleString()})`}
        </strong>
        {" を送りました"}
      </Typography>
      <div className="mt-6 flex w-full max-w-[300px] flex-col gap-2.5">
        <Button full onClick={onClose}>
          閉じる
        </Button>
        <Button variant="ghost" full onClick={onSendAnother}>
          もう一度送る
        </Button>
      </div>
    </CenteredPanel>
  );
};

const CenteredPanel: FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="flex min-h-[280px] flex-1 flex-col items-center justify-center px-6 text-center">
    {children}
  </div>
);

const Skeleton: FC = () => (
  <div className="overflow-hidden rounded-md border bg-card">
    {["a", "b", "c"].map((k, i) => (
      <div key={k}>
        <div className="flex items-center gap-3 px-4 py-3">
          <div className="size-9 shrink-0 animate-pulse rounded-full bg-[#F0EBDE]" />
          <div className="flex-1">
            <div className="h-3 w-24 animate-pulse rounded bg-[#F0EBDE]" />
            <div className="mt-2 h-2.5 w-32 animate-pulse rounded bg-[#F0EBDE]" />
          </div>
        </div>
        {i < 2 && <Divider inset={64} />}
      </div>
    ))}
  </div>
);

const SelectionIndicator: FC<{ selected: boolean }> = ({ selected }) => (
  <span
    aria-hidden
    className={cn(
      "flex size-6 items-center justify-center rounded-full border-2 transition-colors",
      selected
        ? "border-primary bg-primary text-white"
        : "border-border bg-surface",
    )}
  >
    {selected && <LuCheck className="size-3.5" />}
  </span>
);

const UserAvatar: FC<{ user: NameData; size?: "default" | "sm" | "lg" }> = ({
  user,
  size,
}) => {
  const seed = user.name ?? user.address ?? "?";
  const avatar = ipfs2https(user.text_records?.avatar);
  return (
    <Avatar size={size}>
      {avatar && <AvatarImage src={avatar} alt={user.name ?? ""} />}
      <AvatarFallback seed={seed} />
    </Avatar>
  );
};
