/**
 * /thx @user <amount> [message]
 *
 * High-level flow (see issue #508 sequence diagram):
 *   1. Resolve sender & recipient Discord snowflakes -> wallets.
 *   2. Read `mintAllowance(sender, bot)` to confirm head-room.
 *   3. Sign + broadcast `mintFrom(sender, recipient, amount, [], data)`
 *      via Turnkey-backed viem signer.
 *   4. DM the result back to the caller as a followup.
 *
 * The interaction has already been deferred by the caller (3-second
 * Discord limit) before this function runs — i.e. we are inside
 * `ctx.waitUntil(...)`.
 */
import type { APIChatInputApplicationCommandInteraction } from "discord-api-types/v10";
import {
  http,
  type Address,
  type Hex,
  type LocalAccount,
  type PublicClient,
  createPublicClient,
  createWalletClient,
  formatEther,
  isAddress,
  parseEther,
} from "viem";
import { mainnet } from "viem/chains";
import {
  THANKS_TOKEN_ABI,
  getChain,
  getPublicClient,
  resolveRelatedRoles,
  resolveThanksTokenAddress,
} from "../chain";
import type { Env } from "../env";
import { type IdentityClient, createIdentityClient } from "../identity";
import { createTurnkeySigner } from "../signer/turnkey";
import { sendFollowup } from "./responses";

/**
 * Recipient is either a Discord member (snowflake → identity lookup) or
 * a raw chain identifier (hex address or ENS name → direct resolve, no
 * identity binding required).
 */
type RecipientArg =
  | { kind: "snowflake"; value: string }
  | { kind: "address"; value: string };

interface ThxArgs {
  recipient: RecipientArg;
  amount: bigint;
  message: string;
}

/** Pull the recipient / amount / message options out of the interaction. */
export function parseThxArgs(
  interaction: APIChatInputApplicationCommandInteraction,
): ThxArgs | { error: string } {
  const opts = interaction.data?.options ?? [];
  let snowflake: string | undefined;
  let addressLiteral: string | undefined;
  let amountRaw: number | undefined;
  let message = "";
  for (const opt of opts) {
    // discord-api-types unions are intentionally narrow; cast to a
    // permissive shape and validate by `name`.
    const o = opt as { name: string; value?: string | number | boolean };
    if (o.name === "user" && typeof o.value === "string") {
      snowflake = o.value;
    } else if (o.name === "address" && typeof o.value === "string") {
      addressLiteral = o.value.trim();
    } else if (o.name === "amount" && typeof o.value === "number") {
      amountRaw = o.value;
    } else if (o.name === "message" && typeof o.value === "string") {
      message = o.value;
    }
  }

  const haveSnowflake = typeof snowflake === "string" && snowflake.length > 0;
  const haveAddress =
    typeof addressLiteral === "string" && addressLiteral.length > 0;
  if (!haveSnowflake) {
    return { error: "`user` は必須です。" };
  }
  if (amountRaw === undefined || amountRaw <= 0) {
    return { error: "amount には 1 以上の整数を指定してください。" };
  }
  return {
    // `address` overrides `user` when both are supplied. This lets the
    // sender redirect to a wallet the recipient hasn't (yet) linked.
    recipient: haveAddress
      ? { kind: "address", value: addressLiteral as string }
      : { kind: "snowflake", value: snowflake as string },
    // Discord INTEGER options carry the human-readable THX count; the
    // contract stores ThanksToken as an 18-decimal ERC-20, so scale here.
    amount: parseEther(amountRaw.toString()),
    message,
  };
}

export interface ThxDeps {
  identity?: IdentityClient;
  publicClient?: PublicClient;
  signer?: LocalAccount;
  /**
   * Resolve `treeId -> ThanksToken address`. Defaults to a Goldsky
   * subgraph fetch — tests inject a stub to avoid network calls.
   */
  resolveTokenAddress?: (treeId: string) => Promise<Hex | null>;
  /**
   * Resolve an ENS name to an address on Ethereum mainnet. Defaults to
   * a viem mainnet client built from `env.MAINNET_RPC_URL`. Tests can
   * stub this to avoid network calls.
   */
  resolveEnsAddress?: (name: string) => Promise<Address | null>;
  /**
   * Resolve the sender's role-context array for ThanksToken
   * `mintFrom` / `mintableAmount`. Defaults to a Goldsky subgraph
   * fetch via {@link resolveRelatedRoles}. Tests inject a stub.
   */
  resolveRelatedRoles?: (
    owner: Address,
    treeId: string,
  ) => Promise<readonly { hatId: bigint; wearer: Address }[]>;
  /** Inject the followup-message sender for tests. */
  followup?: (appId: string, token: string, content: string) => Promise<void>;
}

