import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { useNamesByAddresses } from "hooks/useENS";
import { useGetBalanceOfFractionTokens } from "hooks/useFractionToken";
import { useTreeInfo } from "hooks/useHats";
import { useHasAuthority } from "hooks/useHatsTimeFrameModule";
import { useQuests } from "hooks/useQuests";
import { useActiveWallet } from "hooks/useWallet";
import { useGetWorkspace } from "hooks/useWorkspace";
import type { NameData } from "namestone-sdk";
import { type FC, Fragment, useMemo } from "react";
import { Link, useParams } from "react-router";
import type { HatsDetailSchama } from "types/hats";
import { ipfs2https } from "utils/ipfs";
import { abbreviateAddress } from "utils/wallet";
import { Breadcrumb } from "~/components/composite/breadcrumb";
import { Divider } from "~/components/composite/divider";
import { Row } from "~/components/composite/row";
import { SectionLabel } from "~/components/composite/section-label";
import { PageContainer } from "~/components/layout/PageContainer";
import { QuestPanel } from "~/components/quests/QuestPanel";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import { Heading } from "~/components/ui/heading";
import { Icon } from "~/components/ui/icon";
import { Typography } from "~/components/ui/typography";
import { cn } from "~/lib/utils";

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

const DutyDetail: FC = () => {
  const { treeId, hatId } = useParams();
  const { wallet } = useActiveWallet();
  const me = wallet?.account?.address?.toLowerCase();

  // Pull the whole tree so we have consistent hat data (matches the
  // sibling routes — useGetHatById is the only Apollo path that needs
  // its own fetch and we hit transient null returns from it in the field).
  const tree = useTreeInfo(Number(treeId));
  const treeLoading = !tree;
  const hat = useMemo(
    () => tree?.hats?.find((h) => h.id?.toLowerCase() === hatId?.toLowerCase()),
    [tree, hatId],
  );
  const detail = useHatDetail(hat?.details);
  const dutyName = detail?.data?.name ?? "当番";
  const description = detail?.data?.description;
  const responsabilities = detail?.data?.responsabilities ?? [];
  const imageUrl = ipfs2https(hat?.imageUri);

  // ── Authorization (TopHat wearer can edit) ─────────────────
  // Top hat lives at `levelAtLocalTree === 0` inside the same tree we just
  // fetched, so reuse it instead of issuing a second query.
  const topHat = useMemo(
    () => tree?.hats?.find((h) => Number(h.levelAtLocalTree) === 0),
    [tree],
  );
  const isAuthorized = useMemo(() => {
    if (!me) return false;
    return topHat?.wearers?.some((w) => w.id?.toLowerCase() === me) ?? false;
  }, [me, topHat]);

  // ── Authorization for assigning new wearers ────────────────
  // Mirrors `HatsTimeFrameModule.hasAuthority` (admin/wearer of `minterHatId`);
  // the contract reverts `mintHat` otherwise, so we hide the "担当を追加"
  // button rather than letting the user kick off a doomed transaction.
  const { data: workspaceData } = useGetWorkspace({
    workspaceId: treeId || "",
  });
  const canAssign = useHasAuthority(
    workspaceData?.workspace?.hatsTimeFrameModule ?? undefined,
    me,
  );

  // ── Wearers & supporters ───────────────────────────────────
  const wearerAddresses = useMemo(
    () =>
      (hat?.wearers ?? [])
        .map((w) => w.id?.toLowerCase())
        .filter((a): a is string => !!a),
    [hat?.wearers],
  );

  // FractionToken balances for this hat. `hatId` is decimal in the subgraph.
  const hatIdDecimal = useMemo(() => {
    if (!hatId) return undefined;
    try {
      return BigInt(hatId).toString();
    } catch {
      return undefined;
    }
  }, [hatId]);
  const { data: balanceData } = useGetBalanceOfFractionTokens({
    where: { hatId: hatIdDecimal },
    first: 1000,
  });

  // Supporters = positive-balance owners who aren't wearers themselves.
  const wearerSet = useMemo(() => new Set(wearerAddresses), [wearerAddresses]);
  const supporterAddresses = useMemo(() => {
    if (!balanceData) return [];
    const seen = new Set<string>();
    for (const b of balanceData.balanceOfFractionTokens) {
      let bal: bigint;
      try {
        bal = BigInt(b.balance);
      } catch {
        continue;
      }
      if (bal <= 0n) continue;
      const owner = b.owner.toLowerCase();
      if (wearerSet.has(owner)) continue;
      seen.add(owner);
    }
    return Array.from(seen);
  }, [balanceData, wearerSet]);

  // Pull name + avatar for every address that appears anywhere on the page
  // in a single Namestone batch.
  const allAddresses = useMemo(
    () => Array.from(new Set([...wearerAddresses, ...supporterAddresses])),
    [wearerAddresses, supporterAddresses],
  );
  const { names } = useNamesByAddresses(allAddresses);
  const nameByAddress = useMemo(() => {
    const m = new Map<string, NameData>();
    for (const group of names) {
      const entry = group[0];
      if (entry?.address) m.set(entry.address.toLowerCase(), entry);
    }
    return m;
  }, [names]);

  // ── Quests scoped to this hat ───────────────────────────────
  const { quests, isLoading: questsLoading } = useQuests(treeId, {
    first: 100,
  });
  const dutyQuests = useMemo(() => {
    if (!hatIdDecimal) return [];
    return quests.filter((q) => q.hatId === hatIdDecimal);
  }, [quests, hatIdDecimal]);

  // Quest creation requires the viewer to actually hold some role share for
  // this hat (any wearer's shard). Check across all balances we already
  // fetched for this hatId.
  const canCreateQuest = useMemo(() => {
    if (!me || !balanceData) return false;
    return balanceData.balanceOfFractionTokens.some((b) => {
      if (b.owner.toLowerCase() !== me) return false;
      try {
        return BigInt(b.balance) > 0n;
      } catch {
        return false;
      }
    });
  }, [me, balanceData]);

  const breadcrumbItems = [
    { label: "当番一覧", to: `/${treeId}/role` },
    { label: dutyName },
  ];

  if (!hat) {
    return (
      <PageContainer className="pt-4 pb-8 md:pt-6">
        <Breadcrumb
          className="mb-3 px-1"
          items={[
            { label: "当番一覧", to: `/${treeId}/role` },
            { label: "当番" },
          ]}
        />
        <Card className="mt-3 py-12 text-center">
          <Typography variant="bodySm" tone="secondary">
            {treeLoading ? "読み込み中…" : "ロールが見つかりませんでした"}
          </Typography>
        </Card>
      </PageContainer>
    );
  }

  const mobileEditButton = isAuthorized ? (
    <Button
      asChild
      size="icon-sm"
      variant="ghost"
      aria-label="編集"
      className="-mr-1 shrink-0"
    >
      <Link to={`/${treeId}/${hatId}/edit`}>
        <Icon name="edit" size={18} />
      </Link>
    </Button>
  ) : null;

  return (
    <>
      <PageContainer className="pt-2 pb-10 md:pt-4">
        <Breadcrumb className="mb-3 px-1" items={breadcrumbItems} />

        {/* Mobile: single column */}
        <div className="md:hidden flex flex-col gap-4 px-1 pt-1">
          <DutyHeader
            name={dutyName}
            imageUrl={imageUrl}
            wearerCount={wearerAddresses.length}
            supporterCount={supporterAddresses.length}
            right={mobileEditButton}
          />

          <DescriptionCard
            description={description}
            responsabilities={responsabilities}
          />

          <QuestPanel
            quests={dutyQuests}
            loading={questsLoading}
            treeId={treeId}
            hatId={hatId}
            canCreate={canCreateQuest}
          />

          <CurrentAssigneesCard
            wearerAddresses={wearerAddresses}
            supporterAddresses={supporterAddresses}
            nameByAddress={nameByAddress}
            treeId={treeId ?? ""}
            hatId={hatId ?? ""}
          />

          {canAssign && (
            <div className="pt-2">
              <Button asChild variant="primary" full>
                <Link to={`/${treeId}/${hatId}/assign`}>
                  <Icon name="plus" size={16} />
                  担当を追加
                </Link>
              </Button>
            </div>
          )}
        </div>

        {/* Desktop: 60% main + 40% side (quests live on the side panel) */}
        <div className="hidden md:grid grid-cols-[3fr_2fr] gap-6 pt-2">
          <div className="flex flex-col gap-5 min-w-0">
            <div className="flex items-center gap-4">
              <DutyIcon imageUrl={imageUrl} size="lg" />
              <div className="min-w-0 flex-1">
                <Heading variant="h2" level={1} className="truncate">
                  {dutyName}
                </Heading>
                <Typography variant="caption" tone="secondary" className="mt-1">
                  担当: {wearerAddresses.length}人 ・ サポーター{" "}
                  {supporterAddresses.length}人
                </Typography>
              </div>
              {isAuthorized && (
                <Button asChild variant="secondary" size="sm">
                  <Link to={`/${treeId}/${hatId}/edit`}>
                    <Icon name="edit" size={14} />
                    編集
                  </Link>
                </Button>
              )}
            </div>

            <DescriptionCard
              description={description}
              responsabilities={responsabilities}
            />

            <CurrentAssigneesCard
              wearerAddresses={wearerAddresses}
              supporterAddresses={supporterAddresses}
              nameByAddress={nameByAddress}
              treeId={treeId ?? ""}
              hatId={hatId ?? ""}
            />

            {canAssign && (
              <Button asChild variant="primary" full>
                <Link to={`/${treeId}/${hatId}/assign`}>
                  <Icon name="plus" size={16} />
                  担当を追加
                </Link>
              </Button>
            )}
          </div>

          <aside className="flex flex-col gap-4">
            <QuestPanel
              quests={dutyQuests}
              loading={questsLoading}
              treeId={treeId}
              hatId={hatId}
              canCreate={canCreateQuest}
            />
          </aside>
        </div>
      </PageContainer>
    </>
  );
};

