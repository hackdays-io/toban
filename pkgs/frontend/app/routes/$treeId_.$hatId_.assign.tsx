import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { useAddressesByNames, useNamesByAddresses } from "hooks/useENS";
import { useGetHat, useTreeInfo } from "hooks/useHats";
import { useMintHatFromTimeFrameModule } from "hooks/useHatsTimeFrameModule";
import { useScrollToTop } from "hooks/useScrollToTop";
import { useGetWorkspace } from "hooks/useWorkspace";
import type { NameData } from "namestone-sdk";
import { type FC, useCallback, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { toast } from "sonner";
import type { HatsDetailSchama } from "types/hats";
import { ipfs2https } from "utils/ipfs";
import { abbreviateAddress, isValidEthAddress } from "utils/wallet";
import type { Address } from "viem";
import { Divider } from "~/components/composite/divider";
import { EmptyState } from "~/components/composite/empty-state";
import { FieldLabel } from "~/components/composite/field-label";
import { Row } from "~/components/composite/row";
import { SectionLabel } from "~/components/composite/section-label";
import { SummaryRow } from "~/components/composite/summary-row";
import { ScreenHeader } from "~/components/layout/ScreenHeader";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import { Heading } from "~/components/ui/heading";
import { Icon } from "~/components/ui/icon";
import { Input } from "~/components/ui/input";
import { Typography } from "~/components/ui/typography";

type Step = "select" | "settings" | "confirm" | "done";

interface SelectedMember {
  address: Address;
  name?: string;
  avatarUrl?: string;
}

const useDutyDetail = (detailsUri?: string) => {
  const httpsUri = useMemo(() => ipfs2https(detailsUri), [detailsUri]);
  const { data } = useQuery({
    queryKey: ["hats-detail", httpsUri],
    enabled: !!httpsUri,
    staleTime: 1000 * 60 * 60,
    queryFn: async (): Promise<HatsDetailSchama | undefined> => {
      if (!httpsUri) return;
      const { data } = await axios.get<HatsDetailSchama>(httpsUri);
      return data;
    },
  });
  return data;
};

// Format a `datetime-local` value (`YYYY-MM-DDTHH:mm`) for display, falling
// back to a note when the user left the start date unset.
const formatStart = (value: string): string => {
  if (!value) return "トランザクション確定時";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "トランザクション確定時";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}/${pad(date.getMonth() + 1)}/${pad(
    date.getDate(),
  )} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

const avatarInitials = (member: SelectedMember): string =>
  (member.name ?? member.address.slice(2)).slice(0, 2).toUpperCase();

const MemberAvatar: FC<{
  member: SelectedMember;
  size?: "default" | "sm" | "lg" | "xl";
}> = ({ member, size }) => (
  <Avatar size={size}>
    {member.avatarUrl && (
      <AvatarImage src={member.avatarUrl} alt={member.name ?? member.address} />
    )}
    <AvatarFallback>{avatarInitials(member)}</AvatarFallback>
  </Avatar>
);

const MemberListSkeleton: FC = () => (
  <Card className="gap-0 overflow-hidden p-0">
    {["a", "b", "c", "d"].map((k, i) => (
      <div key={k}>
        {i > 0 && <Divider inset={64} />}
        <div className="flex items-center gap-3 px-4 py-3">
          <div className="size-9 shrink-0 animate-pulse rounded-full bg-[#F0EBDE]" />
          <div className="flex-1">
            <div className="h-3 w-24 animate-pulse rounded bg-[#F0EBDE]" />
            <div className="mt-2 h-2.5 w-32 animate-pulse rounded bg-[#F0EBDE]" />
          </div>
        </div>
      </div>
    ))}
  </Card>
);

const AssignDuty: FC = () => {
  const { treeId, hatId } = useParams();
  const navigate = useNavigate();

  const { data: workspaceData } = useGetWorkspace({
    workspaceId: treeId || "",
  });
  const { mintHat } = useMintHatFromTimeFrameModule(
    workspaceData?.workspace?.hatsTimeFrameModule as Address,
  );
  const { hat } = useGetHat(hatId ?? "");
  const detail = useDutyDetail(hat?.details);
  const dutyName = detail?.data?.name ?? "当番";
  const dutyDescription = detail?.data?.description;
  const dutyImageUrl = ipfs2https(hat?.imageUri);

  // ── Step machine ───────────────────────────────────────────
  const [step, setStep] = useState<Step>("select");
  const [selected, setSelected] = useState<SelectedMember | undefined>();
  const [startDatetime, setStartDatetime] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);

  // ── Member directory (select step) ─────────────────────────
  const tree = useTreeInfo(Number(treeId));

  // Addresses already wearing this duty — excluded from the picker so the
  // same person can't be assigned twice.
  const assignedAddresses = useMemo(
    () =>
      new Set(
        (hat?.wearers ?? [])
          .map((w) => w.id?.toLowerCase())
          .filter((a): a is string => !!a),
      ),
    [hat?.wearers],
  );

  // Every workspace member (wearers of role hats at level >= 2), deduped and
  // minus the addresses already assigned to this duty.
  const memberAddresses = useMemo(() => {
    if (!tree?.hats) return [];
    const wearers = tree.hats
      .filter((h) => h.levelAtLocalTree && h.levelAtLocalTree >= 2)
      .flatMap((h) => h.wearers ?? [])
      .map((w) => w.id?.toLowerCase())
      .filter((a): a is string => !!a);
    return Array.from(new Set(wearers)).filter(
      (a) => !assignedAddresses.has(a),
    );
  }, [tree, assignedAddresses]);

  const { names: memberNames, isLoading: isMembersLoading } =
    useNamesByAddresses(memberAddresses);

  // ── Search ─────────────────────────────────────────────────
  const [input, setInput] = useState("");
  const trimmed = input.trim();
  const isAddressInput = isValidEthAddress(trimmed);

  // Full resolved directory (search-independent).
  const allMembers = useMemo<SelectedMember[]>(
    () =>
      memberNames
        .map((g) => g[0])
        .filter((u): u is NameData => !!u && !!u.address)
        .map((u) => ({
          address: u.address as Address,
          name: u.name || undefined,
          avatarUrl: ipfs2https(u.text_records?.avatar),
        })),
    [memberNames],
  );

  // Namestone forward lookup so a name typed in the search box can resolve to
  // addresses that are NOT yet in the workspace directory (`useNamesByAddresses`
  // above only resolves names for addresses we already know). Skip when the
  // input parses as a raw address — that path has its own dedicated branch.
  const namestoneQuery = useMemo(
    () => (trimmed && !isAddressInput ? [trimmed] : undefined),
    [trimmed, isAddressInput],
  );
  const { addresses: namestoneHits, isLoading: isNamestoneLoading } =
    useAddressesByNames(namestoneQuery);

  // Flatten namestone hits into SelectedMember candidates, excluding anyone
  // already assigned to this duty and anyone we already have in `allMembers`.
  const namestoneMembers = useMemo<SelectedMember[]>(() => {
    if (!trimmed || isAddressInput) return [];
    const seen = new Set(allMembers.map((m) => m.address.toLowerCase()));
    const out: SelectedMember[] = [];
    for (const group of namestoneHits) {
      for (const u of group) {
        if (!u || !u.address) continue;
        const addr = u.address.toLowerCase();
        if (assignedAddresses.has(addr)) continue;
        if (seen.has(addr)) continue;
        seen.add(addr);
        out.push({
          address: u.address as Address,
          name: u.name || undefined,
          avatarUrl: ipfs2https(u.text_records?.avatar),
        });
      }
    }
    return out;
  }, [namestoneHits, allMembers, assignedAddresses, isAddressInput, trimmed]);

  // Client-side substring filter on existing members + namestone candidates.
  const visibleMembers = useMemo<SelectedMember[]>(() => {
    const q = trimmed.toLowerCase();
    if (!q) return allMembers;
    const localMatches = allMembers.filter(
      (m) =>
        m.name?.toLowerCase().includes(q) ||
        m.address.toLowerCase().includes(q),
    );
    return [...localMatches, ...namestoneMembers];
  }, [allMembers, trimmed, namestoneMembers]);

  // Keep the in-workspace skeleton on first paint, then let namestone results
  // stream in below. We deliberately don't gate the whole list on
  // `isNamestoneLoading` so local-only matches stay visible while the
  // namestone request is in flight.
  const directoryLoading =
    !tree || (isMembersLoading && allMembers.length === 0);
  const searchingNamestone = isNamestoneLoading && !!trimmed && !isAddressInput;

  // When the user pastes a raw address, resolve it against the directory so a
  // known member still shows their name, while a non-member can be onboarded
  // directly.
  const addressAssigned =
    isAddressInput && assignedAddresses.has(trimmed.toLowerCase());
  const addressMember = useMemo(() => {
    if (!isAddressInput) return undefined;
    const lower = trimmed.toLowerCase();
    return allMembers.find((m) => m.address.toLowerCase() === lower);
  }, [isAddressInput, trimmed, allMembers]);
  const addressCandidate: SelectedMember = addressMember ?? {
    address: trimmed as Address,
  };

  const rootRef = useScrollToTop([step]);

  const goToDetail = useCallback(
    () => navigate(`/${treeId}/${hatId}`),
    [navigate, treeId, hatId],
  );

  const chooseMember = useCallback((member: SelectedMember) => {
    setSelected(member);
    setStep("settings");
  }, []);

  const handleAssign = useCallback(async () => {
    if (!hatId || !selected) return;
    const time = startDatetime
      ? BigInt(Math.floor(new Date(startDatetime).getTime() / 1000))
      : BigInt(0);
    setSubmitting(true);
    try {
      await mintHat(BigInt(hatId), selected.address, time);
      // The receipt resolves the moment the block lands, but the Hats subgraph
      // still needs a beat to index the new wearer. The duty detail page
      // fetches once on mount, so pause before unlocking the "done" step.
      await new Promise((resolve) => setTimeout(resolve, 3000));
      setStep("done");
    } catch (error) {
      // viem's UserOperationExecutionError dumps callData + paymaster blobs
      // into `error.message`; surfacing it as a toast is useless to the user.
      console.error(error);
      toast.error("エラーが起きました。");
    } finally {
      setSubmitting(false);
    }
  }, [hatId, selected, startDatetime, mintHat]);

  const memberName = selected
    ? (selected.name ?? abbreviateAddress(selected.address))
    : "";

  return (
    <div ref={rootRef} className="flex min-h-dvh flex-col bg-bg">
      {/* ── Step 1: select ──────────────────────────────────── */}
      {step === "select" && (
        <>
          <ScreenHeader
            title="担当を追加"
            subtitle={dutyName}
            onBack={goToDetail}
          />

          <div className="px-4 pb-4">
            <Card className="gap-0 p-4">
              <div className="flex items-start gap-3">
                <Avatar size="xl" className="size-16 shrink-0">
                  {dutyImageUrl && (
                    <AvatarImage src={dutyImageUrl} alt={dutyName} />
                  )}
                  <AvatarFallback className="bg-primary-soft text-text-primary">
                    <Icon name="duty" size={24} />
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <Typography as="div" variant="body" weight="bold" truncate>
                    {dutyName}
                  </Typography>
                  {dutyDescription && (
                    <Typography
                      as="div"
                      variant="caption"
                      tone="secondary"
                      className="mt-0.5 leading-snug"
                    >
                      {dutyDescription}
                    </Typography>
                  )}
                </div>
              </div>
            </Card>
          </div>

          <div className="flex flex-col gap-4 px-4 pb-8">
            <Input
              icon={<Icon name="search" size={18} />}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="名前 or ウォレットアドレスで検索"
              autoComplete="off"
            />

            {isAddressInput ? (
              <section>
                <SectionLabel>指定したアドレス</SectionLabel>
                {addressAssigned ? (
                  <Card className="gap-0 p-4">
                    <Typography
                      variant="bodySm"
                      tone="secondary"
                      className="leading-relaxed"
                    >
                      このアドレスはすでにこの当番に割り当てられています。
                    </Typography>
                  </Card>
                ) : (
                  <Card className="gap-0 overflow-hidden p-0">
                    <Row
                      left={<MemberAvatar member={addressCandidate} />}
                      title={
                        addressMember?.name ??
                        abbreviateAddress(trimmed as Address)
                      }
                      subtitle={
                        addressMember
                          ? abbreviateAddress(trimmed as Address)
                          : "このアドレスを担当者にする"
                      }
                      right={
                        <Icon
                          name="chevron-right"
                          size={16}
                          className="text-text-secondary"
                        />
                      }
                      onClick={() => chooseMember(addressCandidate)}
                    />
                  </Card>
                )}
              </section>
            ) : (
              <section>
                <SectionLabel>
                  {trimmed ? "検索結果" : "メンバー一覧"}
                </SectionLabel>
                {directoryLoading ? (
                  <MemberListSkeleton />
                ) : visibleMembers.length === 0 ? (
                  searchingNamestone ? (
                    <Card className="gap-0 p-4">
                      <Typography variant="bodySm" tone="secondary">
                        検索中...
                      </Typography>
                    </Card>
                  ) : (
                    <EmptyState
                      icon={<Icon name="search" size={22} />}
                      title={
                        trimmed
                          ? "見つかりませんでした"
                          : "追加できるメンバーがいません"
                      }
                      body={
                        trimmed
                          ? "別のキーワードで検索するか、ウォレットアドレスを直接入力してください"
                          : "この当番に追加できるメンバーがいません。ウォレットアドレスを入力すれば直接追加できます。"
                      }
                    />
                  )
                ) : (
                  <>
                    <Card className="gap-0 overflow-hidden p-0">
                      {visibleMembers.map((m, i) => (
                        <div key={m.address}>
                          {i > 0 && <Divider inset={64} />}
                          <Row
                            left={<MemberAvatar member={m} />}
                            title={m.name ?? abbreviateAddress(m.address)}
                            subtitle={abbreviateAddress(m.address)}
                            right={
                              <Icon
                                name="chevron-right"
                                size={16}
                                className="text-text-secondary"
                              />
                            }
                            onClick={() => chooseMember(m)}
                          />
                        </div>
                      ))}
                    </Card>
                    {searchingNamestone && (
                      <Typography
                        as="div"
                        variant="caption"
                        tone="secondary"
                        className="mt-2 text-center"
                      >
                        他の候補を検索中...
                      </Typography>
                    )}
                  </>
                )}
              </section>
            )}
          </div>
        </>
      )}

      {/* ── Step 2: settings ────────────────────────────────── */}
      {step === "settings" && selected && (
        <>
          <ScreenHeader
            title="開始日を設定"
            subtitle={dutyName}
            onBack={() => setStep("select")}
          />

          <div className="px-5 pb-4">
            <FieldLabel>担当者</FieldLabel>
            <Card className="gap-0 p-3">
              <div className="flex items-center gap-3">
                <MemberAvatar member={selected} size="lg" />
                <div className="min-w-0 flex-1">
                  <Typography as="div" variant="body" weight="bold" truncate>
                    {memberName}
                  </Typography>
                  <Typography
                    as="div"
                    variant="caption"
                    tone="secondary"
                    truncate
                  >
                    {abbreviateAddress(selected.address)}
                  </Typography>
                </div>
              </div>
            </Card>
          </div>

          <div className="px-5 pb-8">
            <FieldLabel htmlFor="assign-start">開始日</FieldLabel>
            <Input
              id="assign-start"
              type="datetime-local"
              value={startDatetime}
              onChange={(e) => setStartDatetime(e.target.value)}
            />
            <Typography
              as="div"
              variant="caption"
              tone="secondary"
              className="mt-1.5 leading-snug"
            >
              未指定の場合、トランザクション確定時を開始日とします。
            </Typography>
          </div>

          <div className="px-4 pb-8">
            <Button
              type="button"
              variant="primary"
              full
              onClick={() => setStep("confirm")}
            >
              確認へ
            </Button>
          </div>
        </>
      )}

      {/* ── Step 3: confirm ─────────────────────────────────── */}
      {step === "confirm" && selected && (
        <>
          <ScreenHeader
            title="内容を確認"
            subtitle={dutyName}
            onBack={() => setStep("settings")}
          />

          <div className="px-4 pb-4">
            <Card className="gap-0 p-0">
              <SummaryRow label="当番" value={dutyName} />
              <Divider />
              <SummaryRow
                label="メンバー"
                value={
                  <span className="inline-flex items-center gap-2">
                    <MemberAvatar member={selected} size="sm" />
                    {memberName}
                  </span>
                }
              />
              <Divider />
              <SummaryRow label="開始日" value={formatStart(startDatetime)} />
            </Card>
          </div>

          <div className="flex gap-2.5 px-4 pb-8">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setStep("settings")}
              disabled={submitting}
              className="shrink-0"
            >
              戻って修正
            </Button>
            <Button
              type="button"
              variant="primary"
              onClick={handleAssign}
              disabled={submitting}
              data-testid="assign-submit"
              className="flex-1"
            >
              <Icon name="plus" size={16} />
              {submitting ? "追加中..." : "追加する"}
            </Button>
          </div>
        </>
      )}

      {/* ── Step 4: done ────────────────────────────────────── */}
      {step === "done" && selected && (
        <>
          <ScreenHeader title="完了" onBack={goToDetail} />

          <div className="flex flex-col items-center px-6 pt-10 pb-8 text-center">
            <div className="flex size-20 items-center justify-center rounded-full bg-[#E5F5EC]">
              <Icon name="check" size={36} className="text-success" />
            </div>
            <Heading variant="h3" level={2} className="mt-5">
              担当を追加しました
            </Heading>
            <Typography
              as="p"
              variant="bodySm"
              tone="secondary"
              className="mt-2 leading-relaxed"
            >
              <Typography
                as="span"
                variant="bodySm"
                weight="bold"
                tone="primary"
              >
                {memberName}
              </Typography>{" "}
              が「{dutyName}」の担当になりました。
            </Typography>
          </div>

          <div className="px-4 pb-8">
            <Button type="button" variant="primary" full onClick={goToDetail}>
              当番詳細へ戻る
            </Button>
          </div>
        </>
      )}
    </div>
  );
};

export default AssignDuty;