async function resolveRecipientWallet(
  recipient: RecipientArg,
  env: Env,
  identity: IdentityClient,
  resolveEns: (name: string) => Promise<Address | null>,
): Promise<{ wallet: Address } | { error: string }> {
  if (recipient.kind === "snowflake") {
    const rec = await identity.getIdentity("discord", recipient.value);
    if (!rec) {
      return {
        error:
          "送り先のメンバーはまだウォレットを連携していません。`/toban-setup` の実行を依頼するか、`address` オプションでアドレス / ENS を直接指定してください。",
      };
    }
    return { wallet: rec.wallet as Address };
  }

  const literal = recipient.value;
  if (literal.startsWith("0x")) {
    if (!isAddress(literal)) {
      return { error: `0x アドレスの形式が正しくありません: ${literal}` };
    }
    return { wallet: literal as Address };
  }
  if (literal.endsWith(".eth")) {
    const resolved = await resolveEns(literal);
    if (!resolved) {
      return { error: `ENS 名を解決できませんでした: ${literal}` };
    }
    return { wallet: resolved };
  }
  return {
    error: `対応していないアドレス形式です: ${literal}。\`0x...\` または \`*.eth\` を指定してください。`,
  };
}

/**
 * Execute /thx end-to-end. Returns nothing — observable side effects
 * are (a) chain state changes and (b) Discord followup messages.
 *
 * Wrapped in a top-level try/catch because we run inside
 * `ctx.waitUntil(...)`: any unhandled throw silently rejects the
 * promise and leaves the deferred Discord interaction stuck in
 * "thinking…" forever. Every observable failure path *must* end with a
 * followup message, even if it's just an apology.
 */
export async function executeThx(
  env: Env,
  interaction: APIChatInputApplicationCommandInteraction,
  deps: ThxDeps = {},
): Promise<void> {
  const followup = deps.followup ?? sendFollowup;
  try {
    await executeThxInner(env, interaction, deps, followup);
  } catch (err) {
    console.error("executeThx unhandled:", err);
    try {
      await followup(
        env.DISCORD_APP_ID,
        interaction.token,
        "`/thx` の処理中にエラーが発生しました。運営に通知済みです。少し時間をおいて再度お試しください。",
      );
    } catch (followupErr) {
      console.error("executeThx followup-after-error failed:", followupErr);
    }
  }
}

/** Everything `performThx` needs, independent of how it was requested. */
export interface ThxParams {
  /** Discord snowflake of the person the mint is attributed to. */
  actorSf: string;
  guildId: string;
  recipient: RecipientArg;
  amount: bigint;
  message: string;
}

export type ThxOutcome =
  | {
      ok: true;
      txHash: Hex;
      recipientWallet: Address;
      recipientLabel: string;
      amount: bigint;
      message: string;
    }
  | { ok: false; error: string };

/**
 * The `/thx` core: resolve identities, check head-room, sign, broadcast.
 *
 * Split out from the slash-command handler so the MCP confirm-button path
 * (`src/mcp/`) reaches the chain through **exactly this function**. There must
 * be only one place that builds a `mintFrom` call — `turnkey/policy.json`
 * gates the selector, and two divergent call sites would eventually disagree
 * about what gets signed.
 *
 * `actorSf` is who the mint is attributed to. Callers must derive it from
 * something Discord signed (a slash command's invoker, or a component
 * interaction's clicker) — **never** from a value an agent supplied.
 */
