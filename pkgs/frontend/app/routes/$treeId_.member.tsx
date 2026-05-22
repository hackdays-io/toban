import type { Tree } from "@hatsprotocol/sdk-v1-subgraph";
import { useNamesByAddresses } from "hooks/useENS";
import { useGetBalanceOfFractionTokens } from "hooks/useFractionToken";
import { useTreeInfo } from "hooks/useHats";
import { type FC, useMemo, useState } from "react";
import { Link, useParams } from "react-router";
import { ipfs2https } from "utils/ipfs";
import { abbreviateAddress } from "utils/wallet";
import { Breadcrumb } from "~/components/composite/breadcrumb";
import { Divider } from "~/components/composite/divider";
import { Row } from "~/components/composite/row";
import { PageContainer } from "~/components/layout/PageContainer";
import { MemberDetailContent } from "~/components/members/MemberDetailContent";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import { Heading } from "~/components/ui/heading";
import { Icon } from "~/components/ui/icon";
import { Input } from "~/components/ui/input";
import { Typography } from "~/components/ui/typography";
import { cn } from "~/lib/utils";

type MemberRole = "lead" | "supporter";

interface MemberEntry {
  address: string;
  name?: string;
  avatarUrl?: string;
  role: MemberRole;
}

const ROLE_LABEL: Record<MemberRole, string> = {
  lead: "当番リード",
  supporter: "サポーター",
};

const WorkspaceMember: FC = () => {
  const { treeId } = useParams();
  const tree = useTreeInfo(Number(treeId));

  // Role-branch duty hats (level >= 2); their wearers are the 当番リード.
  const dutyHats = useMemo(
    () => tree?.hats?.filter((h) => Number(h.levelAtLocalTree) >= 2) ?? [],
    [tree],
  );
  const wearerAddresses = useMemo(() => {
    const set = new Set<string>();
    for (const h of dutyHats) {
      for (const w of h.wearers ?? []) {
        if (w.id) set.add(w.id.toLowerCase());
      }
    }
    return set;
  }, [dutyHats]);

  // FractionToken holders who aren't wearers count as サポーター.
  const { data: balanceData } = useGetBalanceOfFractionTokens({
    where: { workspaceId: treeId },
    first: 1000,
  });
  const supporterAddresses = useMemo(() => {
    const set = new Set<string>();
    if (!balanceData) return set;
    for (const b of balanceData.balanceOfFractionTokens) {
      if (Number(b.balance) <= 0) continue;
      const owner = b.owner.toLowerCase();
      if (wearerAddresses.has(owner)) continue;
      set.add(owner);
    }
    return set;
  }, [balanceData, wearerAddresses]);

  const allAddresses = useMemo(
    () => [...wearerAddresses, ...supporterAddresses],
    [wearerAddresses, supporterAddresses],
  );
  const { names } = useNamesByAddresses(allAddresses);

  const members = useMemo<MemberEntry[]>(() => {
    const list: MemberEntry[] = [];
    for (const group of names) {
      const entry = group[0];
      if (!entry?.address) continue;
      const address = entry.address.toLowerCase();
      list.push({
        address,
        name: entry.name || undefined,
        avatarUrl: ipfs2https(entry.text_records?.avatar),
        role: wearerAddresses.has(address) ? "lead" : "supporter",
      });
    }
    // Leads first, then supporters; alphabetical-ish within each by name.
    return list.sort((a, b) => {
      if (a.role !== b.role) return a.role === "lead" ? -1 : 1;
      return (a.name ?? a.address).localeCompare(b.name ?? b.address);
    });
  }, [names, wearerAddresses]);

  const [search, setSearch] = useState("");
  const filteredMembers = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return members;
    return members.filter(
      (m) => m.name?.toLowerCase().includes(q) || m.address.includes(q),
    );
  }, [members, search]);

  const loading = !tree;

  return (
    <PageContainer className="pt-4 pb-8 md:pt-6">
      <Breadcrumb
        className="mb-3 px-1"
        items={[{ label: "ホーム", to: `/${treeId}` }, { label: "メンバー" }]}
      />

      {/* Mobile single-column. */}
      <div className="md:hidden">
        <header className="mb-3 px-1">
          <Heading variant="h2" level={1}>
            メンバー
          </Heading>
          <Typography variant="bodySm" tone="secondary" className="mt-0.5">
            {members.length}人が参加中
          </Typography>
        </header>

        <div className="px-1 pb-3">
          <Input
            icon={<Icon name="search" size={18} />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ユーザー名 or ウォレットアドレス"
            autoComplete="off"
          />
        </div>

        <div className="px-1">
          <MemberList
            members={filteredMembers}
            treeId={treeId ?? ""}
            loading={loading}
            searching={search.trim().length > 0}
          />
        </div>
      </div>

      {/* Desktop master-detail. */}
      <div className="hidden md:block">
        <DesktopMembersView
          members={filteredMembers}
          totalCount={members.length}
          search={search}
          onSearchChange={setSearch}
          treeId={treeId ?? ""}
          tree={tree}
          loading={loading}
        />
      </div>
    </PageContainer>
  );
};

