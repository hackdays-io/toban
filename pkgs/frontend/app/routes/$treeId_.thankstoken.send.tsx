import { MintThanksToken_OrderBy, type OrderDirection } from "gql/graphql";
import { useActiveWalletIdentity, useNamesByAddresses } from "hooks/useENS";
import { useTreeInfo } from "hooks/useHats";
import { useGetMintThanksTokens, useThanksToken } from "hooks/useThanksToken";
import type { NameData } from "namestone-sdk";
import { type FC, type ReactNode, useMemo, useState } from "react";
import { LuCheck } from "react-icons/lu";
import { useNavigate, useParams } from "react-router";
import { toast } from "sonner";
import { ipfs2https } from "utils/ipfs";
import { abbreviateAddress } from "utils/wallet";
import { type Address, formatEther, parseEther, stringToHex } from "viem";
import { Chip } from "~/components/composite/chip";
import { Divider } from "~/components/composite/divider";
import { EmptyState } from "~/components/composite/empty-state";
import { FieldLabel } from "~/components/composite/field-label";
import { Row } from "~/components/composite/row";
import { SectionLabel } from "~/components/composite/section-label";
import { StepBar } from "~/components/composite/step-bar";
import { TreatEmojiSlider } from "~/components/composite/treat-emoji-slider";
import { PageContainer } from "~/components/layout/PageContainer";
import { ScreenHeader } from "~/components/layout/ScreenHeader";
import {
  Avatar,
  AvatarFallback,
  AvatarGroup,
  AvatarGroupCount,
  AvatarImage,
} from "~/components/ui/avatar";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import { Heading } from "~/components/ui/heading";
import { Icon } from "~/components/ui/icon";
import { Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea";
import { Typography } from "~/components/ui/typography";
import { cn } from "~/lib/utils";

type Step = "recipient" | "compose" | "confirm" | "sending" | "done";

// Hard per-transaction cap, irrespective of mintable balance.
const PER_TX_CAP = 2000;

const MESSAGE_SUGGESTIONS = [
  "手伝ってくれてありがとう！",
  "準備してくれて助かりました",
  "今日の対応ありがとう",
];

const sameAddress = (a?: string, b?: string) =>
  !!a && !!b && a.toLowerCase() === b.toLowerCase();

const ThanksTokenSend: FC = () => {
  const { treeId } = useParams();
  const navigate = useNavigate();
  const me = useActiveWalletIdentity();
  const { mintableAmount, mintThanksToken, batchMintThanksToken, isLoading } =
    useThanksToken(treeId as string);
  const tree = useTreeInfo(Number(treeId));

  // "最近関わった人" — counter-parties from my own outbound + inbound mints.
  // Two narrow subgraph queries (one with `from: me`, one with `to: me`)
  // beat fetching the workspace-wide feed and filtering client-side, since
  // an active workspace can push my interactions out of the cap-30 window.
  // A zero-address sentinel keeps Apollo's query firable while the wallet
  // identity is still resolving — it just matches nothing.
  const meAddrLower = me.identity?.address?.toLowerCase();
  const ZERO_ADDR = "0x0000000000000000000000000000000000000000";
  const queryMeAddr = meAddrLower ?? ZERO_ADDR;
  const { data: sentMintsData } = useGetMintThanksTokens({
    where: { workspaceId: treeId, from: queryMeAddr },
    orderBy: MintThanksToken_OrderBy.BlockTimestamp,
    orderDirection: "desc" as OrderDirection,
    first: 20,
  });
  const { data: receivedMintsData } = useGetMintThanksTokens({
    where: { workspaceId: treeId, to: queryMeAddr },
    orderBy: MintThanksToken_OrderBy.BlockTimestamp,
    orderDirection: "desc" as OrderDirection,
    first: 20,
  });

  // ── Form state ─────────────────────────────────────────────
  const [step, setStep] = useState<Step>("recipient");
  const [recipients, setRecipients] = useState<NameData[]>([]);
  const [amount, setAmount] = useState<number>(0);
  const [message, setMessage] = useState<string>("");

  // ── Derived: sendable amount ───────────────────────────────
  const sendable = useMemo(
    () => Math.floor(Number(formatEther(mintableAmount ?? 0n))),
    [mintableAmount],
  );
  // Effective cap = min(per-tx 2000, sendable). When multi-recipient,
  // the same amount is sent to each, so the cap is per-recipient.
  const effectiveMax = useMemo(
    () => Math.max(0, Math.min(PER_TX_CAP, sendable)),
    [sendable],
  );

  // Slider range — round effectiveMax up to next 100, floor 100.
  const sliderMax = useMemo(() => {
    if (effectiveMax <= 0) return 100;
    return Math.max(100, Math.ceil(effectiveMax / 100) * 100);
  }, [effectiveMax]);

  // ── Members directory ──────────────────────────────────────
  const memberAddresses = useMemo(() => {
    if (!tree?.hats) return [];
    const wearerAddresses = tree.hats
      .filter((h) => h.levelAtLocalTree && h.levelAtLocalTree >= 2)
      .flatMap((h) => h.wearers ?? [])
      .filter(Boolean)
      .map((w) => w.id.toLowerCase());
    return Array.from(new Set(wearerAddresses)).filter(
      (a) => !sameAddress(a, me.identity?.address),
    );
  }, [tree, me.identity?.address]);

  const { names: memberNames, isLoading: isMembersLoading } =
    useNamesByAddresses(memberAddresses);

  // ── Search ─────────────────────────────────────────────────
  // Client-side substring filter on the resolved member directory. The legacy
  // `useNamesByAddresses()` / `useAddressesByNames()` hook calls — used here
  // before — only populate their cache when invoked WITH addresses; calling
  // them with no args and relying on the imperative `fetchNames`/`fetchAddresses`
  // return value left the rendered list permanently empty.
  const [searchText, setSearchText] = useState<string>("");

  // Merge sent + received, sort by blockTimestamp desc, dedupe counter-parties,
  // cap at 10.
  const recentAddresses = useMemo(() => {
    if (!meAddrLower) return [];
    const sent = sentMintsData?.mintThanksTokens ?? [];
    const received = receivedMintsData?.mintThanksTokens ?? [];
    const merged = [...sent, ...received].sort(
      (a, b) => Number(b.blockTimestamp) - Number(a.blockTimestamp),
    );
    const ordered: string[] = [];
    const seen = new Set<string>();
    for (const m of merged) {
      const fromAddr = m.from?.toLowerCase();
      const toAddr = m.to?.toLowerCase();
      const other: string | undefined =
        fromAddr === meAddrLower
          ? toAddr
          : toAddr === meAddrLower
            ? fromAddr
            : undefined;
      if (other && other !== meAddrLower && !seen.has(other)) {
        seen.add(other);
        ordered.push(other);
        if (ordered.length >= 10) break;
      }
    }
    return ordered;
  }, [sentMintsData, receivedMintsData, meAddrLower]);

  const { names: recentNames } = useNamesByAddresses(recentAddresses);

  // ── Visible user list (search-aware) ───────────────────────
  const visibleUsers = useMemo<NameData[]>(() => {
    const list = memberNames
      .map((g) => g[0])
      .filter(
        (u): u is NameData =>
          !!u && !!u.address && !sameAddress(u.address, me.identity?.address),
      );
    const q = searchText.trim().toLowerCase();
    if (!q) return list;
    return list.filter((u) => {
      if (u.name?.toLowerCase().includes(q)) return true;
      if (u.address?.toLowerCase().includes(q)) return true;
      return false;
    });
  }, [memberNames, searchText, me.identity?.address]);

  // ── Recipient toggle ───────────────────────────────────────
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

  // ── Presets ────────────────────────────────────────────────
  const presets = useMemo(() => {
    const candidates = [25, 50, 100, 500];
    const small = candidates.filter((c) => c <= effectiveMax);
    return [...small, effectiveMax];
  }, [effectiveMax]);

  // ── Step navigation helpers ────────────────────────────────
  const stepIndex = useMemo(() => {
    switch (step) {
      case "recipient":
        return 0;
      case "compose":
        return 1;
      case "confirm":
        return 2;
      case "sending":
        return 3;
      case "done":
        return 4;
    }
  }, [step]);

  const onBack = () => {
    if (step === "recipient") {
      navigate(`/${treeId}`);
      return;
    }
    if (step === "compose") {
      setStep("recipient");
      return;
    }
    if (step === "confirm") {
      setStep("compose");
      return;
    }
  };

  const headerTitle: Record<Step, string> = {
    recipient: "サンクスを送る",
    compose:
      recipients.length === 1
        ? `${recipients[0].name ?? "送信先"} にサンクスを送る`
        : `${recipients.length}人にサンクスを送る`,
    confirm: "送信内容の確認",
    sending: "送信中",
    done: "送信完了",
  };

  // ── Submit ─────────────────────────────────────────────────
  const submit = async () => {
    if (recipients.length === 0 || !amount || isLoading) return;
    setStep("sending");
    try {
      const extra = message ? stringToHex(message) : undefined;
      if (recipients.length === 1) {
        const res = await mintThanksToken(
          recipients[0].address as Address,
          parseEther(amount.toString()),
          extra,
        );
        if (res?.error) throw new Error(res.error);
      } else {
        const tos = recipients.map((r) => r.address as Address);
        const amounts = recipients.map(() => parseEther(amount.toString()));
        const res = await batchMintThanksToken(tos, amounts, extra);
        if (res?.error) throw new Error(res.error);
      }
      setStep("done");
      toast.success("サンクスを送りました");
    } catch (e) {
      console.error("Thanks send error:", e);
      toast.error("送信に失敗しました");
      setStep("confirm");
    }
  };

  // ── Reset for "もう一人に送る" ─────────────────────────────
  const sendAnother = () => {
    setRecipients([]);
    setAmount(0);
    setMessage("");
    setSearchText("");
    setStep("recipient");
  };

  const showHeader = step !== "sending" && step !== "done";
  const showStepBar =
    step === "recipient" || step === "compose" || step === "confirm";

  return (
    <PageContainer className="pt-2 pb-24">
      {showHeader && (
        <ScreenHeader
          className="-mx-4 px-4 md:-mx-6 md:px-6"
          title={headerTitle[step]}
          subtitle={
            step === "recipient" || step === "compose"
              ? `送れるサンクス: ${sendable.toLocaleString()} THX`
              : undefined
          }
          onBack={onBack}
        />
      )}

      {showStepBar && (
        <div className="mb-4 px-1">
          <StepBar total={3} current={stepIndex} ariaLabel="送信ステップ" />
        </div>
      )}

      {step === "recipient" && (
        <RecipientStep
          searchText={searchText}
          onSearchTextChange={setSearchText}
          isMembersLoading={isMembersLoading}
          recentAddresses={recentAddresses}
          recentNames={recentNames}
          visibleUsers={visibleUsers}
          isSelected={isSelected}
          onToggle={toggleRecipient}
          recipientCount={recipients.length}
          onNext={() => recipients.length > 0 && setStep("compose")}
        />
      )}

      {step === "compose" && recipients.length > 0 && (
        <ComposeStep
          amount={amount}
          setAmount={setAmount}
          message={message}
          setMessage={setMessage}
          sendable={sendable}
          sliderMax={sliderMax}
          effectiveMax={effectiveMax}
          presets={presets}
          onNext={() => setStep("confirm")}
        />
      )}

      {step === "confirm" && recipients.length > 0 && (
        <ConfirmStep
          me={me.identity}
          recipients={recipients}
          amount={amount}
          message={message}
          onEdit={() => setStep("compose")}
          onSubmit={submit}
        />
      )}

      {step === "sending" && <SendingStep />}

      {step === "done" && recipients.length > 0 && (
        <DoneStep
          recipients={recipients}
          amount={amount}
          onHome={() => navigate(`/${treeId}`)}
          onSendAnother={sendAnother}
        />
      )}
    </PageContainer>
  );
};

export default ThanksTokenSend;

export const handle = {
  active: "wallet",
};

// ───────────────────────────────────────────────────────────────
// Step 1: pick recipient(s)
// ───────────────────────────────────────────────────────────────

interface RecipientStepProps {
  searchText: string;
  onSearchTextChange: (v: string) => void;
  isMembersLoading: boolean;
  recentAddresses: string[];
  recentNames: NameData[][];
  visibleUsers: NameData[];
  isSelected: (user: NameData) => boolean;
  onToggle: (user: NameData) => void;
  recipientCount: number;
  onNext: () => void;
}

const RecipientStep: FC<RecipientStepProps> = ({
  searchText,
  onSearchTextChange,
  isMembersLoading,
  recentAddresses,
  recentNames,
  visibleUsers,
  isSelected,
  onToggle,
  recipientCount,
  onNext,
}) => {
  const recentUsers = useMemo<NameData[]>(() => {
    const list: NameData[] = [];
    for (let i = 0; i < recentAddresses.length; i++) {
      const u = recentNames[i]?.[0];
      if (u) list.push(u);
    }
    return list;
  }, [recentAddresses, recentNames]);

  return (
    <div className="flex flex-col gap-5">
      <div className="px-1">
        <Input
          icon={<Icon name="search" size={18} />}
          placeholder="ユーザー名 or ウォレットアドレス"
          value={searchText}
          onChange={(e) => onSearchTextChange(e.target.value)}
        />
      </div>

      {!searchText && recentUsers.length > 0 && (
        <section>
          <SectionLabel className="px-1">最近関わった人</SectionLabel>
          <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-1 md:-mx-6 md:px-6">
            {recentUsers.map((u) => {
              const selected = isSelected(u);
              return (
                <button
                  key={u.address}
                  type="button"
                  onClick={() => onToggle(u)}
                  className={cn(
                    "flex min-w-[64px] flex-col items-center gap-1.5 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40",
                  )}
                >
                  <div className="relative">
                    <UserAvatar
                      user={u}
                      size="lg"
                      className={cn(
                        selected && "ring-2 ring-primary ring-offset-2",
                      )}
                    />
                    {selected && (
                      <span className="absolute -right-1 -bottom-1 flex size-5 items-center justify-center rounded-full bg-primary text-white">
                        <LuCheck className="size-3.5" />
                      </span>
                    )}
                  </div>
                  <Typography
                    as="span"
                    variant="caption"
                    weight="semibold"
                    truncate
                    className="max-w-[64px]"
                  >
                    {u.name ?? abbreviateAddress(u.address as `0x${string}`)}
                  </Typography>
                </button>
              );
            })}
          </div>
        </section>
      )}

      <section>
        <SectionLabel className="px-1">
          {searchText ? "検索結果" : "メンバー一覧"}
        </SectionLabel>
        {isMembersLoading && visibleUsers.length === 0 ? (
          <UserListSkeleton />
        ) : visibleUsers.length === 0 ? (
          <EmptyState
            icon={<Icon name="search" size={22} />}
            title={searchText ? "見つかりませんでした" : "メンバーがいません"}
            body={
              searchText
                ? "別のキーワードで検索してみてください"
                : "ワークスペースにメンバーを追加してから送信できます"
            }
          />
        ) : (
          <Card className="mx-1 gap-0 overflow-hidden py-0">
            {visibleUsers.map((u, i) => (
              <SelectableUserRow
                key={u.address}
                user={u}
                selected={isSelected(u)}
                onClick={() => onToggle(u)}
                showDivider={i < visibleUsers.length - 1}
              />
            ))}
          </Card>
        )}
      </section>

      {/* Spacer so the floating CTA doesn't cover the last row */}
      <div aria-hidden className="h-16" />

      {recipientCount > 0 && (
        <div className="pointer-events-none fixed inset-x-0 bottom-[calc(env(safe-area-inset-bottom)+72px)] z-30 flex justify-center px-4 md:bottom-6 md:left-[260px] md:right-0 md:px-6">
          <div className="pointer-events-auto w-full max-w-md">
            <Button full size="lg" onClick={onNext} className="shadow-3">
              {recipientCount}人に送る
              <Icon name="chevron-right" size={16} />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

const UserListSkeleton: FC = () => (
  <Card className="mx-1 gap-0 overflow-hidden py-0">
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
  </Card>
);

const SelectableUserRow: FC<{
  user: NameData;
  selected: boolean;
  onClick: () => void;
  showDivider: boolean;
}> = ({ user, selected, onClick, showDivider }) => {
  const name = user.name ?? abbreviateAddress(user.address as `0x${string}`);
  return (
    <>
      <Row
        left={<UserAvatar user={user} />}
        title={name}
        subtitle={
          user.address
            ? abbreviateAddress(user.address as `0x${string}`)
            : undefined
        }
        right={<SelectionIndicator selected={selected} />}
        onClick={onClick}
        className={cn(selected && "bg-primary-soft/40")}
      />
      {showDivider && <Divider inset={64} />}
    </>
  );
};

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

const UserAvatar: FC<{
  user: NameData;
  size?: "default" | "sm" | "lg" | "xl";
  className?: string;
}> = ({ user, size, className }) => {
  const seed = user.name ?? user.address ?? "?";
  const avatar = ipfs2https(user.text_records?.avatar);
  return (
    <Avatar size={size} className={className}>
      {avatar && <AvatarImage src={avatar} alt={user.name ?? ""} />}
      <AvatarFallback seed={seed} />
    </Avatar>
  );
};

// ───────────────────────────────────────────────────────────────
// Step 2: compose (amount + message)
// PC: 2-col grid (amount | message + CTA). Mobile: stacked + sticky CTA.
// ───────────────────────────────────────────────────────────────

interface ComposeStepProps {
  amount: number;
  setAmount: (n: number) => void;
  message: string;
  setMessage: (s: string) => void;
  sendable: number;
  sliderMax: number;
  effectiveMax: number;
  presets: number[];
  onNext: () => void;
}

const ComposeStep: FC<ComposeStepProps> = ({
  amount,
  setAmount,
  message,
  setMessage,
  sendable,
  sliderMax,
  effectiveMax,
  presets,
  onNext,
}) => {
  const valid = amount > 0 && amount <= effectiveMax;
  return (
    <div className="grid gap-5 md:grid-cols-2 md:gap-6">
      {/* Amount column */}
      <div className="px-1 md:px-0">
        <FieldLabel>送る量</FieldLabel>
        <TreatEmojiSlider
          value={amount}
          onChange={setAmount}
          max={sliderMax}
          sendable={effectiveMax}
          step={5}
        />
        <div className="mt-3 flex gap-2">
          {presets.map((p, i) => {
            const isAll = i === presets.length - 1;
            const label = isAll ? "上限" : `${p}`;
            const disabled = p <= 0;
            return (
              <Chip
                key={`${i}-${p}`}
                active={amount === p && p > 0}
                disabled={disabled}
                onClick={() => setAmount(p)}
                className="flex-1 justify-center"
              >
                {label}
              </Chip>
            );
          })}
        </div>
        <Typography
          variant="caption"
          tone="secondary"
          className="mt-2 text-center"
        >
          1回あたり最大 {Math.min(PER_TX_CAP, sendable).toLocaleString()} THX
          まで送れます
        </Typography>
      </div>

      {/* Message + CTA column */}
      <div className="px-1 md:flex md:flex-col md:px-0">
        <FieldLabel htmlFor="thanks-message">メッセージ</FieldLabel>
        <Textarea
          id="thanks-message"
          rows={3}
          maxLength={150}
          placeholder="ありがとうを入力"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="md:min-h-32"
        />
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          {MESSAGE_SUGGESTIONS.map((s) => (
            <Chip
              key={s}
              type="button"
              onClick={() => setMessage(s)}
              className="font-medium text-text-secondary"
            >
              {s}
            </Chip>
          ))}
        </div>

        {/* Desktop CTA — inline within the right column. */}
        <div className="mt-auto hidden md:block md:pt-5">
          <Button full disabled={!valid} onClick={onNext}>
            次へ
          </Button>
        </div>
      </div>

      {/* Mobile CTA — sticky at the bottom of the page. */}
      <div className="sticky bottom-4 col-span-full px-1 pt-2 md:hidden">
        <Button full disabled={!valid} onClick={onNext}>
          次へ
        </Button>
      </div>
    </div>
  );
};

// ───────────────────────────────────────────────────────────────
// Step 3: confirm
// ───────────────────────────────────────────────────────────────

interface ConfirmStepProps {
  me?: NameData;
  recipients: NameData[];
  amount: number;
  message: string;
  onEdit: () => void;
  onSubmit: () => void;
}

const ConfirmStep: FC<ConfirmStepProps> = ({
  me,
  recipients,
  amount,
  message,
  onEdit,
  onSubmit,
}) => {
  const isMulti = recipients.length > 1;
  const recipientLabel = isMulti
    ? `${recipients.length}人`
    : (recipients[0].name ??
      abbreviateAddress(recipients[0].address as `0x${string}`));
  const total = amount * recipients.length;
  return (
    <div className="flex flex-col gap-4">
      <Card className="mx-1 gap-0 py-7 text-center">
        <div className="flex items-center justify-center gap-4">
          {me ? (
            <UserAvatar user={me} size="lg" />
          ) : (
            <Avatar size="lg">
              <AvatarFallback seed="me" />
            </Avatar>
          )}
          <div className="flex items-center gap-1.5">
            <span className="h-px w-6 bg-border" />
            <Icon name="heart" size={16} className="text-primary" />
            <span className="h-px w-6 bg-border" />
          </div>
          {isMulti ? (
            <AvatarGroup>
              {recipients.slice(0, 4).map((r) => (
                <UserAvatar key={r.address} user={r} size="lg" />
              ))}
              {recipients.length > 4 && (
                <AvatarGroupCount data-size="lg">
                  +{recipients.length - 4}
                </AvatarGroupCount>
              )}
            </AvatarGroup>
          ) : (
            <UserAvatar user={recipients[0]} size="lg" />
          )}
        </div>
        <Typography
          as="div"
          variant="caption"
          tone="secondary"
          className="mt-3"
        >
          {`${me?.name ?? "あなた"} → ${recipientLabel}`}
        </Typography>
        <div className="mt-4 flex items-baseline justify-center gap-1.5">
          <Typography
            as="span"
            variant="statLg"
            className="text-[48px] tracking-[-1.5px] tabular-nums"
          >
            {amount.toLocaleString()}
          </Typography>
          <Typography
            as="span"
            variant="bodySm"
            weight="bold"
            className="text-[#7A5A2E]"
          >
            THX
          </Typography>
          {isMulti && (
            <Typography
              as="span"
              variant="bodySm"
              tone="secondary"
              className="ml-2"
            >
              × {recipients.length}人 = {total.toLocaleString()} THX
            </Typography>
          )}
        </div>
        {message && (
          <div className="mx-5 mt-5 rounded-sm bg-bg px-4 py-3 text-left">
            <Typography variant="bodySm" className="leading-relaxed">
              {message}
            </Typography>
          </div>
        )}
      </Card>

      {/* `Button` carries `shrink-0`, so pairing a content-width secondary
          with a `full` (w-full) primary in a flex row overflows. A grid with
          `auto 1fr` tracks lets each item size to its own cell. */}
      <div className="grid grid-cols-[auto_1fr] gap-2.5 px-1">
        <Button variant="secondary" onClick={onEdit}>
          戻って修正
        </Button>
        <Button full onClick={onSubmit}>
          送信する
        </Button>
      </div>
    </div>
  );
};

// ───────────────────────────────────────────────────────────────
// Step 4: sending (pulse)
// ───────────────────────────────────────────────────────────────

const SendingStep: FC = () => (
  <CenteredPanel>
    <div className="mb-6 flex size-16 items-center justify-center rounded-full bg-primary-soft animate-pulse">
      <Icon name="send" size={28} className="text-primary" />
    </div>
    <Heading variant="h4" level={2}>
      サンクスを送信しています…
    </Heading>
    <Typography variant="bodySm" tone="secondary" className="mt-2">
      ブロックチェーンへの書き込みを待っています
    </Typography>
  </CenteredPanel>
);

// ───────────────────────────────────────────────────────────────
// Step 5: done
// ───────────────────────────────────────────────────────────────

const DoneStep: FC<{
  recipients: NameData[];
  amount: number;
  onHome: () => void;
  onSendAnother: () => void;
}> = ({ recipients, amount, onHome, onSendAnother }) => {
  const isMulti = recipients.length > 1;
  const label = isMulti
    ? `${recipients.length}人`
    : (recipients[0].name ??
      abbreviateAddress(recipients[0].address as `0x${string}`));
  const total = amount * recipients.length;
  return (
    <CenteredPanel>
      <div
        className="mb-5 flex size-[88px] items-center justify-center rounded-full bg-contrib text-white"
        style={{ boxShadow: "0 0 0 12px rgba(101,201,138,0.15)" }}
      >
        <Icon name="check" size={42} />
      </div>
      <Heading variant="h3" level={2}>
        サンクスを送りました
      </Heading>
      <Typography
        variant="bodySm"
        tone="secondary"
        className="mt-2 leading-relaxed"
      >
        <strong className="font-semibold text-text-primary">{label}</strong>
        {" に "}
        <strong className="font-semibold text-text-primary">
          {amount.toLocaleString()} THX
          {isMulti && ` ずつ (合計 ${total.toLocaleString()} THX)`}
        </strong>
        {" を送りました。"}
        <br />
        あなたのありがとうが記録されました。
      </Typography>
      <div className="mt-7 flex w-full max-w-[320px] flex-col gap-2.5">
        <Button full onClick={onHome}>
          ホームへ戻る
        </Button>
        <Button variant="ghost" full onClick={onSendAnother}>
          もう一度送る
        </Button>
      </div>
    </CenteredPanel>
  );
};

const CenteredPanel: FC<{ children: ReactNode; className?: string }> = ({
  children,
  className,
}) => (
  <div
    className={cn(
      "flex min-h-[calc(100dvh-12rem)] flex-col items-center justify-center px-6 text-center",
      className,
    )}
  >
    {children}
  </div>
);