export async function performThx(
  env: Env,
  params: ThxParams,
  deps: ThxDeps = {},
): Promise<ThxOutcome> {
  const identity = deps.identity ?? createIdentityClient(env);
  const [sender, platformLink] = await Promise.all([
    identity.getIdentity("discord", params.actorSf),
    identity.getPlatformLink("discord", params.guildId),
  ]);
  if (!sender) {
    return {
      ok: false,
      error:
        "ウォレットが連携されていません。先に `/toban-setup` を実行してください。",
    };
  }
  if (!platformLink) {
    return {
      ok: false,
      error:
        "このサーバーはまだ Toban ワークスペースに連携されていません。管理者に `/toban-link` の実行を依頼してください。",
    };
  }

  const resolveEns =
    deps.resolveEnsAddress ??
    (async (name: string) => {
      if (!env.MAINNET_RPC_URL) return null;
      const client = createPublicClient({
        chain: mainnet,
        transport: http(env.MAINNET_RPC_URL),
      });
      return (await client.getEnsAddress({ name })) ?? null;
    });
  const recipientResolution = await resolveRecipientWallet(
    params.recipient,
    env,
    identity,
    resolveEns,
  );
  if ("error" in recipientResolution) {
    return { ok: false, error: recipientResolution.error };
  }
  const recipientWallet = recipientResolution.wallet;

  const resolveTokenAddress =
    deps.resolveTokenAddress ??
    ((treeId: string) => resolveThanksTokenAddress(env, treeId));
  const token = await resolveTokenAddress(platformLink.treeId);
  if (!token) {
    return {
      ok: false,
      error: `ワークスペースの ThanksToken を取得できませんでした（tree ${platformLink.treeId}）。インデックス処理が完了していない可能性があります。`,
    };
  }
  const publicClient = deps.publicClient ?? getPublicClient(env);
  const botAddress = env.TURNKEY_BOT_SIGNER_ADDRESS as Hex;

  const allowance = (await publicClient.readContract({
    address: token,
    abi: THANKS_TOKEN_ABI,
    functionName: "mintAllowance",
    args: [sender.wallet as Address, botAddress],
  })) as bigint;
  if (allowance < params.amount) {
    return {
      ok: false,
      error: `Bot に許可された送信枠が足りません（現在 ${formatEther(allowance)} THX / 必要 ${formatEther(params.amount)} THX）。${env.TOBAN_FRONTEND_URL}/${platformLink.treeId}/discord-bot で上限を引き上げてください。`,
    };
  }

  const fetchRelatedRoles =
    deps.resolveRelatedRoles ??
    ((owner: Address, treeId: string) =>
      resolveRelatedRoles(env, owner, treeId));
  const relatedRoles = await fetchRelatedRoles(
    sender.wallet as Address,
    platformLink.treeId,
  );

  const signer = deps.signer ?? createTurnkeySigner(env);
  const wallet = createWalletClient({
    account: signer,
    chain: getChain(env),
    transport: http(env.RPC_URL),
  });

  let txHash: Hex;
  try {
    txHash = await wallet.writeContract({
      address: token,
      abi: THANKS_TOKEN_ABI,
      functionName: "mintFrom",
      args: [
        sender.wallet as Address,
        recipientWallet,
        params.amount,
        relatedRoles,
        `0x${Buffer.from(params.message, "utf8").toString("hex")}` as Hex,
      ],
    });
  } catch (err) {
    // Log the full error to Workers Logs (no length limit there); send the
    // concise viem `shortMessage` (e.g. the revert reason) to Discord so the
    // followup stays well under the 2000-char content cap.
    console.error("mintFrom failed:", err);
    const short =
      (err as { shortMessage?: string }).shortMessage ?? (err as Error).message;
    return { ok: false, error: `mintFrom に失敗しました: ${short}` };
  }

  return {
    ok: true,
    txHash,
    recipientWallet,
    recipientLabel:
      params.recipient.kind === "snowflake"
        ? `<@${params.recipient.value}>`
        : params.recipient.value,
    amount: params.amount,
    message: params.message,
  };
}

/** Render a successful {@link performThx} into the user-facing summary. */
export function formatThxSuccess(
  outcome: Extract<ThxOutcome, { ok: true }>,
  opts: { showAddress: boolean },
): string {
  return [
    `${outcome.recipientLabel} に **${formatEther(outcome.amount)}** THX を送りました。`,
    opts.showAddress ? `アドレス: \`${outcome.recipientWallet}\`` : null,
    outcome.message ? `> ${outcome.message}` : null,
    `Tx: \`${outcome.txHash}\``,
  ]
    .filter(Boolean)
    .join("\n");
}

async function executeThxInner(
  env: Env,
  interaction: APIChatInputApplicationCommandInteraction,
  deps: ThxDeps,
  followup: NonNullable<ThxDeps["followup"]>,
): Promise<void> {
  const senderSf = interaction.member?.user.id ?? interaction.user?.id ?? "";
  const parsed = parseThxArgs(interaction);
  if ("error" in parsed) {
    await followup(env.DISCORD_APP_ID, interaction.token, parsed.error);
    return;
  }

  const guildId = interaction.guild_id;
  if (!guildId) {
    await followup(
      env.DISCORD_APP_ID,
      interaction.token,
      "このコマンドはサーバー内で実行してください。",
    );
    return;
  }

  const outcome = await performThx(
    env,
    {
      actorSf: senderSf,
      guildId,
      recipient: parsed.recipient,
      amount: parsed.amount,
      message: parsed.message,
    },
    deps,
  );
  if (!outcome.ok) {
    await followup(env.DISCORD_APP_ID, interaction.token, outcome.error);
    return;
  }
  await followup(
    env.DISCORD_APP_ID,
    interaction.token,
    formatThxSuccess(outcome, {
      showAddress: parsed.recipient.kind === "address",
    }),
  );
}
