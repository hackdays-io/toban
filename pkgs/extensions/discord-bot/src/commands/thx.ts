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
    return { error: "`user` is required." };
  }
  if (amountRaw === undefined || amountRaw <= 0) {
    return { error: "amount must be a positive integer" };
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
          "The recipient hasn't linked a wallet yet. Ask them to run `/toban-setup`, or specify their address/ENS via the `address` option.",
      };
    }
    return { wallet: rec.wallet as Address };
  }

  const literal = recipient.value;
  if (literal.startsWith("0x")) {
    if (!isAddress(literal)) {
      return { error: `Not a valid 0x address: ${literal}` };
    }
    return { wallet: literal as Address };
  }
  if (literal.endsWith(".eth")) {
    const resolved = await resolveEns(literal);
    if (!resolved) {
      return { error: `Could not resolve ENS name: ${literal}` };
    }
    return { wallet: resolved };
  }
  return {
    error: `Unsupported address format: ${literal}. Use 0x... or *.eth.`,
  };
}

/**
 * Execute /thx end-to-end. Returns nothing — observable side effects
 * are (a) chain state changes and (b) Discord followup messages.
 */
export async function executeThx(
  env: Env,
  interaction: APIChatInputApplicationCommandInteraction,
  deps: ThxDeps = {},
): Promise<void> {
  const followup = deps.followup ?? sendFollowup;
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
      "This command must be run inside a server.",
    );
    return;
  }

  const identity = deps.identity ?? createIdentityClient(env);
  const [sender, platformLink] = await Promise.all([
    identity.getIdentity("discord", senderSf),
    identity.getPlatformLink("discord", guildId),
  ]);
  if (!sender) {
    await followup(
      env.DISCORD_APP_ID,
      interaction.token,
      "You haven't linked a wallet. Run `/toban-setup` first.",
    );
    return;
  }
  if (!platformLink) {
    await followup(
      env.DISCORD_APP_ID,
      interaction.token,
      "This server isn't linked to a Toban workspace yet. Ask an admin to run `/toban-link` first.",
    );
    return;
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
    parsed.recipient,
    env,
    identity,
    resolveEns,
  );
  if ("error" in recipientResolution) {
    await followup(
      env.DISCORD_APP_ID,
      interaction.token,
      recipientResolution.error,
    );
    return;
  }
  const recipientWallet = recipientResolution.wallet;

  const resolveTokenAddress =
    deps.resolveTokenAddress ??
    ((treeId) => resolveThanksTokenAddress(env, treeId));
  const token = await resolveTokenAddress(platformLink.treeId);
  if (!token) {
    await followup(
      env.DISCORD_APP_ID,
      interaction.token,
      `Could not resolve the workspace's ThanksToken (tree ${platformLink.treeId}). Indexing may still be in progress.`,
    );
    return;
  }
  const publicClient = deps.publicClient ?? getPublicClient(env);
  const botAddress = env.TURNKEY_BOT_SIGNER_ADDRESS as Hex;

  const allowance = (await publicClient.readContract({
    address: token,
    abi: THANKS_TOKEN_ABI,
    functionName: "mintAllowance",
    args: [sender.wallet as Address, botAddress],
  })) as bigint;
  if (allowance < parsed.amount) {
    await followup(
      env.DISCORD_APP_ID,
      interaction.token,
      `Not enough allowance for the bot (have ${formatEther(allowance)} THX, need ${formatEther(parsed.amount)} THX). Increase it at ${env.TOBAN_FRONTEND_URL}/${platformLink.treeId}/discord-bot`,
    );
    return;
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
        parsed.amount,
        relatedRoles,
        `0x${Buffer.from(parsed.message, "utf8").toString("hex")}` as Hex,
      ],
    });
  } catch (err) {
    await followup(
      env.DISCORD_APP_ID,
      interaction.token,
      `mintFrom failed: ${(err as Error).message}`,
    );
    return;
  }

  const recipientLabel =
    parsed.recipient.kind === "snowflake"
      ? `<@${parsed.recipient.value}>`
      : parsed.recipient.value;
  await followup(
    env.DISCORD_APP_ID,
    interaction.token,
    [
      `Sent **${formatEther(parsed.amount)}** THX to ${recipientLabel}.`,
      parsed.recipient.kind === "address"
        ? `Address: \`${recipientWallet}\``
        : null,
      parsed.message ? `> ${parsed.message}` : null,
      `Tx: \`${txHash}\``,
    ]
      .filter(Boolean)
      .join("\n"),
  );
}