export default DutyDetail;

// ───────────────────────── Sub-components ─────────────────────────

interface DutyHeaderProps {
  name: string;
  imageUrl?: string;
  wearerCount: number;
  supporterCount: number;
  right?: React.ReactNode;
}

const DutyHeader: FC<DutyHeaderProps> = ({
  name,
  imageUrl,
  wearerCount,
  supporterCount,
  right,
}) => (
  <div className="flex items-center gap-3.5">
    <DutyIcon imageUrl={imageUrl} size="md" />
    <div className="min-w-0 flex-1">
      <Heading variant="h3" level={1} className="truncate">
        {name}
      </Heading>
      <Typography variant="caption" tone="secondary" className="mt-0.5">
        担当 {wearerCount}人 ・ サポーター {supporterCount}人
      </Typography>
    </div>
    {right}
  </div>
);

const DutyIcon: FC<{ imageUrl?: string; size: "md" | "lg" }> = ({
  imageUrl,
  size,
}) => (
  <div
    className={cn(
      "flex shrink-0 items-center justify-center overflow-hidden rounded-md bg-[#F2EAD9]",
      size === "lg" ? "size-16" : "size-14",
    )}
  >
    {imageUrl ? (
      <img src={imageUrl} alt="" className="size-full object-cover" />
    ) : (
      <Icon
        name="duty"
        size={size === "lg" ? 32 : 28}
        className="text-[#7A5A2E]"
      />
    )}
  </div>
);

