import type { Hat, Tree } from "@hatsprotocol/sdk-v1-subgraph";
import { usePrivy } from "@privy-io/react-auth";
import {
  useQueryClient,
  useQuery as useTanstackQuery,
} from "@tanstack/react-query";
// EIP-712 McpTokenIssueRequest/McpTokenRevokeRequest/McpTokenListRequest
// boundary contract — imported from `@toban/mcp` (mirrors
// `@toban/identity/eip712`, see connect.discord.tsx) rather than redeclared
// here so the frontend and the MCP Worker can never silently desync on
// field order / domain version.
import {
  MCP_TOKEN_DOMAIN_NAME,
  MCP_TOKEN_DOMAIN_VERSION,
  MCP_TOKEN_ISSUE_PRIMARY_TYPE,
  MCP_TOKEN_ISSUE_TYPES,
  MCP_TOKEN_LIST_PRIMARY_TYPE,
  MCP_TOKEN_LIST_TYPES,
  MCP_TOKEN_REVOKE_PRIMARY_TYPE,
  MCP_TOKEN_REVOKE_TYPES,
} from "@toban/mcp/eip712";
import axios from "axios";
import dayjs from "dayjs";
import { hatsContractBaseConfig } from "hooks/useContracts";
import { useAddressesByNames, useNamesByAddresses } from "hooks/useENS";
import { treeInfoQueryKey, useHats, useTreeInfo } from "hooks/useHats";
import {
  useUploadHatsDetailsToIpfs,
  useUploadImageFileToIpfs,
} from "hooks/useIpfs";
import { currentChain, publicClient } from "hooks/useViem";
import type { WalletType } from "hooks/useWallet";
import { useActiveWallet } from "hooks/useWallet";
import { useGetWorkspace } from "hooks/useWorkspace";
import { type FC, useCallback, useEffect, useMemo, useState } from "react";
import { LuCheck } from "react-icons/lu";
import { SiDiscord } from "react-icons/si";
import { useNavigate, useParams } from "react-router";
import { toast } from "sonner";
import type { NameData } from "types/ens";
import type { HatsDetailSchama } from "types/hats";
import { ipfs2https } from "utils/ipfs";
import { abbreviateAddress, isValidEthAddress } from "utils/wallet";
import { type Address, type Hex, bytesToHex } from "viem";
import { Divider } from "~/components/composite/divider";
import { FieldLabel } from "~/components/composite/field-label";
import { Row } from "~/components/composite/row";
import { SectionLabel } from "~/components/composite/section-label";
import { ScreenHeader } from "~/components/layout/ScreenHeader";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import { Icon } from "~/components/ui/icon";
import { Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea";
import { Typography } from "~/components/ui/typography";
import { withBigIntJSON } from "~/lib/bigint-json";
import {
  type McpTokenListAuth,
  type McpTokenListItem,
  buildMcpTokenListTypedData,
  fetchMcpTokenList,
  isListAuthUsable,
} from "~/lib/mcp-tokens";

interface BasicInfoSectionProps {
  wallet: WalletType;
  treeId: string;
  topHat: Hat | undefined;
}

const BasicInfoSection: FC<BasicInfoSectionProps> = ({
  wallet,
  treeId,
  topHat,
}) => {
  const queryClient = useQueryClient();
  const { uploadImageFileToIpfs, imageFile, setImageFile } =
    useUploadImageFileToIpfs();
  const { uploadHatsDetailsToIpfs } = useUploadHatsDetailsToIpfs();
  const { changeHatDetails, changeHatImageURI } = useHats();

  const [workspaceImgUrl, setWorkspaceImgUrl] = useState<string | undefined>();
  const [workspaceName, setWorkspaceName] = useState("");
  const [workspaceDescription, setWorkspaceDescription] = useState("");
  const [currentDetails, setCurrentDetails] = useState<
    HatsDetailSchama | undefined
  >();
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!topHat?.imageUri) return;
    const url = ipfs2https(topHat.imageUri);
    setWorkspaceImgUrl(url ?? undefined);
  }, [topHat]);

  useEffect(() => {
    const load = async () => {
      if (!topHat?.details) return;
      const url = ipfs2https(topHat.details);
      if (!url) return;
      const { data } = await axios.get<HatsDetailSchama>(url);
      setCurrentDetails(data);
      setWorkspaceName(data.data.name ?? "");
      setWorkspaceDescription(data.data.description ?? "");
    };
    load();
  }, [topHat]);

  const handleUploadImg = (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("画像ファイルを選択してください");
      return;
    }
    setImageFile(file);
    setWorkspaceImgUrl(URL.createObjectURL(file));
  };

  const isChangedDetails = useMemo(
    () =>
      workspaceName !== (currentDetails?.data.name ?? "") ||
      workspaceDescription !== (currentDetails?.data.description ?? ""),
    [workspaceName, workspaceDescription, currentDetails],
  );

  const hasChanges = isChangedDetails || Boolean(imageFile);
  const canSave =
    Boolean(wallet) &&
    Boolean(topHat) &&
    workspaceName.trim().length > 0 &&
    hasChanges;

  const performSave = useCallback(async () => {
    if (!wallet || !topHat) return;
    setIsSaving(true);
    try {
      const detailsTask = isChangedDetails
        ? (async () => {
            const uploaded = await uploadHatsDetailsToIpfs({
              name: workspaceName,
              description: workspaceDescription,
              responsabilities: currentDetails?.data.responsabilities,
              authorities: currentDetails?.data.authorities,
            });
            if (!uploaded) throw new Error("メタデータの保存に失敗しました");
            const parsed = await changeHatDetails({
              hatId: BigInt(topHat.id),
              newDetails: uploaded.ipfsUri,
            });
            if (!parsed) throw new Error("詳細の更新に失敗しました");
            return uploaded.ipfsUri;
          })()
        : Promise.resolve<string | undefined>(undefined);

      const imageTask = imageFile
        ? (async () => {
            const uploaded = await uploadImageFileToIpfs();
            if (!uploaded) throw new Error("画像のアップロードに失敗しました");
            const parsed = await changeHatImageURI({
              hatId: BigInt(topHat.id),
              newImageURI: uploaded.ipfsUri,
            });
            if (!parsed) throw new Error("画像の更新に失敗しました");
            return uploaded.ipfsUri;
          })()
        : Promise.resolve<string | undefined>(undefined);

      const [nextDetailsUri, nextImageUri] = await Promise.all([
        detailsTask,
        imageTask,
      ]);

      toast.success("ワークスペースの設定を保存しました");
      setCurrentDetails((prev) =>
        prev
          ? {
              ...prev,
              data: {
                ...prev.data,
                name: workspaceName,
                description: workspaceDescription,
              },
            }
          : prev,
      );
      setImageFile(null);

      // Optimistic cache patch — point the top hat at the freshly-uploaded
      // IPFS URIs so the AppShell pill picks up the new name / image without
      // waiting for the Hats subgraph to index the change.
      queryClient.setQueryData<Tree | null>(
        treeInfoQueryKey(Number(treeId)),
        (prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            hats: prev.hats?.map((hat) =>
              hat.levelAtLocalTree === 0
                ? {
                    ...hat,
                    ...(nextDetailsUri ? { details: nextDetailsUri } : {}),
                    ...(nextImageUri ? { imageUri: nextImageUri } : {}),
                  }
                : hat,
            ),
          };
        },
      );
    } catch (error) {
      console.error(error);
      toast.error("設定の保存に失敗しました");
    } finally {
      setIsSaving(false);
    }
  }, [
    wallet,
    treeId,
    topHat,
    isChangedDetails,
    imageFile,
    workspaceName,
    workspaceDescription,
    currentDetails,
    uploadHatsDetailsToIpfs,
    uploadImageFileToIpfs,
    changeHatDetails,
    changeHatImageURI,
    setImageFile,
    queryClient,
  ]);

  return (
    <>
      <SectionLabel>基本情報</SectionLabel>
      <div className="px-5">
        <Card className="gap-4 py-4">
          <div className="flex items-center gap-4 px-4">
            <Avatar size="lg" className="rounded-md">
              {workspaceImgUrl && (
                <AvatarImage src={workspaceImgUrl} alt={workspaceName} />
              )}
              <AvatarFallback
                seed={workspaceName || "Toban"}
                className="rounded-md"
              />
            </Avatar>
            <div>
              <Button variant="secondary" size="sm" asChild>
                <label className="cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleUploadImg(e.target.files?.[0])}
                  />
                  画像をアップロード
                </label>
              </Button>
            </div>
          </div>

          <div className="px-4">
            <FieldLabel htmlFor="ws-settings-name">
              ワークスペース名 <span className="text-danger">*</span>
            </FieldLabel>
            <Input
              id="ws-settings-name"
              value={workspaceName}
              onChange={(e) => setWorkspaceName(e.target.value)}
              placeholder="例：kuu village #1"
            />
          </div>

          <div className="px-4">
            <FieldLabel htmlFor="ws-settings-desc">説明</FieldLabel>
            <Textarea
              id="ws-settings-desc"
              rows={3}
              value={workspaceDescription}
              onChange={(e) => setWorkspaceDescription(e.target.value)}
              placeholder="どんなコミュニティかを入力"
            />
          </div>
        </Card>
      </div>

      <div className="px-5 pt-4">
        <Button
          variant="primary"
          full
          size="lg"
          disabled={!canSave || isSaving}
          onClick={performSave}
        >
          <LuCheck size={18} />
          {isSaving ? "保存中..." : "保存"}
        </Button>
      </div>
    </>
  );
};