export default WorkspaceMember;

const MemberAvatar: FC<{
  member: MemberEntry;
  size?: "sm" | "default" | "lg";
}> = ({ member, size }) => (
  <Avatar size={size}>
    {member.avatarUrl && (
      <AvatarImage src={member.avatarUrl} alt={member.name ?? member.address} />
    )}
    <AvatarFallback seed={member.name ?? member.address} />
  </Avatar>
);

interface MemberListProps {
  members: MemberEntry[];
  treeId: string;
  loading: boolean;
  searching: boolean;
}

const MemberList: FC<MemberListProps> = ({
  members,
  treeId,
  loading,
  searching,
}) => {
  if (loading) return <MemberListSkeleton />;
  if (members.length === 0) {
    return (
      <Card className="py-10 text-center">
        <Typography variant="bodySm" tone="secondary">
          {searching
            ? "該当するメンバーが見つかりませんでした"
            : "メンバーがまだいません"}
        </Typography>
      </Card>
    );
  }
  return (
    <Card className="gap-0 overflow-hidden p-0">
      {members.map((m, i) => (
        <div key={m.address}>
          {i > 0 && <Divider inset={68} />}
          <Link to={`/${treeId}/member/${m.address}`} className="block">
            <Row
              className="transition-colors hover:bg-bg"
              left={<MemberAvatar member={m} />}
              title={m.name ?? abbreviateAddress(m.address as `0x${string}`)}
              subtitle={abbreviateAddress(m.address as `0x${string}`)}
              right={<Badge kind={m.role}>{ROLE_LABEL[m.role]}</Badge>}
            />
          </Link>
        </div>
      ))}
    </Card>
  );
};

const MemberListSkeleton: FC = () => (
  <Card className="gap-0 overflow-hidden p-0">
    {["a", "b", "c", "d", "e"].map((k, i) => (
      <div key={k}>
        {i > 0 && <Divider inset={68} />}
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

interface DesktopMembersViewProps {
  members: MemberEntry[];
  totalCount: number;
  search: string;
  onSearchChange: (value: string) => void;
  treeId: string;
  tree: Tree | undefined;
  loading: boolean;
}

const DesktopMembersView: FC<DesktopMembersViewProps> = ({
  members,
  totalCount,
  search,
  onSearchChange,
  treeId,
  tree,
  loading,
}) => {
  const [selectedAddress, setSelectedAddress] = useState<string>();
  const selected =
    members.find((m) => m.address === selectedAddress) ?? members[0];

  return (
    <div className="grid grid-cols-[320px_1fr] gap-6">
      {/* Master */}
      <aside className="flex flex-col gap-3">
        <header className="px-1">
          <Heading variant="h2" level={1}>
            メンバー
          </Heading>
          <Typography variant="bodySm" tone="secondary" className="mt-0.5">
            {totalCount}人が参加中
          </Typography>
        </header>

        <Input
          icon={<Icon name="search" size={18} />}
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="ユーザー名 or ウォレットアドレス"
          autoComplete="off"
        />

        {loading ? (
          <MemberListSkeleton />
        ) : members.length === 0 ? (
          <Card className="py-8 text-center">
            <Typography variant="bodySm" tone="secondary">
              {search.trim()
                ? "見つかりませんでした"
                : "メンバーがまだいません"}
            </Typography>
          </Card>
        ) : (
          <div className="flex flex-col gap-1">
            {members.map((m) => (
              <button
                key={m.address}
                type="button"
                onClick={() => setSelectedAddress(m.address)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-md border px-3 py-2.5 text-left transition-colors",
                  m.address === selected?.address
                    ? "border-primary bg-surface shadow-2"
                    : "border-transparent hover:bg-bg",
                )}
              >
                <MemberAvatar member={m} />
                <div className="min-w-0 flex-1">
                  <Typography
                    as="div"
                    variant="bodySm"
                    weight="semibold"
                    truncate
                  >
                    {m.name ?? abbreviateAddress(m.address as `0x${string}`)}
                  </Typography>
                  <Typography as="div" variant="mono" tone="secondary" truncate>
                    {abbreviateAddress(m.address as `0x${string}`)}
                  </Typography>
                </div>
                <Badge kind={m.role}>{ROLE_LABEL[m.role]}</Badge>
              </button>
            ))}
          </div>
        )}
      </aside>

      {/* Detail */}
      <section>
        {selected ? (
          <Card className="px-6 py-7">
            <MemberDetailContent
              treeId={treeId}
              address={selected.address}
              tree={tree}
              nameLevel={2}
            />
            <div className="mt-5 flex justify-center">
              <Button variant="secondary" size="sm" asChild>
                <Link to={`/${treeId}/member/${selected.address}`}>
                  詳細ページへ
                  <Icon name="chevron-right" size={14} />
                </Link>
              </Button>
            </div>
          </Card>
        ) : (
          <Card className="py-16 text-center">
            <Typography variant="bodySm" tone="secondary">
              メンバーを選択してください
            </Typography>
          </Card>
        )}
      </section>
    </div>
  );
};