interface DescriptionCardProps {
  description?: string;
  responsabilities: NonNullable<HatsDetailSchama["data"]["responsabilities"]>;
}

const DescriptionCard: FC<DescriptionCardProps> = ({
  description,
  responsabilities,
}) => {
  const bullets: string[] = [];
  if (description) bullets.push(description);
  for (const r of responsabilities) {
    if (r.label) bullets.push(r.label);
  }

  return (
    <section className="flex flex-col gap-2">
      <SectionLabel className="px-0">説明</SectionLabel>
      <Card className="px-4 py-4">
        {bullets.length === 0 ? (
          <Typography variant="bodySm" tone="secondary">
            まだ説明はありません
          </Typography>
        ) : (
          <ul className="flex flex-col gap-2">
            {bullets.map((line) => (
              <li key={line} className="flex items-start gap-2.5">
                <span
                  aria-hidden
                  className="mt-2 size-1.5 shrink-0 rounded-full bg-primary"
                />
                <Typography
                  variant="bodySm"
                  as="span"
                  className="leading-relaxed"
                >
                  {line}
                </Typography>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </section>
  );
};

interface CurrentAssigneesCardProps {
  wearerAddresses: string[];
  supporterAddresses: string[];
  nameByAddress: Map<string, NameData>;
  treeId: string;
  hatId: string;
}

const CurrentAssigneesCard: FC<CurrentAssigneesCardProps> = ({
  wearerAddresses,
  supporterAddresses,
  nameByAddress,
  treeId,
  hatId,
}) => {
  const rows = useMemo(
    () => [
      ...wearerAddresses.map((addr) => ({ addr, kind: "lead" as const })),
      ...supporterAddresses.map((addr) => ({
        addr,
        kind: "supporter" as const,
      })),
    ],
    [wearerAddresses, supporterAddresses],
  );

  return (
    <section className="flex flex-col gap-2">
      <SectionLabel className="px-0">現在の担当</SectionLabel>
      <Card className="gap-0 p-0">
        {rows.length === 0 ? (
          <div className="py-8 text-center">
            <Typography variant="bodySm" tone="secondary">
              まだ担当者はいません
            </Typography>
          </div>
        ) : (
          rows.map(({ addr, kind }, i) => {
            const entry = nameByAddress.get(addr);
            const displayName = entry?.name ?? abbreviateAddress(addr);
            const avatar = ipfs2https(entry?.text_records?.avatar);
            const badge =
              kind === "lead" ? (
                <Badge kind="lead">当番リード</Badge>
              ) : (
                <Badge kind="supporter">サポーター</Badge>
              );
            const inner = (
              <Row
                className={cn(
                  kind === "lead" &&
                    "cursor-pointer transition-colors hover:bg-bg",
                )}
                left={
                  <Avatar size="default">
                    {avatar && <AvatarImage src={avatar} alt="" />}
                    <AvatarFallback seed={displayName} />
                  </Avatar>
                }
                title={displayName}
                subtitle={abbreviateAddress(addr)}
                right={badge}
              />
            );
            return (
              <Fragment key={`${kind}-${addr}`}>
                {i > 0 && <Divider inset={56} />}
                {kind === "lead" ? (
                  <Link
                    to={`/${treeId}/${hatId}/${addr}`}
                    className="block focus-visible:rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
                  >
                    {inner}
                  </Link>
                ) : (
                  inner
                )}
              </Fragment>
            );
          })
        )}
      </Card>
    </section>
  );
};