interface OtherSectionProps {
  treeId: string;
}

const OtherSection: FC<OtherSectionProps> = ({ treeId }) => {
  const handleInvite = async () => {
    const link =
      typeof window !== "undefined"
        ? `${window.location.origin}/${treeId}`
        : "";
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(link);
        toast.success("招待リンクをコピーしました");
      } else {
        toast.error("クリップボードを利用できません");
      }
    } catch (error) {
      console.error("Failed to copy invite link:", error);
      toast.error("招待リンクのコピーに失敗しました");
    }
  };

  const handleCopyId = async () => {
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(treeId);
        toast.success("ワークスペース ID をコピーしました");
      } else {
        toast.error("クリップボードを利用できません");
      }
    } catch (error) {
      console.error("Failed to copy workspace id:", error);
      toast.error("ワークスペース ID のコピーに失敗しました");
    }
  };

  return (
    <>
      <SectionLabel>その他</SectionLabel>
      <div className="px-4">
        <Card className="gap-0 p-0">
          <Row
            left={
              <span className="flex size-9 items-center justify-center rounded-full bg-[#F0EBE0]">
                <Icon name="invite" size={18} />
              </span>
            }
            title="メンバーを招待"
            subtitle="招待リンクをコピー"
            right={
              <Icon
                name="chevron-right"
                size={16}
                className="text-text-secondary"
              />
            }
            onClick={handleInvite}
          />
          <Divider inset={64} />
          <Row
            left={
              <span className="flex size-9 items-center justify-center rounded-full bg-[#F0EBE0]">
                <Icon name="copy" size={18} />
              </span>
            }
            title="ワークスペース ID をコピー"
            subtitle={treeId}
            right={
              <Icon
                name="chevron-right"
                size={16}
                className="text-text-secondary"
              />
            }
            onClick={handleCopyId}
          />
        </Card>
      </div>
    </>
  );
};

