import { usePrivy } from "@privy-io/react-auth";
import { useQuery as useTanstackQuery } from "@tanstack/react-query";
import {
  hatsContractBaseConfig,
  thanksTokenBaseConfig,
} from "hooks/useContracts";
import { useHats } from "hooks/useHats";
import { publicClient } from "hooks/useViem";
import { useActiveWallet } from "hooks/useWallet";
import { useGetWorkspace } from "hooks/useWorkspace";
import { type FC, useMemo, useState } from "react";
import { SiDiscord } from "react-icons/si";
import { useParams } from "react-router";
import { toast } from "sonner";
import { type Address, formatEther, maxUint256, parseEther } from "viem";
import { PageContainer } from "~/components/layout/PageContainer";
import { Button } from "~/components/ui/button";
import { Card, CardContent } from "~/components/ui/card";
import { Heading } from "~/components/ui/heading";
import { Icon } from "~/components/ui/icon";
import { Input } from "~/components/ui/input";
import { Typography } from "~/components/ui/typography";

const PRESETS = [1000n, 5000n, 10000n] as const;

function formatAllowance(value: bigint | undefined): string {
  if (value === undefined) return "—";
  if (value === maxUint256) return "∞ (無制限)";
  return formatEther(value);
}

interface QuestAgentSectionProps {
  /** questAgentHat id for this workspace, from the subgraph Workspace entity. */
  questAgentHatId: string | undefined;
  /** Workspace owner = top-hat wearer (super-admin of every authority hat). */
  owner: string | undefined;
  /** operatorHat id — the direct admin of questAgentHat. */
  operatorHatId: string | undefined;
  /** Bot signer address that should wear the questAgentHat when enabled. */
  botSigner: Address;
}

