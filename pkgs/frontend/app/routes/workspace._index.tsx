import { treeIdHexToDecimal } from "@hatsprotocol/sdk-v1-core";
import axios from "axios";
import { useActiveWalletIdentity } from "hooks/useENS";
import { useGetBalanceOfFractionTokens } from "hooks/useFractionToken";
import { useGetHatsByWorkspaceIds, useGetWorkspaces } from "hooks/useHats";
import { useGetHoldingThanksTokens } from "hooks/useThanksToken";
import { useActiveWallet } from "hooks/useWallet";
import { type FC, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import type { HatsDetailSchama } from "types/hats";
import { ipfs2https } from "utils/ipfs";
import { abbreviateAddress } from "utils/wallet";
import type { Address } from "viem";
import { EmptyState } from "~/components/composite/empty-state";
import { SectionLabel } from "~/components/composite/section-label";
import { WorkspaceCard } from "~/components/composite/workspace-card";
import { PageContainer } from "~/components/layout/PageContainer";
import { Button } from "~/components/ui/button";
import { Icon } from "~/components/ui/icon";
import { Input } from "~/components/ui/input";
import { useWorkspaceStore } from "~/stores/workspace";

type Workspace = {
  id: string;
  details: string;
  imageUri: string;
};

type WorkspaceDetails = {
  name?: string;
  description?: string;
};

// Resolve every workspace's IPFS-pinned details (name + description) in one
// place so the list, search, and card render from the same source. Failures
// are swallowed with `console.error` to match the previous implementation —
// IPFS is best-effort and we still want the rest of the list to render.
const useWorkspaceDetails = (workspaces: Workspace[]) => {
  const [detailsMap, setDetailsMap] = useState<
    Record<string, WorkspaceDetails>
  >({});

  useEffect(() => {
    let cancelled = false;
    // Track in-flight ids per effect run so we don't re-issue an axios call
    // for the same workspace within a single render. Reading from `detailsMap`
    // directly would force the effect to depend on it and re-run after every
    // resolved fetch — instead we let the functional setState short-circuit
    // duplicate writes.
    const pending = new Set<string>();
    for (const w of workspaces) {
      if (!w.details.startsWith("ipfs://")) continue;
      if (pending.has(w.id)) continue;
      const url = ipfs2https(w.details);
      if (!url) continue;
      pending.add(w.id);
      axios
        .get<HatsDetailSchama>(url)
        .then((res) => {
          if (cancelled) return;
          const { name, description } = res.data?.data ?? {};
          setDetailsMap((prev) =>
            prev[w.id] ? prev : { ...prev, [w.id]: { name, description } },
          );
        })
        .catch((error) => {
          console.error("Error fetching workspace details:", error);
        });
    }
    return () => {
      cancelled = true;
    };
  }, [workspaces]);

  return detailsMap;
};

const Workspace: FC = () => {
  const navigate = useNavigate();

  const { wallet } = useActiveWallet();
  const me = wallet?.account?.address?.toLocaleLowerCase();

  const { identity } = useActiveWalletIdentity();
  const greetingName =
    identity?.name ||
    (wallet?.account?.address ? abbreviateAddress(wallet.account.address) : "");

  const currentWorkspaceId = useWorkspaceStore((s) => s.currentWorkspaceId);
  const switchWorkspace = useWorkspaceStore((s) => s.switch);

  // Joined workspaces — the user wears at least one hat in them.
  const { workspaces: joinedWorkspaces, loading: loadingJoined } =
    useGetWorkspaces({ id: me });
  const joinedWorkspaceIds = useMemo(
    () => joinedWorkspaces.map((w) => w.id),
    [joinedWorkspaces],
  );

  // Workspaces where the user holds assist credit but no hat.
  const { data: fractionTokensData } = useGetBalanceOfFractionTokens({
    where: {
      owner: me,
      workspaceId_not_in: loadingJoined ? [] : joinedWorkspaceIds,
    },
  });
  const assistedWorkspaceIds = useMemo(() => {
    if (!fractionTokensData) return [];
    return fractionTokensData.balanceOfFractionTokens.map((t) => t.workspaceId);
  }, [fractionTokensData]);
  const { hats: assistedHats } = useGetHatsByWorkspaceIds(assistedWorkspaceIds);
  const assistedWorkspaces = useMemo<Workspace[]>(
    () =>
      assistedHats.map((h) => ({
        id: String(treeIdHexToDecimal(h.tree.id)),
        details: h.details,
        imageUri: h.imageUri,
      })),
    [assistedHats],
  );

  // Workspaces where the user has only received Thanks tokens.
  const excludeWorkspaceIds = useMemo(() => {
    const ids = [...joinedWorkspaceIds, ...assistedWorkspaceIds];
    return ids.length > 0 ? ids : undefined;
  }, [joinedWorkspaceIds, assistedWorkspaceIds]);
  const holdingThanksToken = useGetHoldingThanksTokens(me as Address, {
    where: { workspaceId_not_in: excludeWorkspaceIds },
  });
  const { hats: thankedHats } = useGetHatsByWorkspaceIds(
    holdingThanksToken.map((t) => t.workspaceId),
  );
  const thankedWorkspaces = useMemo<Workspace[]>(() => {
    if (!thankedHats) return [];
    return thankedHats.map((h) => ({
      id: String(treeIdHexToDecimal(h.tree.id)),
      details: h.details,
      imageUri: h.imageUri,
    }));
  }, [thankedHats]);

  // Flatten + de-dupe by id; the design shows a single "参加中" list rather
  // than three separate sub-headings.
  const allWorkspaces = useMemo<Workspace[]>(() => {
    const seen = new Set<string>();
    const merged: Workspace[] = [];
    for (const w of [
      ...joinedWorkspaces,
      ...assistedWorkspaces,
      ...thankedWorkspaces,
    ]) {
      if (seen.has(w.id)) continue;
      seen.add(w.id);
      merged.push(w);
    }
    return merged;
  }, [joinedWorkspaces, assistedWorkspaces, thankedWorkspaces]);

  const detailsMap = useWorkspaceDetails(allWorkspaces);

  const [search, setSearch] = useState("");
  const filteredWorkspaces = useMemo(() => {
    const q = search.trim().toLocaleLowerCase();
    if (!q) return allWorkspaces;
    return allWorkspaces.filter((w) => {
      const d = detailsMap[w.id];
      return (
        w.id.toLocaleLowerCase().includes(q) ||
        (d?.name ?? "").toLocaleLowerCase().includes(q) ||
        (d?.description ?? "").toLocaleLowerCase().includes(q)
      );
    });
  }, [allWorkspaces, detailsMap, search]);

  const handleSelect = (workspaceId: string) => {
    switchWorkspace(workspaceId);
    navigate(`/${workspaceId}`);
  };

  return (
    <PageContainer
      data-testid="workspace-page"
      className="flex flex-col gap-4 pt-4 pb-8 md:pt-6"
    >
      {/* Greeting + page title — mirrors `screens.jsx:1149-1152`. */}
      <header className="px-1">
        {greetingName && (
          <p className="text-[13px] text-text-secondary">
            こんにちは、{greetingName} さん
          </p>
        )}
        <h1 className="mt-0.5 text-2xl font-extrabold tracking-tight text-text-primary">
          ワークスペース
        </h1>
      </header>

      <Input
        icon={<Icon name="search" />}
        placeholder="ワークスペースを検索"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        aria-label="ワークスペースを検索"
      />

      <section className="-mx-1">
        <SectionLabel className="px-1">参加中</SectionLabel>
        {filteredWorkspaces.length > 0 ? (
          <div className="flex flex-col gap-2.5 px-1">
            {filteredWorkspaces.map((w) => {
              const d = detailsMap[w.id];
              const fallbackName = `Workspace #${w.id}`;
              return (
                <WorkspaceCard
                  key={w.id}
                  name={d?.name || fallbackName}
                  description={d?.description}
                  imageUrl={ipfs2https(w.imageUri) || undefined}
                  current={currentWorkspaceId === w.id}
                  onSelect={() => handleSelect(w.id)}
                />
              );
            })}
          </div>
        ) : allWorkspaces.length === 0 ? (
          <EmptyState
            icon={<Icon name="members" />}
            title="ワークスペースがまだありません"
            body="ワークスペースの管理者に当番を割り当ててもらうか、当番をもっている人からアシストクレジットを受け取るとワークスペースに自動的に参加できます。"
          />
        ) : (
          <EmptyState
            title="該当するワークスペースが見つかりません"
            body="検索キーワードを変えてみてください。"
          />
        )}
      </section>

      <div className="mt-2 px-1">
        <Button
          variant="secondary"
          full
          onClick={() => navigate("/workspace/new")}
        >
          <Icon name="plus" size={18} />
          新しいワークスペースを作成
        </Button>
      </div>
    </PageContainer>
  );
};

export default Workspace;