interface ExternalIntegrationSectionProps {
  treeId: string;
}

// Workspace-level external-service links. The Discord bot page needs only the
// treeId (already in scope here), so it can be opened directly — no token /
// query param to prompt for. The personal wallet↔account binding
// (/connect/discord) lives on the member's own profile instead, since it needs
// a per-user verifier_token this admin surface can't supply.
const ExternalIntegrationSection: FC<ExternalIntegrationSectionProps> = ({
  treeId,
}) => {
  const navigate = useNavigate();
  return (
    <>
      <SectionLabel>外部サービス連携</SectionLabel>
      <div className="px-4">
        <Card className="gap-0 p-0">
          <Row
            left={
              <span className="flex size-9 items-center justify-center rounded-full bg-[#F0EBE0]">
                <SiDiscord size={18} className="text-[#5865F2]" />
              </span>
            }
            title="Discord bot 連携"
            subtitle="/thx の mint 許可・Quest 代理申請を設定"
            right={
              <Icon
                name="chevron-right"
                size={16}
                className="text-text-secondary"
              />
            }
            onClick={() => navigate(`/${treeId}/discord-bot`)}
          />
        </Card>
      </div>
    </>
  );
};

type IssuedMcpToken = {
  token: string;
  tokenId: string;
  treeId: string;
  label: string;
  createdAt: number;
};

const mcpTokensQueryKey = (treeId: string) => ["mcp-tokens", treeId] as const;

// How long a `McpTokenListRequest` signature stays reusable before the
// section asks for a fresh one. Listing never burns its nonce (see
// `pkgs/extensions/mcp/src/handlers/list.ts`), which is exactly what makes
// reuse safe — the design constraint here is "don't ask for a wallet popup
// just to open the settings page", so one signature should cover a whole
// admin session rather than every render. 30 minutes balances that against
// not holding a signature indefinitely if the tab is left open.
const LIST_AUTH_TTL_SECONDS = 60 * 30;

// Shared EIP-712 domain for McpTokenIssueRequest, McpTokenListRequest, and
// McpTokenRevokeRequest — same construction as `@toban/identity/eip712`'s
// IdentityBinding domain, under the `@toban/mcp` boundary contract
// (docs/mcp-extraction.md §5, `pkgs/extensions/mcp/src/eip712/mcp-token.ts`).
// No `verifyingContract`: like IdentityBinding this is an off-chain
// attestation the Worker recovers a signer from, not something a contract
// checks.
function mcpTokenDomain() {
  return {
    name: MCP_TOKEN_DOMAIN_NAME,
    version: MCP_TOKEN_DOMAIN_VERSION,
    chainId: currentChain.id,
  } as const;
}

function randomNonce(): Hex {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return bytesToHex(bytes);
}

// `mcp_tokens.created_at` / `revoked_at` are D1 integer columns (epoch
// seconds), same convention as the subgraph's `blockTimestamp` fields
// elsewhere on this page — hence the `* 1000` before handing to dayjs.
function formatMcpDate(epochSeconds: number): string {
  return dayjs(epochSeconds * 1000).format("YYYY/MM/DD HH:mm");
}

interface McpTokenSectionProps {
  wallet: WalletType;
  treeId: string;
}

