import type { Hat } from "@hatsprotocol/sdk-v1-subgraph";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { useNamesByAddresses } from "hooks/useENS";
import { useGetBalanceOfFractionTokens } from "hooks/useFractionToken";
import { useTreeInfo } from "hooks/useHats";
import { useHasCreatorAuthority } from "hooks/useHatsHatCreatorModule";
import { useHasAuthority } from "hooks/useHatsTimeFrameModule";
import { type Quest, type QuestStatus, useQuests } from "hooks/useQuests";
import { useActiveWallet } from "hooks/useWallet";
import { useGetWorkspace } from "hooks/useWorkspace";
import type { NameData } from "namestone-sdk";
import { type FC, Fragment, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import type { HatsDetailSchama } from "types/hats";
import { ipfs2https } from "utils/ipfs";
import { abbreviateAddress } from "utils/wallet";
import { formatEther } from "viem";
import { Breadcrumb } from "~/components/composite/breadcrumb";
import { SectionLabel } from "~/components/composite/section-label";
import { Segmented } from "~/components/composite/segmented";
import { PageContainer } from "~/components/layout/PageContainer";
import {
  Avatar,
  AvatarFallback,
  AvatarGroup,
  AvatarGroupCount,
  AvatarImage,
} from "~/components/ui/avatar";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import { Heading } from "~/components/ui/heading";
import { Icon } from "~/components/ui/icon";
import { Typography } from "~/components/ui/typography";
import { cn } from "~/lib/utils";

type DutyView = "duties" | "quests";
type DutyFilter = "mine" | "all" | "open";

// IPFS-backed Hat metadata. Shares the `["hats-detail", url]` cache key with
// `HatsListItemParser` so we don't refetch when bouncing between the list and
// detail screens.
const useHatDetail = (detailsUri?: string) => {
  const httpsUri = useMemo(() => ipfs2https(detailsUri), [detailsUri]);
  const { data } = useQuery({
    queryKey: ["hats-detail", httpsUri],
    queryFn: async (): Promise<HatsDetailSchama | undefined> => {
      if (!httpsUri) return;
      const { data } = await axios.get<HatsDetailSchama>(httpsUri);
      return data;
    },
    enabled: !!httpsUri,
    staleTime: 1000 * 60 * 60,
  });
  return data;
};

const WorkspaceRoles: FC = () => {
  const { treeId } = useParams();
  const navigate = useNavigate();
  const { wallet } = useActiveWallet();
  const me = wallet?.account?.address?.toLowerCase();

  const tree = useTreeInfo(Number(treeId));

  const [view, setView] = useState<DutyView>("duties");
  const [filter, setFilter] = useState<DutyFilter>("all");

  // Role-branch hats only (0001). 0002 is the admin/operator branch and is
  // excluded from the duty list — matching the legacy behaviour in
  // `WorkspaceWithBalance` before the renewal.
  const dutyHats = useMemo(() => {
    if (!tree?.hats) return [];
    return tree.hats.filter(
      (h) =>
        Number(h.levelAtLocalTree) >= 2 &&
        h.prettyId?.startsWith(`${tree.id}.0001`),
    );
  }, [tree]);

  const filteredDuties = useMemo(() => {
    return dutyHats.filter((h) => {
      const wearers = h.wearers ?? [];
      if (filter === "mine") {
        return !!me && wearers.some((w) => w.id?.toLowerCase() === me);
      }
      if (filter === "open") {
        return wearers.length === 0;
      }
      return true;
    });
  }, [dutyHats, filter, me]);

  // Workspace-wide FractionToken balances. Owners of a balance for a given hat
  // who aren't themselves wearers count as "supporters" of that duty (they
  // received a role share from a wearer). `first: 1000` caps an unbounded
  // result set; very large workspaces would need pagination, but the existing
  // subgraph balance queries elsewhere use the same ceiling.
  const { data: balanceData } = useGetBalanceOfFractionTokens({
    where: { workspaceId: treeId },
    first: 1000,
  });

  // Per-hat supporter list, keyed by the hat's hex id (matching `hat.id` in
  // the Hats subgraph). FractionToken `hatId` is decimal — convert via BigInt.
  const supportersByHat = useMemo(() => {
    const map = new Map<string, string[]>();
    if (!balanceData) return map;
    const wearerByHatHex = new Map<string, Set<string>>();
    for (const h of dutyHats) {
      const set = new Set<string>();
      for (const w of h.wearers ?? []) {
        if (w.id) set.add(w.id.toLowerCase());
      }
      wearerByHatHex.set(h.id.toLowerCase(), set);
    }
    const buckets = new Map<string, Set<string>>();
    for (const b of balanceData.balanceOfFractionTokens) {
      if (Number(b.balance) <= 0) continue;
      let hatHex: string;
      try {
        hatHex = `0x${BigInt(b.hatId).toString(16).padStart(64, "0")}`;
      } catch {
        continue;
      }
      const wearers = wearerByHatHex.get(hatHex);
      const owner = b.owner.toLowerCase();
      // Skip wearers themselves so they show up exclusively as 担当者.
      if (wearers?.has(owner)) continue;
      if (!buckets.has(hatHex)) buckets.set(hatHex, new Set());
      buckets.get(hatHex)?.add(owner);
    }
    for (const [hatHex, set] of buckets) {
      map.set(hatHex, Array.from(set));
    }
    return map;
  }, [balanceData, dutyHats]);

  // Resolve all unique member addresses (wearers + supporters) up-front so
  // each DutyCard reuses the same Namestone batch instead of issuing one
  // query per row.
  const memberAddresses = useMemo(() => {
    const set = new Set<string>();
    for (const h of dutyHats) {
      for (const w of h.wearers ?? []) {
        if (w.id) set.add(w.id.toLowerCase());
      }
    }
    for (const supporters of supportersByHat.values()) {
      for (const addr of supporters) set.add(addr);
    }
    return Array.from(set);
  }, [dutyHats, supportersByHat]);
  const { names } = useNamesByAddresses(memberAddresses);
  const nameByAddress = useMemo(() => {
    const map = new Map<string, NameData>();
    for (const group of names) {
      const entry = group[0];
      if (entry?.address) map.set(entry.address.toLowerCase(), entry);
    }
    return map;
  }, [names]);

  const goCreateDuty = () => navigate(`/${treeId}/roles/new`);

  // Only show 当番作成 / 担当を追加 to wallets the contracts already authorise.
  // `HatsHatCreatorModule.hasAuthority` gates `createHat`; the matching
  // `HatsTimeFrameModule.hasAuthority` gates `mintHat`. Both are workspace-
  // level (admin/wearer of the module's configured hat) so a single check
  // each is enough for every duty rendered.
  const { data: workspaceData } = useGetWorkspace({
    workspaceId: treeId || "",
  });
  const canCreateDuty = useHasCreatorAuthority(
    workspaceData?.workspace?.hatsHatCreatorModule ?? undefined,
    me,
  );
  const canAssignDuty = useHasAuthority(
    workspaceData?.workspace?.hatsTimeFrameModule ?? undefined,
    me,
  );

  return (
    <PageContainer className="pt-4 pb-8 md:pt-6">
      <Breadcrumb
        className="mb-3 px-1"
        items={[{ label: "ホーム", to: `/${treeId}` }, { label: "当番一覧" }]}
      />

      {/* Mobile single-column. */}
      <div className="md:hidden">
        <header className="mb-3 flex items-start justify-between gap-3 px-1">
          <div className="min-w-0 flex-1">
            <Heading variant="h2" level={1}>
              当番
            </Heading>
            <Typography variant="bodySm" tone="secondary" className="mt-0.5">
              コミュニティの役割と関わり
            </Typography>
          </div>
          {canCreateDuty && (
            <Button
              size="sm"
              variant="primary"
              onClick={goCreateDuty}
              className="shrink-0"
            >
              <Icon name="plus" size={14} />
              作成
            </Button>
          )}
        </header>

        <div className="px-1 pb-3">
          <Segmented
            value={view}
            onChange={setView}
            options={[
              { value: "duties", label: "当番" },
              { value: "quests", label: "クエスト" },
            ]}
            className="w-full"
          />
        </div>

        {view === "duties" ? (
          <DutiesPanel
            duties={filteredDuties}
            filter={filter}
            onFilterChange={setFilter}
            treeId={treeId ?? ""}
            nameByAddress={nameByAddress}
            supportersByHat={supportersByHat}
          />
        ) : (
          <QuestsPanel treeId={treeId} dutyHats={dutyHats} />
        )}
      </div>

      {/* Desktop master + summary. */}
      <div className="hidden md:block">
        <DesktopRolesView
          dutyHats={dutyHats}
          filteredDuties={filteredDuties}
          view={view}
          onViewChange={setView}
          filter={filter}
          onFilterChange={setFilter}
          treeId={treeId ?? ""}
          nameByAddress={nameByAddress}
          supportersByHat={supportersByHat}
          canCreateDuty={canCreateDuty}
          canAssignDuty={canAssignDuty}
          onCreate={goCreateDuty}
        />
      </div>
    </PageContainer>
  );
};

export default WorkspaceRoles;

// ───────────────────────── Mobile: Duties panel ─────────────────────────

interface DutiesPanelProps {
  duties: Hat[];
  filter: DutyFilter;
  onFilterChange: (next: DutyFilter) => void;
  treeId: string;
  nameByAddress: Map<string, NameData>;
  supportersByHat: Map<string, string[]>;
}

const DutiesPanel: FC<DutiesPanelProps> = ({
  duties,
  filter,
  onFilterChange,
  treeId,
  nameByAddress,
  supportersByHat,
}) => (
  <>
    <div className="px-1 pb-3">
      <Segmented
        value={filter}
        onChange={onFilterChange}
        options={[
          { value: "mine", label: "あなたの当番" },
          { value: "all", label: "すべて" },
          { value: "open", label: "空き" },
        ]}
        className="w-full"
      />
    </div>

    {duties.length > 0 ? (
      <div className="flex flex-col gap-2.5 px-1">
        {duties.map((h) => (
          <DutyCard
            key={h.id}
            hat={h}
            treeId={treeId}
            nameByAddress={nameByAddress}
            supporters={supportersByHat.get(h.id.toLowerCase()) ?? []}
          />
        ))}
      </div>
    ) : (
      <Card className="mx-1 py-8 text-center">
        <Typography variant="bodySm" tone="secondary">
          {emptyLabel(filter)}
        </Typography>
      </Card>
    )}
  </>
);

const emptyLabel = (filter: DutyFilter): string => {
  if (filter === "mine") return "担当中の当番はありません";
  if (filter === "open") return "空きの当番はありません";
  return "当番がまだ作成されていません";
};

// ───────────────────────── DutyCard ─────────────────────────

interface DutyCardProps {
  hat: Hat;
  treeId: string;
  nameByAddress: Map<string, NameData>;
  /** Supporter addresses (FractionToken holders excluding wearers). */
  supporters: string[];
  /** Render a compact variant (used in the desktop master list). */
  compact?: boolean;
  selected?: boolean;
  onSelect?: () => void;
}

const DutyCard: FC<DutyCardProps> = ({
  hat,
  treeId,
  nameByAddress,
  supporters,
  compact = false,
  selected = false,
  onSelect,
}) => {
  const detail = useHatDetail(hat.details);
  const imageUrl = ipfs2https(hat.imageUri);
  const name = detail?.data?.name ?? "当番";
  const wearerAddresses = useMemo(
    () =>
      (hat.wearers ?? [])
        .map((w) => w.id?.toLowerCase())
        .filter((a): a is string => !!a),
    [hat.wearers],
  );
  const content = (
    <>
      <div className="flex min-w-0 items-center gap-3">
        <DutyIcon imageUrl={imageUrl} size={compact ? "sm" : "md"} />
        {compact ? (
          <Typography as="div" variant="bodySm" weight="bold" truncate>
            {name}
          </Typography>
        ) : (
          <Heading variant="h6" level={3} className="truncate">
            {name}
          </Heading>
        )}
      </div>
      <div
        className={cn(
          "flex flex-col gap-1.5",
          compact ? "pl-12" : "pl-[3.25rem]",
        )}
      >
        <MemberRow
          label="担当者"
          addresses={wearerAddresses}
          nameByAddress={nameByAddress}
          emptyLabel="募集中"
          maxVisible={compact ? 3 : 5}
        />
        <MemberRow
          label="サポーター"
          addresses={supporters}
          nameByAddress={nameByAddress}
          emptyLabel="なし"
          maxVisible={compact ? 3 : 5}
        />
      </div>
    </>
  );

  const cardClass = cn(
    "gap-2 transition-colors",
    compact
      ? "cursor-pointer rounded-md border px-3 py-3 hover:bg-bg"
      : "px-3.5 py-3.5 hover:bg-bg",
    selected && "border-primary bg-surface shadow-2",
  );

  if (onSelect) {
    return (
      <button
        type="button"
        onClick={onSelect}
        className="block w-full text-left"
      >
        <Card className={cardClass}>{content}</Card>
      </button>
    );
  }

  return (
    <Link
      to={`/${treeId}/${hat.id}`}
      className="block focus-visible:rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
    >
      <Card className={cardClass}>{content}</Card>
    </Link>
  );
};

interface MemberRowProps {
  label: string;
  addresses: string[];
  nameByAddress: Map<string, NameData>;
  emptyLabel: string;
  maxVisible?: number;
}

const MemberRow: FC<MemberRowProps> = ({
  label,
  addresses,
  nameByAddress,
  emptyLabel,
  maxVisible = 5,
}) => {
  return (
    <div className="flex items-center gap-2">
      <Typography
        as="span"
        variant="micro"
        tone="secondary"
        weight="semibold"
        className="w-16 shrink-0"
      >
        {label}
      </Typography>
      {addresses.length === 0 ? (
        <Typography variant="micro" tone="secondary" as="span">
          {emptyLabel}
        </Typography>
      ) : (
        <MemberAvatars
          addresses={addresses}
          nameByAddress={nameByAddress}
          maxVisible={maxVisible}
        />
      )}
    </div>
  );
};

interface MemberAvatarsProps {
  addresses: string[];
  nameByAddress: Map<string, NameData>;
  maxVisible?: number;
}

const MemberAvatars: FC<MemberAvatarsProps> = ({
  addresses,
  nameByAddress,
  maxVisible = 5,
}) => {
  const visible = addresses.slice(0, maxVisible);
  const overflow = addresses.length - visible.length;
  return (
    <AvatarGroup className="-space-x-1">
      {visible.map((addr) => {
        const entry = nameByAddress.get(addr);
        const seed =
          entry?.name ?? abbreviateAddress(addr as `0x${string}`) ?? addr;
        const avatar = ipfs2https(entry?.text_records?.avatar);
        return (
          <Avatar
            key={addr}
            size="sm"
            className="size-6 text-[9px]"
            title={seed}
          >
            {avatar && <AvatarImage src={avatar} alt="" />}
            <AvatarFallback seed={seed} />
          </Avatar>
        );
      })}
      {overflow > 0 && (
        <AvatarGroupCount className="size-6 text-[10px]">
          +{overflow}
        </AvatarGroupCount>
      )}
    </AvatarGroup>
  );
};

const DutyIcon: FC<{ imageUrl?: string; size: "sm" | "md" }> = ({
  imageUrl,
  size,
}) => (
  <div
    className={cn(
      "flex shrink-0 items-center justify-center overflow-hidden rounded-sm bg-[#F2EAD9]",
      size === "md" ? "size-10" : "size-9",
    )}
  >
    {imageUrl ? (
      <img src={imageUrl} alt="" className="size-full object-cover" />
    ) : (
      <Icon
        name="duty"
        size={size === "md" ? 20 : 18}
        className="text-[#7A5A2E]"
      />
    )}
  </div>
);

// ───────────────────────── Quests panel ─────────────────────────

interface QuestsPanelProps {
  treeId?: string;
  dutyHats: Hat[];
}

const QuestsPanel: FC<QuestsPanelProps> = ({ treeId, dutyHats }) => {
  const { quests, isLoading } = useQuests(treeId, { first: 50 });

  // Map hatId (decimal, returned by the Quest entity) → hat detail URI so
  // each quest card can show its parent duty's name without re-fetching.
  const hatByDecimalId = useMemo(() => {
    const map = new Map<string, Hat>();
    for (const h of dutyHats) {
      try {
        map.set(BigInt(h.id).toString(), h);
      } catch {
        // ignore non-hex ids
      }
    }
    return map;
  }, [dutyHats]);

  const groups: { status: QuestStatus; title: string }[] = [
    { status: "Open", title: "募集中のクエスト" },
    { status: "PendingReview", title: "確認待ち" },
    { status: "Completed", title: "完了" },
  ];

  const hasAny = quests.length > 0;

  if (isLoading && !hasAny) {
    return (
      <Card className="mx-1 py-8 text-center">
        <Typography variant="bodySm" tone="secondary">
          クエストを読み込み中…
        </Typography>
      </Card>
    );
  }

  if (!hasAny) {
    return (
      <Card className="mx-1 py-8 text-center">
        <Typography variant="bodySm" tone="secondary">
          クエストはまだありません
        </Typography>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {groups.map((g) => {
        const items = quests.filter((q) => q.status === g.status);
        if (items.length === 0) return null;
        return (
          <Fragment key={g.status}>
            <SectionLabel className="px-1">
              {g.title}（{items.length}）
            </SectionLabel>
            <div className="flex flex-col gap-2 px-1">
              {items.map((q) => (
                <QuestCard
                  key={q.id}
                  quest={q}
                  hat={hatByDecimalId.get(q.hatId)}
                  treeId={treeId}
                />
              ))}
            </div>
          </Fragment>
        );
      })}
    </div>
  );
};

interface QuestCardProps {
  quest: Quest;
  hat?: Hat;
  treeId?: string;
}

const QuestCard: FC<QuestCardProps> = ({ quest, hat, treeId }) => {
  const detail = useHatDetail(hat?.details);
  const dutyName = detail?.data?.name;
  const amount = (() => {
    try {
      return Number(formatEther(BigInt(quest.amount))).toLocaleString();
    } catch {
      return "0";
    }
  })();

  const card = (
    <Card className="gap-2 px-3.5 py-3 transition-colors hover:bg-bg">
      <div className="flex items-start gap-2.5">
        <div className="min-w-0 flex-1">
          {dutyName && (
            <Typography
              as="div"
              variant="micro"
              tone="secondary"
              weight="bold"
              truncate
              className="mb-0.5"
            >
              {dutyName}
            </Typography>
          )}
          <Typography as="div" variant="bodySm" weight="bold" truncate>
            Quest #{quest.questId}
          </Typography>
          <div className="mt-1 flex items-center gap-2">
            <QuestStateBadge status={quest.status} />
            <Typography variant="micro" tone="secondary" as="span">
              {questMeta(quest)}
            </Typography>
          </div>
        </div>
        <div className="shrink-0 text-right">
          <Typography variant="micro" tone="secondary" as="div">
            当番シェア
          </Typography>
          <Typography
            as="div"
            variant="statMd"
            className="text-primary tracking-[-0.5px]"
          >
            +{amount}
            <Typography
              as="span"
              variant="micro"
              tone="secondary"
              className="ml-0.5"
            >
              THX
            </Typography>
          </Typography>
        </div>
      </div>
    </Card>
  );

  // Quest detail route doesn't ship until #446. Wrap in Link only when we have
  // a sensible hat to fall back to (parent duty), otherwise render unlinked.
  if (treeId && hat?.id) {
    return (
      <Link
        to={`/${treeId}/${hat.id}`}
        className="block focus-visible:rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
      >
        {card}
      </Link>
    );
  }
  return card;
};

const QuestStateBadge: FC<{ status: QuestStatus }> = ({ status }) => {
  switch (status) {
    case "Open":
      return <Badge kind="lead">募集中</Badge>;
    case "PendingReview":
      return <Badge kind="info">確認待ち</Badge>;
    case "Completed":
      return <Badge kind="member">完了</Badge>;
    case "Cancelled":
      return <Badge kind="role">取消</Badge>;
    default:
      return null;
  }
};

const questMeta = (q: Quest): string => {
  if (q.status === "Open") {
    return `作成者: ${abbreviateAddress(q.creator as `0x${string}`)}`;
  }
  if (q.status === "PendingReview") {
    return `申請者: ${
      q.submitter ? abbreviateAddress(q.submitter as `0x${string}`) : "-"
    }・承認 ${q.approvalCount}/2`;
  }
  if (q.status === "Completed") {
    return `${
      q.submitter ? abbreviateAddress(q.submitter as `0x${string}`) : "-"
    } が完了`;
  }
  return "";
};

// ───────────────────────── Desktop master-detail ─────────────────────────

interface DesktopRolesViewProps {
  dutyHats: Hat[];
  filteredDuties: Hat[];
  view: DutyView;
  onViewChange: (v: DutyView) => void;
  filter: DutyFilter;
  onFilterChange: (f: DutyFilter) => void;
  treeId: string;
  nameByAddress: Map<string, NameData>;
  supportersByHat: Map<string, string[]>;
  canCreateDuty: boolean;
  canAssignDuty: boolean;
  onCreate: () => void;
}

const DesktopRolesView: FC<DesktopRolesViewProps> = ({
  dutyHats,
  filteredDuties,
  view,
  onViewChange,
  filter,
  onFilterChange,
  treeId,
  nameByAddress,
  supportersByHat,
  canCreateDuty,
  canAssignDuty,
  onCreate,
}) => {
  const [selectedId, setSelectedId] = useState<string | undefined>(
    () => filteredDuties[0]?.id ?? dutyHats[0]?.id,
  );
  const selectedHat =
    dutyHats.find((h) => h.id === selectedId) ??
    filteredDuties[0] ??
    dutyHats[0];

  return (
    <div className="grid grid-cols-[320px_1fr] gap-6">
      {/* Master */}
      <aside className="flex flex-col gap-3">
        <header className="flex items-start justify-between gap-3 px-1">
          <div className="min-w-0 flex-1">
            <Heading variant="h2" level={1}>
              当番
            </Heading>
            <Typography variant="bodySm" tone="secondary" className="mt-0.5">
              コミュニティの役割と関わり
            </Typography>
          </div>
          {canCreateDuty && (
            <Button
              size="sm"
              variant="primary"
              onClick={onCreate}
              className="shrink-0"
            >
              <Icon name="plus" size={14} />
              作成
            </Button>
          )}
        </header>
        <Segmented
          value={view}
          onChange={onViewChange}
          options={[
            { value: "duties", label: "当番" },
            { value: "quests", label: "クエスト" },
          ]}
          className="w-full"
        />
        {view === "duties" ? (
          <>
            <Segmented
              value={filter}
              onChange={onFilterChange}
              options={[
                { value: "mine", label: "あなた" },
                { value: "all", label: "すべて" },
                { value: "open", label: "空き" },
              ]}
              className="w-full"
            />
            {filteredDuties.length > 0 ? (
              <div className="flex flex-col gap-1.5">
                {filteredDuties.map((h) => (
                  <DutyCard
                    key={h.id}
                    hat={h}
                    treeId={treeId}
                    nameByAddress={nameByAddress}
                    supporters={supportersByHat.get(h.id.toLowerCase()) ?? []}
                    compact
                    selected={h.id === selectedHat?.id}
                    onSelect={() => setSelectedId(h.id)}
                  />
                ))}
              </div>
            ) : (
              <Card className="py-6 text-center">
                <Typography variant="bodySm" tone="secondary">
                  {emptyLabel(filter)}
                </Typography>
              </Card>
            )}
          </>
        ) : (
          <QuestsPanel treeId={treeId} dutyHats={dutyHats} />
        )}
      </aside>

      {/* Detail */}
      <section>
        {view === "duties" && selectedHat ? (
          <DutyDetailPreview
            hat={selectedHat}
            treeId={treeId}
            nameByAddress={nameByAddress}
            supporters={supportersByHat.get(selectedHat.id.toLowerCase()) ?? []}
            canAssign={canAssignDuty}
          />
        ) : view === "duties" ? (
          <Card className="py-12 text-center">
            <Typography variant="bodySm" tone="secondary">
              当番を選択してください
            </Typography>
          </Card>
        ) : (
          <Card className="py-12 text-center">
            <Typography variant="bodySm" tone="secondary">
              左のリストからクエストを選択してください
            </Typography>
          </Card>
        )}
      </section>
    </div>
  );
};

interface DutyDetailPreviewProps {
  hat: Hat;
  treeId: string;
  nameByAddress: Map<string, NameData>;
  supporters: string[];
  canAssign: boolean;
}

// Lightweight preview for the master-detail right pane. The full duty detail
// page (#435) will eventually own this slot — until then, surface enough
// information to confirm a selection and link out to the dedicated route.
const DutyDetailPreview: FC<DutyDetailPreviewProps> = ({
  hat,
  treeId,
  nameByAddress,
  supporters,
  canAssign,
}) => {
  const detail = useHatDetail(hat.details);
  const imageUrl = ipfs2https(hat.imageUri);
  const name = detail?.data?.name ?? "当番";
  const description = detail?.data?.description;
  const wearers = hat.wearers ?? [];
  const wearerAddresses = wearers
    .map((w) => w.id?.toLowerCase())
    .filter((a): a is string => !!a);

  return (
    <Card className="gap-5 py-6">
      <div className="flex items-start gap-4 px-6">
        <div className="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-md bg-[#F2EAD9]">
          {imageUrl ? (
            <img src={imageUrl} alt="" className="size-full object-cover" />
          ) : (
            <Icon name="duty" size={28} className="text-[#7A5A2E]" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <Heading variant="h3" level={2} className="truncate">
            {name}
          </Heading>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Button variant="secondary" asChild>
            <Link to={`/${treeId}/${hat.id}`}>
              詳細
              <Icon name="chevron-right" size={16} />
            </Link>
          </Button>
          {canAssign && (
            <Button variant="primary" asChild>
              <Link to={`/${treeId}/${hat.id}/assign`}>
                <Icon name="plus" size={16} />
                担当を追加
              </Link>
            </Button>
          )}
        </div>
      </div>

      {description && (
        <div className="px-6">
          <SectionLabel className="mb-2 px-0">説明</SectionLabel>
          <Typography variant="bodySm" tone="secondary">
            {description}
          </Typography>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 px-6">
        <MemberColumn
          title="担当者"
          count={wearerAddresses.length}
          addresses={wearerAddresses}
          nameByAddress={nameByAddress}
          treeId={treeId}
          hatId={hat.id}
          linkable
          emptyLabel="担当者を募集中"
        />
        <MemberColumn
          title="サポーター"
          count={supporters.length}
          addresses={supporters}
          nameByAddress={nameByAddress}
          treeId={treeId}
          hatId={hat.id}
          linkable={false}
          emptyLabel="まだいません"
        />
      </div>
    </Card>
  );
};

interface MemberColumnProps {
  title: string;
  count: number;
  addresses: string[];
  nameByAddress: Map<string, NameData>;
  treeId: string;
  hatId: string;
  linkable: boolean;
  emptyLabel: string;
}

const MemberColumn: FC<MemberColumnProps> = ({
  title,
  count,
  addresses,
  nameByAddress,
  treeId,
  hatId,
  linkable,
  emptyLabel,
}) => (
  <div>
    <SectionLabel className="mb-2 px-0">
      {title}（{count}）
    </SectionLabel>
    {addresses.length === 0 ? (
      <Typography variant="bodySm" tone="secondary">
        {emptyLabel}
      </Typography>
    ) : (
      <div className="flex flex-col gap-1">
        {addresses.map((addr) => {
          const entry = nameByAddress.get(addr);
          const displayName =
            entry?.name ?? abbreviateAddress(addr as `0x${string}`);
          const avatar = ipfs2https(entry?.text_records?.avatar);
          const rowClass =
            "flex items-center gap-2.5 rounded-sm px-2 py-1.5 hover:bg-bg";
          if (linkable) {
            return (
              <Link
                key={addr}
                to={`/${treeId}/${hatId}/${addr}`}
                className={rowClass}
              >
                <Avatar size="sm">
                  {avatar && <AvatarImage src={avatar} alt="" />}
                  <AvatarFallback seed={displayName} />
                </Avatar>
                <Typography
                  as="span"
                  variant="bodySm"
                  weight="semibold"
                  truncate
                >
                  {displayName}
                </Typography>
              </Link>
            );
          }
          return (
            <div key={addr} className={rowClass}>
              <Avatar size="sm">
                {avatar && <AvatarImage src={avatar} alt="" />}
                <AvatarFallback seed={displayName} />
              </Avatar>
              <Typography as="span" variant="bodySm" weight="semibold" truncate>
                {displayName}
              </Typography>
            </div>
          );
        })}
      </div>
    )}
  </div>
);
