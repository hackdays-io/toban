import type { Hat, Tree } from "@hatsprotocol/sdk-v1-subgraph";
import {
  useQueryClient,
  useQuery as useTanstackQuery,
} from "@tanstack/react-query";
import axios from "axios";
import { useAddressesByNames, useNamesByAddresses } from "hooks/useENS";
import { treeInfoQueryKey, useHats, useTreeInfo } from "hooks/useHats";
import {
  useUploadHatsDetailsToIpfs,
  useUploadImageFileToIpfs,
} from "hooks/useIpfs";
import type { WalletType } from "hooks/useWallet";
import { useActiveWallet } from "hooks/useWallet";
import { useGetWorkspace } from "hooks/useWorkspace";
import type { NameData } from "namestone-sdk";
import { type FC, useCallback, useEffect, useMemo, useState } from "react";
import { LuCheck } from "react-icons/lu";
import { SiDiscord } from "react-icons/si";
import { useNavigate, useParams } from "react-router";
import { toast } from "sonner";
import type { HatsDetailSchama } from "types/hats";
import { ipfs2https } from "utils/ipfs";
import { abbreviateAddress, isValidEthAddress } from "utils/wallet";
import type { Address } from "viem";
import { Divider } from "~/components/composite/divider";
import { FieldLabel } from "~/components/composite/field-label";
import { Row } from "~/components/composite/row";
import { SectionLabel } from "~/components/composite/section-label";
import { ScreenHeader } from "~/components/layout/ScreenHeader";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import { Icon } from "~/components/ui/icon";
import { Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea";
import { Typography } from "~/components/ui/typography";

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
        <AuthoritiesSection wallet={wallet} treeId={treeId} topHat={topHat} />
      </div>
    </div>
  );
};

export default WorkspaceSettings;