// Lets a workspace admin self-issue an MCP token for an AI agent (OpenClaw,
// etc.) without operator involvement — see docs/mcp-extraction.md §5. The
// signature scheme mirrors connect.discord.tsx: sign an EIP-712 message with
// the Privy wallet, POST { message, signature } to the MCP Worker, which
// recovers the signer and re-derives admin status itself. `isAdmin` below is
// UX-only — hiding the section for members who could never issue a token —
// and carries no authority; skipping it client-side would still fail against
// the Worker's own Hats-subgraph check.
//
// The token list is fetched by `POST /api/mcp-tokens/list` with a signed
// `McpTokenListRequest` (`~/lib/mcp-tokens`), never by an unsigned GET — the
// Worker never implemented a GET route for this (review finding: the old
// code called one anyway and the list/revoke UI was dead as a result).
// Fetching it is gated behind an explicit action (`handleRevealList`, the
// "署名して一覧を表示" button below) rather than firing on mount: a wallet
// popup must not appear just because someone opened the settings page. The
// resulting signature (`listAuth`) is cached in state and reused for
// `LIST_AUTH_TTL_SECONDS` — safe because listing never burns its EIP-712
// nonce (see the Worker-side handler's doc comment) — so revoking a token,
// or issuing another one, doesn't ask for a fresh wallet popup every time.
const McpTokenSection: FC<McpTokenSectionProps> = ({ wallet, treeId }) => {
  const { ready, authenticated, login } = usePrivy();
  const walletAddress = wallet?.account.address as Address | undefined;

  const mcpWorkerUrl = import.meta.env.VITE_MCP_WORKER_URL as
    | string
    | undefined;

  const { data: workspaceData } = useGetWorkspace({ workspaceId: treeId });
  const owner = workspaceData?.workspace?.owner ?? undefined;
  const operatorHatId = workspaceData?.workspace?.operatorHatId ?? undefined;

  // Same admin check as the Discord bot page's admin gate (owner or
  // operatorHat wearer) — the design doc names this exact pair as what the
  // Worker verifies against the Hats subgraph before issuing a token.
  const adminQuery = useTanstackQuery({
    queryKey: ["workspace-admin-mcp", walletAddress, owner, operatorHatId],
    enabled: !!walletAddress && (!!owner || !!operatorHatId),
    queryFn: async (): Promise<boolean> => {
      if (!walletAddress) return false;
      if (owner && walletAddress.toLowerCase() === owner.toLowerCase()) {
        return true;
      }
      if (!operatorHatId) return false;
      return (await publicClient.readContract({
        ...hatsContractBaseConfig,
        functionName: "isWearerOfHat",
        args: [walletAddress, BigInt(operatorHatId)],
      })) as boolean;
    },
  });
  const isAdmin = adminQuery.data === true;
  const queryClient = useQueryClient();

  const [label, setLabel] = useState("");
  const [issuing, setIssuing] = useState(false);
  const [justIssued, setJustIssued] = useState<IssuedMcpToken | null>(null);
  const [copied, setCopied] = useState(false);
  const [revokingId, setRevokingId] = useState<string | null>(null);

  // Signed lazily — never on page load (design constraint from
  // docs/mcp-extraction.md §5's review: a wallet popup must not appear just
  // because someone opened the settings page). `handleRevealList` is the
  // only thing that creates one, other than the "refresh after issuing"
  // path below, which reuses a signature the admin already just produced
  // for the issue call rather than asking again.
  const [listAuth, setListAuth] = useState<McpTokenListAuth | null>(null);
  const [listAuthLoading, setListAuthLoading] = useState(false);

  const signListAuth =
    useCallback(async (): Promise<McpTokenListAuth | null> => {
      if (!wallet || !walletAddress) return null;
      const nonce = randomNonce();
      const typedData = buildMcpTokenListTypedData({
        wallet: walletAddress,
        treeId,
        chainId: currentChain.id,
        nonce,
        ttlSeconds: LIST_AUTH_TTL_SECONDS,
      });
      const signature = (await withBigIntJSON(() =>
        wallet.signTypedData({
          account: walletAddress,
          domain: typedData.domain,
          types: typedData.types,
          primaryType: typedData.primaryType,
          message: typedData.message,
        }),
      )) as Hex;
      return { typedData, signature };
    }, [wallet, walletAddress, treeId]);

  const handleRevealList = async () => {
    setListAuthLoading(true);
    try {
      const auth = await signListAuth();
      if (auth) setListAuth(auth);
    } catch (e) {
      console.error(e);
      const message = e instanceof Error ? e.message : "unknown error";
      toast.error(`署名に失敗しました: ${message}`);
    } finally {
      setListAuthLoading(false);
    }
  };

  const tokensQuery = useTanstackQuery({
    queryKey: mcpTokensQueryKey(treeId),
    enabled: !!mcpWorkerUrl && isAdmin && isListAuthUsable(listAuth),
    queryFn: async (): Promise<McpTokenListItem[]> => {
      if (!mcpWorkerUrl || !isListAuthUsable(listAuth)) return [];
      return fetchMcpTokenList(mcpWorkerUrl, listAuth);
    },
  });

  const handleIssue = async () => {
    if (!wallet || !walletAddress || !mcpWorkerUrl) return;
    const trimmedLabel = label.trim();
    if (!trimmedLabel) return;
    setIssuing(true);
    try {
      // Short expiry — this signature only authenticates the one issue
      // request (replay/nonce protection), unlike the token it produces,
      // which lives until revoked.
      const expires = BigInt(Math.floor(Date.now() / 1000) + 10 * 60);
      const nonce = randomNonce();
      const domain = mcpTokenDomain();
      const message = {
        wallet: walletAddress,
        treeId,
        label: trimmedLabel,
        expires,
        nonce,
      };
      const signature = (await withBigIntJSON(() =>
        wallet.signTypedData({
          account: walletAddress,
          domain,
          types: MCP_TOKEN_ISSUE_TYPES,
          primaryType: MCP_TOKEN_ISSUE_PRIMARY_TYPE,
          message,
        }),
      )) as Hex;

      const res = await fetch(
        `${mcpWorkerUrl.replace(/\/$/, "")}/api/mcp-tokens`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            typedData: {
              domain,
              types: MCP_TOKEN_ISSUE_TYPES,
              primaryType: MCP_TOKEN_ISSUE_PRIMARY_TYPE,
              // uint256 as decimal string — JSON can't carry bigint; the
              // Worker normalises via BigInt() the same way /api/connect
              // does (see connect.discord.tsx).
              message: { ...message, expires: expires.toString() },
            },
            signature,
          }),
        },
      );

      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as {
          error?: string;
        };
        toast.error(
          body.error
            ? `発行に失敗しました: ${body.error}`
            : `発行に失敗しました (${res.status})`,
        );
        return;
      }

      const issued = (await res.json()) as IssuedMcpToken;
      setJustIssued(issued);
      setCopied(false);
      setLabel("");

      // Refresh the list right after issuing. This does not violate "never
      // sign on page load": the admin just approved a wallet popup for the
      // issue call above, so this is still inside that same user-initiated
      // action, not a background/mount-triggered signature. Reuse an
      // existing usable signature if we have one (e.g. the admin already
      // revealed the list earlier in this session) instead of asking again.
      try {
        const auth = isListAuthUsable(listAuth)
          ? listAuth
          : await signListAuth();
        if (auth && mcpWorkerUrl) {
          if (auth !== listAuth) setListAuth(auth);
          const tokens = await fetchMcpTokenList(mcpWorkerUrl, auth);
          queryClient.setQueryData(mcpTokensQueryKey(treeId), tokens);
        }
      } catch (e) {
        // The token itself was already issued successfully above — a
        // failure here must not read as "issuing failed" to the admin, so
        // it's logged rather than surfaced as an error toast. Worst case,
        // the list stays showing the pre-issue state (or the reveal
        // button, if it was never shown) until the admin refreshes it.
        console.error("Failed to refresh MCP token list after issuing:", e);
      }

      toast.success("MCP トークンを発行しました");
    } catch (e) {
      console.error(e);
      const message = e instanceof Error ? e.message : "unknown error";
      toast.error(`署名に失敗しました: ${message}`);
    } finally {
      setIssuing(false);
    }
  };

  const handleCopyToken = async () => {
    if (!justIssued) return;
    try {
      if (typeof navigator === "undefined" || !navigator.clipboard?.writeText) {
        toast.error("クリップボードを利用できません");
        return;
      }
      await navigator.clipboard.writeText(justIssued.token);
      setCopied(true);
      toast.success("トークンをコピーしました");
    } catch (error) {
      console.error("Failed to copy MCP token:", error);
      toast.error("クリップボードを利用できません");
    }
  };

  const handleRevoke = async (tokenId: string) => {
    if (!wallet || !walletAddress || !mcpWorkerUrl) return;
    setRevokingId(tokenId);
    try {
      const expires = BigInt(Math.floor(Date.now() / 1000) + 10 * 60);
      const nonce = randomNonce();
      const domain = mcpTokenDomain();
      // `McpTokenRevokeRequest` names the specific `tokenId` being revoked
      // inside the signed message itself (see the boundary contract's doc
      // comment for why this field was moved here from a bare, unsigned
      // request-body field: a signature that doesn't commit to *what* it
      // authorises revoking can be replayed against any tokenId). The
      // Worker still separately checks that the named token actually
      // belongs to `treeId` before honouring the revoke.
      const message = {
        wallet: walletAddress,
        treeId,
        tokenId,
        expires,
        nonce,
      };
      const signature = (await withBigIntJSON(() =>
        wallet.signTypedData({
          account: walletAddress,
          domain,
          types: MCP_TOKEN_REVOKE_TYPES,
          primaryType: MCP_TOKEN_REVOKE_PRIMARY_TYPE,
          message,
        }),
      )) as Hex;

      const res = await fetch(
        `${mcpWorkerUrl.replace(/\/$/, "")}/api/mcp-tokens/revoke`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            typedData: {
              domain,
              types: MCP_TOKEN_REVOKE_TYPES,
              primaryType: MCP_TOKEN_REVOKE_PRIMARY_TYPE,
              message: { ...message, expires: expires.toString() },
            },
            signature,
          }),
        },
      );

      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as {
          error?: string;
        };
        toast.error(
          body.error
            ? `失効に失敗しました: ${body.error}`
            : `失効に失敗しました (${res.status})`,
        );
        return;
      }

      await tokensQuery.refetch();
      toast.success("トークンを失効しました");
    } catch (e) {
      console.error(e);
      const message = e instanceof Error ? e.message : "unknown error";
      toast.error(`署名に失敗しました: ${message}`);
    } finally {
      setRevokingId(null);
    }
  };

  // UX-only gate (see the block comment above the component) — non-admins
  // simply don't see the section rather than seeing a disabled one.
  if (!isAdmin) return null;

  return (
    <>
      <SectionLabel>MCP トークン</SectionLabel>
      <div className="space-y-4 px-5">
        <Typography as="div" variant="bodySm" tone="secondary">
          AI エージェント（OpenClaw
          など）にこのワークスペースへの読み取りアクセスと、
          確認ボタン付きの提案投稿を許可するための鍵です。
          <strong>パスワードと同じ扱いにしてください</strong>
          。発行直後の一度しか平文は表示されません。
        </Typography>

        {!mcpWorkerUrl ? (
          <Typography variant="caption" tone="danger">
            VITE_MCP_WORKER_URL が未設定のため、MCP
            トークン機能を利用できません。
          </Typography>
        ) : !ready ? (
          <Button full disabled>
            読み込み中…
          </Button>
        ) : !authenticated || !walletAddress ? (
          <Button full onClick={login}>
            <Icon name="wallet" size={18} />
            ウォレットを接続
          </Button>
        ) : (
          <>
            <Card className="gap-4 py-4">
              <div className="flex flex-col gap-2 px-4">
                <FieldLabel htmlFor="mcp-token-label">ラベル</FieldLabel>
                <div className="flex gap-2">
                  <Input
                    id="mcp-token-label"
                    placeholder="例：うちの OpenClaw"
                    value={label}
                    onChange={(e) => setLabel(e.target.value)}
                  />
                  <Button
                    disabled={!label.trim() || issuing}
                    onClick={handleIssue}
                  >
                    {issuing ? "署名中…" : "発行"}
                  </Button>
                </div>
              </div>
            </Card>

            {justIssued && (
              <Card className="gap-3 border-danger/40 py-4">
                <div className="flex flex-col gap-2 px-4">
                  <Typography variant="bodySm" weight="bold" tone="danger">
                    この画面を離れると二度と表示できません。今すぐコピーしてください。
                  </Typography>
                  <div className="flex items-center gap-2 rounded-md border bg-muted/30 p-3">
                    <Typography
                      as="span"
                      variant="mono"
                      className="flex-1 break-all"
                    >
                      {justIssued.token}
                    </Typography>
                    <Button
                      variant="secondary"
                      size="icon-sm"
                      onClick={handleCopyToken}
                    >
                      <Icon name={copied ? "check" : "copy"} size={16} />
                    </Button>
                  </div>
                </div>
              </Card>
            )}

            <Card className="gap-0 p-0">
              {!isListAuthUsable(listAuth) ? (
                <div className="flex flex-col items-center gap-2 px-4 py-6">
                  <Typography variant="caption" tone="secondary">
                    発行済みトークンの一覧を見るには署名してください。
                  </Typography>
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={listAuthLoading}
                    onClick={() => void handleRevealList()}
                  >
                    {listAuthLoading ? "署名中…" : "署名して一覧を表示"}
                  </Button>
                </div>
              ) : tokensQuery.isLoading ? (
                <Typography
                  as="div"
                  variant="caption"
                  tone="secondary"
                  className="px-4 py-3"
                >
                  読み込み中…
                </Typography>
              ) : (tokensQuery.data?.length ?? 0) === 0 ? (
                <Typography
                  as="div"
                  variant="caption"
                  tone="secondary"
                  className="px-4 py-3"
                >
                  発行済みのトークンはありません
                </Typography>
              ) : (
                tokensQuery.data?.map((t, i) => (
                  <div key={t.tokenId}>
                    {i > 0 && <Divider />}
                    <Row
                      title={t.label}
                      subtitle={`発行日: ${formatMcpDate(t.createdAt)} / 発行者: ${abbreviateAddress(t.createdBy)}`}
                      right={
                        t.revokedAt ? (
                          <Badge kind="danger">失効済み</Badge>
                        ) : (
                          <Button
                            variant="danger"
                            size="sm"
                            disabled={revokingId === t.tokenId}
                            onClick={() => handleRevoke(t.tokenId)}
                          >
                            {revokingId === t.tokenId ? "失効中…" : "失効"}
                          </Button>
                        )
                      }
                    />
                  </div>
                ))
              )}
            </Card>
          </>
        )}
      </div>
    </>
  );
};