// Grants/revokes the questAgentHat to the Discord bot signer so it can submit
// quest completions on members' behalf. Mirrors the settings page's
// AuthorityList (mintHat to grant, adminRevokeAuthorityHat to revoke) but
// specialised to the single, fixed bot address.
const QuestAgentSection: FC<QuestAgentSectionProps> = ({
  questAgentHatId: questAgentHatIdStr,
  owner,
  operatorHatId,
  botSigner,
}) => {
  const { wallet } = useActiveWallet();
  const walletAddress = wallet?.account?.address as Address | undefined;
  const { mintHat, adminRevokeAuthorityHat } = useHats();
  const [pending, setPending] = useState<"grant" | "revoke" | null>(null);

  // questAgentHat id comes from the subgraph Workspace entity (indexed from
  // BigBang's Executed event), same source as every other hat id on this page.
  const questAgentHatId = useMemo(
    () => (questAgentHatIdStr ? BigInt(questAgentHatIdStr) : undefined),
    [questAgentHatIdStr],
  );

  const statusQuery = useTanstackQuery({
    queryKey: ["quest-agent-status", botSigner, questAgentHatId?.toString()],
    enabled: !!questAgentHatId && !!botSigner,
    queryFn: async (): Promise<boolean> =>
      (await publicClient.readContract({
        ...hatsContractBaseConfig,
        functionName: "isWearerOfHat",
        args: [botSigner, questAgentHatId as bigint],
      })) as boolean,
  });
  const isEnabled = statusQuery.data === true;

  // Only the operatorHat wearer or the workspace owner (top hat) can mint/revoke
  // the questAgentHat — gate the buttons so we don't prompt a doomed tx.
  const canManageQuery = useTanstackQuery({
    queryKey: ["quest-agent-admin", walletAddress, owner, operatorHatId],
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
  const canManage = canManageQuery.data === true;

  const grant = async () => {
    if (!questAgentHatId) return;
    setPending("grant");
    try {
      await mintHat({ hatId: questAgentHatId, wearer: botSigner });
      await statusQuery.refetch();
      toast.success("Bot に代理申請の権限を付与しました");
    } catch (e) {
      console.error(e);
      toast.error("権限の付与に失敗しました");
    } finally {
      setPending(null);
    }
  };

  const revoke = async () => {
    if (!questAgentHatId || !walletAddress) return;
    setPending("revoke");
    try {
      // transferHat(from→signer)+renounce, so the admin param must be the
      // signing wallet (it temporarily receives the hat before renouncing).
      await adminRevokeAuthorityHat({
        hatId: questAgentHatId,
        from: botSigner,
        admin: walletAddress,
      });
      await statusQuery.refetch();
      toast.success("Bot の代理申請の権限を剥奪しました");
    } catch (e) {
      console.error(e);
      toast.error("権限の剥奪に失敗しました");
    } finally {
      setPending(null);
    }
  };

  return (
    <Card>
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <Heading variant="h3" level={2}>
            Quest 代理申請の権限
          </Heading>
          <Typography variant="bodySm" tone="secondary">
            有効にすると、メンバーがウォレット操作なしに Discord から{" "}
            <code>/quest submit</code>{" "}
            でクエスト完了申請を出せるようになります。Bot
            はメンバー本人の名義で申請します。
          </Typography>
        </div>

        <div className="flex flex-col gap-1">
          <Typography variant="bodySm" tone="secondary">
            現在の状態
          </Typography>
          <Typography
            variant="statMd"
            tone={isEnabled ? "success" : "secondary"}
          >
            {!questAgentHatId || statusQuery.isLoading
              ? "読み込み中…"
              : isEnabled
                ? "有効"
                : "無効"}
          </Typography>
        </div>

        {!canManage && walletAddress && (
          <Typography variant="caption" tone="secondary">
            付与・剥奪には operatorHat
            またはワークスペースオーナーの権限が必要です。
          </Typography>
        )}

        <div className="grid grid-cols-2 gap-2">
          <Button
            disabled={!canManage || pending !== null || isEnabled}
            onClick={grant}
          >
            {pending === "grant" ? "送信中…" : "有効化（付与）"}
          </Button>
          <Button
            variant="danger"
            disabled={!canManage || pending !== null || !isEnabled}
            onClick={revoke}
          >
            {pending === "revoke" ? "送信中…" : "無効化（剥奪）"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

const DiscordBotWorkspace: FC = () => {
  const { treeId } = useParams<{ treeId: string }>();

  const { ready, authenticated, login } = usePrivy();
  const { wallet } = useActiveWallet();
  const walletAddress = wallet?.account?.address as Address | undefined;

  const botSigner = import.meta.env.VITE_DISCORD_BOT_SIGNER_ADDRESS as
    | Address
    | undefined;

  const { data: workspaceData } = useGetWorkspace({
    workspaceId: treeId ?? "",
  });
  const thanksToken = workspaceData?.workspace?.thanksToken?.id as
    | Address
    | undefined;

  const allowanceQuery = useTanstackQuery({
    queryKey: ["discord-bot-allowance", thanksToken, walletAddress, botSigner],
    enabled: !!thanksToken && !!walletAddress && !!botSigner,
    queryFn: async (): Promise<bigint> => {
      if (!thanksToken || !walletAddress || !botSigner) return 0n;
      return (await publicClient.readContract({
        ...thanksTokenBaseConfig(thanksToken),
        functionName: "mintAllowance",
        args: [walletAddress, botSigner],
      })) as bigint;
    },
  });

  const [customAmount, setCustomAmount] = useState("");
  const [submittingAmount, setSubmittingAmount] = useState<bigint | null>(null);

  const submitApprove = async (rawValue: bigint) => {
    if (!wallet || !thanksToken || !botSigner) return;
    setSubmittingAmount(rawValue);
    try {
      const hash = await wallet.writeContract({
        ...thanksTokenBaseConfig(thanksToken),
        functionName: "approveMint",
        args: [botSigner, rawValue],
      });
      await publicClient.waitForTransactionReceipt({ hash });
      await allowanceQuery.refetch();
      toast.success(
        rawValue === 0n
          ? "Bot の mint 許可を取り消しました"
          : "Mint 許可を更新しました",
      );
    } catch (e) {
      console.error(e);
      const message = e instanceof Error ? e.message : "unknown error";
      toast.error(`送信に失敗しました: ${message}`);
    } finally {
      setSubmittingAmount(null);
    }
  };

  const parsedCustom = useMemo(() => {
    const trimmed = customAmount.trim();
    if (!trimmed) return null;
    try {
      return parseEther(trimmed);
    } catch {
      return null;
    }
  }, [customAmount]);

  if (!botSigner) {
    return (
      <PageContainer className="flex flex-col gap-6 pt-8 pb-12 md:pt-12">
        <Heading variant="h2" level={1}>
          Discord bot 連携
        </Heading>
        <Card>
          <CardContent>
            <Typography variant="body" tone="danger">
              VITE_DISCORD_BOT_SIGNER_ADDRESS が未設定です。frontend の .env を
              確認してください。
            </Typography>
          </CardContent>
        </Card>
      </PageContainer>
    );
  }

  return (
    <PageContainer className="flex flex-col gap-6 pt-8 pb-12 md:pt-12">
      <header className="flex flex-col gap-1">
        <Typography variant="bodySm" tone="secondary">
          ワークスペース #{treeId} の外部サービス連携
        </Typography>
        <Heading variant="h2" level={1}>
          Discord bot 連携
        </Heading>
      </header>

      <Card>
        <CardContent className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <SiDiscord size={28} className="text-[#5865F2]" />
            <div className="flex flex-col">
              <Typography variant="bodySm" tone="secondary">
                Bot signer
              </Typography>
              <Typography variant="mono" weight="bold">
                {botSigner}
              </Typography>
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <Typography variant="bodySm" tone="secondary">
              ThanksToken contract
            </Typography>
            <Typography variant="mono">
              {thanksToken ?? "（取得中…）"}
            </Typography>
          </div>

          <div className="flex flex-col gap-1">
            <Typography variant="bodySm" tone="secondary">
              現在の許可量 (このワークスペース)
            </Typography>
            <Typography variant="statMd">
              {allowanceQuery.isLoading
                ? "読み込み中…"
                : `${formatAllowance(allowanceQuery.data)} THX`}
            </Typography>
          </div>
        </CardContent>
      </Card>

      <QuestAgentSection
        questAgentHatId={workspaceData?.workspace?.questAgentHatId ?? undefined}
        owner={workspaceData?.workspace?.owner ?? undefined}
        operatorHatId={workspaceData?.workspace?.operatorHatId ?? undefined}
        botSigner={botSigner}
      />

      <section className="flex flex-col gap-2">
        <Heading variant="h3" level={2}>
          Mint 許可設定
        </Heading>
        <Typography variant="bodySm" tone="secondary">
          このワークスペースの Discord で <code>/thx</code> を打つと、ここで
          設定した上限から消費されます。別のコミュニティでの設定とは独立しています。
        </Typography>
      </section>

      {!ready ? (
        <Button full disabled>
          読み込み中…
        </Button>
      ) : !authenticated || !walletAddress ? (
        <Button full onClick={login}>
          <Icon name="wallet" size={18} />
          ウォレットを接続
        </Button>
      ) : (
        <Card>
          <CardContent className="flex flex-col gap-4">
            <div className="grid grid-cols-3 gap-2">
              {PRESETS.map((amount) => (
                <Button
                  key={amount.toString()}
                  variant="secondary"
                  disabled={submittingAmount !== null}
                  onClick={() => submitApprove(parseEther(amount.toString()))}
                >
                  {submittingAmount === parseEther(amount.toString())
                    ? "送信中…"
                    : `${amount.toString()} THX`}
                </Button>
              ))}
            </div>

            <div className="flex flex-col gap-2">
              <Typography variant="bodySm" tone="secondary">
                カスタム金額
              </Typography>
              <div className="flex gap-2">
                <Input
                  type="text"
                  inputMode="decimal"
                  placeholder="例: 500"
                  value={customAmount}
                  onChange={(e) => setCustomAmount(e.target.value)}
                />
                <Button
                  disabled={parsedCustom === null || submittingAmount !== null}
                  onClick={() => parsedCustom && submitApprove(parsedCustom)}
                >
                  {submittingAmount !== null &&
                  parsedCustom !== null &&
                  submittingAmount === parsedCustom
                    ? "送信中…"
                    : "適用"}
                </Button>
              </div>
              {customAmount && parsedCustom === null && (
                <Typography variant="caption" tone="danger">
                  数値で入力してください。
                </Typography>
              )}
            </div>

            <div className="flex flex-col gap-2 border-t pt-4">
              <Typography variant="bodySm" tone="secondary">
                Bot 鍵が漏洩した場合、ここで設定した上限まで mint
                される可能性があります。<strong>無制限 (∞) は非推奨</strong>。
              </Typography>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="ghost"
                  disabled={submittingAmount !== null}
                  onClick={() => submitApprove(maxUint256)}
                >
                  {submittingAmount === maxUint256 ? "送信中…" : "∞ (非推奨)"}
                </Button>
                <Button
                  variant="danger"
                  disabled={submittingAmount !== null}
                  onClick={() => submitApprove(0n)}
                >
                  {submittingAmount === 0n ? "送信中…" : "Revoke (0)"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </PageContainer>
  );
};

export default DiscordBotWorkspace;
