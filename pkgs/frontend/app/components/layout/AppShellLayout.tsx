import axios from "axios";
import { useTreeInfo } from "hooks/useHats";
import { useEffect, useMemo, useState } from "react";
import {
  Outlet,
  useLocation,
  useMatches,
  useNavigate,
  useParams,
} from "react-router";
import type { HatsDetailSchama } from "types/hats";
import { ipfs2https } from "utils/ipfs";
import { AccountMenu } from "./AccountMenu";
import { AppShell } from "./AppShell";
import { WorkspaceSwitcherMenu } from "./WorkspaceSwitcherMenu";

// Per-route AppShell inputs are declared via React Router v7's `handle`
// export. Pages opt in by exporting `export const handle: AppShellHandle = {…}`.
// The wrapper reads the deepest match's handle so nested routes win.
interface AppShellHandle {
  /** Bottom-nav / Sidebar active key (`home` / `duties` / `splits` / ...). */
  active?: string;
}

// Only the `/{treeId}/...` routes get wrapped with AppShell. These segments
// must be excluded so the auth and workspace-bootstrap surfaces stay
// shell-less. `transaction` is included for the legacy send screen.
// `connect` is the external-service binding landing (e.g. /connect/discord)
// — a deep-link single-purpose page, so no nav.
const SHELL_LESS_FIRST_SEGMENTS = new Set([
  "",
  "login",
  "signup",
  "transaction",
  "workspace",
  "api",
  "connect",
]);

function isShellRoute(pathname: string): { active: boolean; treeId?: string } {
  const segments = pathname.split("/").filter(Boolean);
  if (segments.length === 0) return { active: false };
  const first = segments[0];
  if (SHELL_LESS_FIRST_SEGMENTS.has(first)) return { active: false };
  return { active: true, treeId: first };
}

// Maps the second pathname segment to a BottomNav / Sidebar key. The keys
// mirror `app/components/layout/BottomNav.tsx` defaults.
function deriveActiveKey(pathname: string): string {
  const segments = pathname.split("/").filter(Boolean);
  // segments[0] = treeId, segments[1] = section
  const section = segments[1];
  if (!section) return "home";
  if (section === "splits") return "splits";
  if (section === "member" || section === "members") return "members";
  if (section === "thankstoken") return "wallet";
  if (section === "history") return "wallet";
  if (section === "role" || section === "roles") return "duties";
  if (section === "settings") return "home";
  // Hat-id deep paths like `/{treeId}/{hatId}/...` count as duties.
  return "duties";
}

interface ShellViewProps {
  treeId: string;
}

function ShellView({ treeId }: ShellViewProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const matches = useMatches();
  const treeInfo = useTreeInfo(Number(treeId));
  const [workspaceName, setWorkspaceName] = useState<string>();
  const [switcherOpen, setSwitcherOpen] = useState(false);

  // Resolve workspace metadata from the TopHat (level 0) details document —
  // ported verbatim from the legacy `app/components/Header.tsx` so the
  // existing IPFS detail shape keeps working.
  useEffect(() => {
    let cancelled = false;
    const fetchName = async () => {
      setWorkspaceName(undefined);
      const topHat = treeInfo?.hats?.find((hat) => hat.levelAtLocalTree === 0);
      if (!topHat?.details) return;
      try {
        const url = ipfs2https(topHat.details);
        if (!url) return;
        const { data } = await axios.get<HatsDetailSchama>(url);
        if (!cancelled) setWorkspaceName(data.data.name);
      } catch (error) {
        console.error("Failed to fetch workspace name:", error);
      }
    };
    fetchName();
    return () => {
      cancelled = true;
    };
  }, [treeInfo]);

  const workspaceImageUrl = useMemo(() => {
    const topHat = treeInfo?.hats?.find((hat) => hat.levelAtLocalTree === 0);
    return ipfs2https(topHat?.imageUri);
  }, [treeInfo]);

  // Per-page handle merged from the deepest match downwards. Later matches
  // (deeper routes) win on conflicting fields.
  const handle = useMemo<AppShellHandle>(() => {
    const merged: AppShellHandle = {};
    for (const match of matches) {
      const h = match.handle as AppShellHandle | undefined;
      if (!h) continue;
      Object.assign(merged, h);
    }
    return merged;
  }, [matches]);

  const active = handle.active ?? deriveActiveKey(location.pathname);

  const handleNavigate = (key: string) => {
    switch (key) {
      case "home":
        navigate(`/${treeId}`);
        break;
      case "duties":
        navigate(`/${treeId}/role`);
        break;
      case "splits":
        navigate(`/${treeId}/splits`);
        break;
      case "members":
        navigate(`/${treeId}/member`);
        break;
      case "wallet":
        navigate(`/${treeId}/thankstoken/history`);
        break;
      default:
        navigate(`/${treeId}`);
    }
  };

  const displayWorkspaceName = workspaceName ?? "Toban";

  return (
    <>
      <AppShell
        workspace={{
          name: displayWorkspaceName,
          imageUrl: workspaceImageUrl,
        }}
        active={active}
        onNavigate={handleNavigate}
        onWorkspacePress={() => setSwitcherOpen(true)}
        appHeaderRight={<AccountMenu variant="compact" />}
      >
        <Outlet />
      </AppShell>
      <WorkspaceSwitcherMenu
        open={switcherOpen}
        onOpenChange={setSwitcherOpen}
        workspaceName={displayWorkspaceName}
        onSwitchWorkspace={() => navigate("/workspace")}
        onOpenSettings={() => navigate(`/${treeId}/settings`)}
      />
    </>
  );
}

// AppShellLayout — root.tsx delegates to this wrapper. It inspects the
// current pathname; routes that don't match `/{treeId}/...` render their
// `<Outlet />` directly (login / signup / `/` / transaction / workspace).
function AppShellLayout() {
  const location = useLocation();
  const params = useParams();
  const { active, treeId: derivedTreeId } = isShellRoute(location.pathname);
  // Prefer the URL parameter when available; falling back to the path-derived
  // value keeps things working for routes that don't declare `treeId` (none
  // currently, but harmless defensiveness).
  const treeId = params.treeId ?? derivedTreeId;

  if (!active || !treeId) {
    return <Outlet />;
  }

  return <ShellView treeId={treeId} />;
}

export { AppShellLayout };
export type { AppShellHandle };