const authorityWearersQueryKey = (hatId: string | undefined) =>
  ["authorityWearers", hatId ?? null] as const;

interface AuthorityListProps {
  headingText: string;
  /** The authority hat — wearing it (or being its admin) grants the gated
   *  permission on the corresponding Toban module. */
  authorityHatId: string | undefined;
  /** Current wallet address — drives the per-row revoke affordance: own row
   *  renounces, others' rows are only revocable by the workspace admin. */
  currentUserAddress: string | undefined;
  /** Top-hat wearer. Admins can revoke other wearers via `transferHat` since
   *  Hats Protocol's `setHatWearerStatus` is gated to the eligibility module
   *  only (which Toban leaves as the constant "always eligible" sentinel). */
  adminAddress: string | undefined;
}

const AuthorityList: FC<AuthorityListProps> = ({
  headingText,
  authorityHatId,
  currentUserAddress,
  adminAddress,
}) => {
  const queryClient = useQueryClient();
  const { getWearersInfo, mintHat, renounceHat, adminRevokeAuthorityHat } =
    useHats();
  const { fetchNames } = useNamesByAddresses();
  const { fetchAddresses } = useAddressesByNames(undefined, true);

  const [newAuthority, setNewAuthority] = useState("");
  const [resolved, setResolved] = useState<string | undefined>();
  const [pendingAddress, setPendingAddress] = useState<string | undefined>();
  const [mutationKind, setMutationKind] = useState<
    "add" | "remove" | undefined
  >();

  const { data: accounts = [] } = useTanstackQuery({
    queryKey: authorityWearersQueryKey(authorityHatId),
    enabled: Boolean(authorityHatId),
    queryFn: async () => {
      if (!authorityHatId) return [] as NameData[][];
      const wearers = await getWearersInfo({ hatId: authorityHatId });
      const addrs = wearers?.map((w) => w.id) ?? [];
      if (addrs.length === 0) return [] as NameData[][];
      const named = await fetchNames(addrs);
      return (named ?? []) as NameData[][];
    },
  });

  useEffect(() => {
    let cancelled = false;
    const resolve = async () => {
      if (!newAuthority) {
        setResolved(undefined);
        return;
      }
      if (isValidEthAddress(newAuthority)) {
        if (!cancelled) setResolved(newAuthority);
        return;
      }
      const matches = await fetchAddresses([newAuthority]);
      if (!cancelled) setResolved(matches?.[0]?.[0]?.address);
    };
    resolve();
    return () => {
      cancelled = true;
    };
  }, [newAuthority, fetchAddresses]);

  const handleAdd = useCallback(async () => {
    if (!authorityHatId || !resolved) return;
    setPendingAddress(resolved);
    setMutationKind("add");
    try {
      await mintHat({
        hatId: BigInt(authorityHatId),
        wearer: resolved as Address,
      });
      // Resolve name for the new wearer so the optimistic row matches the
      // shape the queryFn returns. fetchNames is cached upstream so this is
      // cheap on the second call.
      const named = (await fetchNames([resolved])) as
        | NameData[][]
        | null
        | undefined;
      const newEntry: NameData[] = named?.[0]?.length
        ? named[0]
        : [
            {
              address: resolved,
              name: "",
              domain: "",
              text_records: {},
            } as NameData,
          ];
      queryClient.setQueryData<NameData[][]>(
        authorityWearersQueryKey(authorityHatId),
        (prev) => {
          const filtered = (prev ?? []).filter(
            (arr) =>
              (arr?.[0]?.address ?? "").toLowerCase() !==
              resolved.toLowerCase(),
          );
          return [newEntry, ...filtered];
        },
      );
      toast.success("権限を付与しました");
      setNewAuthority("");
      setResolved(undefined);
    } catch (error) {
      console.error(error);
      toast.error("権限の付与に失敗しました");
    } finally {
      setPendingAddress(undefined);
      setMutationKind(undefined);
    }
  }, [authorityHatId, resolved, mintHat, fetchNames, queryClient]);

  const handleRemove = useCallback(
    async (address: string, kind: "renounce" | "transfer") => {
      if (!authorityHatId) return;
      setPendingAddress(address);
      setMutationKind("remove");
      try {
        if (kind === "renounce") {
          await renounceHat(BigInt(authorityHatId));
        } else {
          if (!adminAddress) throw new Error("admin address unknown");
          await adminRevokeAuthorityHat({
            hatId: BigInt(authorityHatId),
            from: address as Address,
            admin: adminAddress as Address,
          });
        }
        queryClient.setQueryData<NameData[][]>(
          authorityWearersQueryKey(authorityHatId),
          (prev) =>
            (prev ?? []).filter(
              (arr) =>
                (arr?.[0]?.address ?? "").toLowerCase() !==
                address.toLowerCase(),
            ),
        );
        toast.success(
          kind === "renounce" ? "権限を返上しました" : "権限を剥奪しました",
        );
      } catch (error) {
        console.error(error);
        toast.error(
          kind === "renounce"
            ? "権限の返上に失敗しました"
            : "権限の剥奪に失敗しました",
        );
      } finally {
        setPendingAddress(undefined);
        setMutationKind(undefined);
      }
    },
    [
      authorityHatId,
      adminAddress,
      renounceHat,
      adminRevokeAuthorityHat,
      queryClient,
    ],
  );

  return (
    <div className="space-y-2">
      <Typography as="div" variant="bodySm" weight="semibold">
        {headingText}
      </Typography>
      <Card className="gap-0 p-0">
        {accounts.map((arr) => {
          const account = arr?.[0];
          if (!account) return null;
          const isSelf =
            currentUserAddress?.toLowerCase() === account.address.toLowerCase();
          const callerIsAdmin =
            !!adminAddress &&
            currentUserAddress?.toLowerCase() === adminAddress.toLowerCase();
          const action: "renounce" | "transfer" | null = isSelf
            ? "renounce"
            : callerIsAdmin
              ? "transfer"
              : null;
          const isRemoving =
            mutationKind === "remove" && pendingAddress === account.address;
          return (
            <Row
              key={account.address}
              left={
                <Avatar size="sm">
                  {account.text_records?.avatar && (
                    <AvatarImage
                      src={ipfs2https(account.text_records.avatar)}
                      alt={account.name}
                    />
                  )}
                  <AvatarFallback seed={account.name || account.address} />
                </Avatar>
              }
              title={account.name || abbreviateAddress(account.address)}
              subtitle={abbreviateAddress(account.address)}
              right={
                action ? (
                  <Button
                    variant="danger"
                    size="sm"
                    disabled={isRemoving}
                    onClick={() => handleRemove(account.address, action)}
                  >
                    {isRemoving
                      ? action === "renounce"
                        ? "返上中..."
                        : "剥奪中..."
                      : action === "renounce"
                        ? "返上"
                        : "剥奪"}
                  </Button>
                ) : null
              }
            />
          );
        })}
        {accounts.length === 0 && (
          <Typography
            as="div"
            variant="caption"
            tone="secondary"
            className="px-4 py-3"
          >
            権限を持つメンバーはいません
          </Typography>
        )}
      </Card>
      <div className="flex gap-2.5">
        <div className="flex-1">
          <Input
            placeholder="ユーザー名 or ウォレットアドレス"
            value={newAuthority}
            onChange={(e) => setNewAuthority(e.target.value)}
          />
          <Typography
            as="div"
            variant="caption"
            tone="secondary"
            className="mt-1 min-h-4 text-right"
          >
            {resolved ? abbreviateAddress(resolved) : ""}
          </Typography>
        </div>
        <Button
          variant="primary"
          disabled={
            !authorityHatId ||
            !resolved ||
            (mutationKind === "add" && pendingAddress === resolved)
          }
          onClick={handleAdd}
        >
          {mutationKind === "add" && pendingAddress === resolved
            ? "追加中..."
            : "追加"}
        </Button>
      </div>
    </div>
  );
};

interface AuthoritiesSectionProps {
  wallet: WalletType;
  treeId: string;
  topHat: Hat | undefined;
}

const AuthoritiesSection: FC<AuthoritiesSectionProps> = ({
  wallet,
  treeId,
  topHat,
}) => {
  const { data } = useGetWorkspace({ workspaceId: treeId });
  const {
    transferHat,
    isLoading: isTransferLoading,
    isSuccess: isTransferSuccess,
    getWearersInfo,
  } = useHats();

  const [owner, setOwner] = useState<string | undefined>();
  const [newOwner, setNewOwner] = useState("");
  const [resolvedNewOwner, setResolvedNewOwner] = useState<
    string | undefined
  >();
  const { fetchAddresses } = useAddressesByNames(undefined, true);

  useEffect(() => {
    const fetchOwner = async () => {
      if (!topHat) return;
      const info = await getWearersInfo({ hatId: topHat.id });
      setOwner(info?.[0]?.id);
    };
    fetchOwner();
  }, [topHat, getWearersInfo]);

  useEffect(() => {
    if (isTransferSuccess && resolvedNewOwner) {
      setOwner(resolvedNewOwner);
      setNewOwner("");
      setResolvedNewOwner(undefined);
      toast.success("オーナーを変更しました");
    }
  }, [isTransferSuccess, resolvedNewOwner]);

  useEffect(() => {
    let cancelled = false;
    const resolve = async () => {
      if (!newOwner) {
        setResolvedNewOwner(undefined);
        return;
      }
      if (isValidEthAddress(newOwner)) {
        if (!cancelled) setResolvedNewOwner(newOwner);
        return;
      }
      const matches = await fetchAddresses([newOwner]);
      if (!cancelled) setResolvedNewOwner(matches?.[0]?.[0]?.address);
    };
    resolve();
    return () => {
      cancelled = true;
    };
  }, [newOwner, fetchAddresses]);

  return (
    <>
      <SectionLabel>権限</SectionLabel>
      <div className="space-y-5 px-5">
        <AuthorityList
          headingText="当番の新規作成"
          authorityHatId={data?.workspace?.creatorHatId ?? undefined}
          currentUserAddress={wallet?.account.address}
          adminAddress={owner}
        />
        <AuthorityList
          headingText="当番の割当・休止・剥奪"
          authorityHatId={data?.workspace?.minterHatId ?? undefined}
          currentUserAddress={wallet?.account.address}
          adminAddress={owner}
        />

        <div className="space-y-2">
          <Typography as="div" variant="bodySm" weight="semibold">
            オーナー（注意して変更してください）
          </Typography>
          {owner && (
            <Typography
              as="div"
              variant="caption"
              tone="secondary"
              className="break-all"
            >
              現在のオーナー: {owner}
            </Typography>
          )}
          <div className="flex gap-2.5">
            <div className="flex-1">
              <Input
                placeholder="ユーザー名 or ウォレットアドレス"
                value={newOwner}
                onChange={(e) => setNewOwner(e.target.value)}
              />
              <Typography
                as="div"
                variant="caption"
                tone="secondary"
                className="mt-1 min-h-4 text-right"
              >
                {resolvedNewOwner ? abbreviateAddress(resolvedNewOwner) : ""}
              </Typography>
            </div>
            <Button
              variant="danger"
              disabled={
                !wallet ||
                !topHat ||
                !resolvedNewOwner ||
                isTransferLoading ||
                resolvedNewOwner.toLowerCase() === owner?.toLowerCase()
              }
              onClick={() => {
                if (!wallet || !topHat || !resolvedNewOwner) return;
                transferHat({
                  hatId: BigInt(topHat.id),
                  from: wallet.account.address as Address,
                  to: resolvedNewOwner as Address,
                });
              }}
            >
              変更
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};

function pickTopHat(treeInfo: Tree | undefined): Hat | undefined {
  return treeInfo?.hats?.find((hat) => hat.levelAtLocalTree === 0);
}

const WorkspaceSettings: FC = () => {
  const navigate = useNavigate();
  const { wallet } = useActiveWallet();
  const { treeId } = useParams();
  const treeInfo = useTreeInfo(Number(treeId));
  const topHat = useMemo(() => pickTopHat(treeInfo), [treeInfo]);

  if (!treeId) return null;

  return (
    <div className="flex min-h-dvh flex-col bg-bg pb-10">
      <ScreenHeader
        title="ワークスペース設定"
        onBack={() => navigate(`/${treeId}`)}
      />
      <div className="flex flex-col gap-2">
        <BasicInfoSection wallet={wallet} treeId={treeId} topHat={topHat} />
        <OtherSection treeId={treeId} />
        <ExternalIntegrationSection treeId={treeId} />
        <McpTokenSection wallet={wallet} treeId={treeId} />
        <AuthoritiesSection wallet={wallet} treeId={treeId} topHat={topHat} />
      </div>
    </div>
  );
};

export default WorkspaceSettings;
