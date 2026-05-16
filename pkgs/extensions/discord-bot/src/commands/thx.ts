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
  createWalletClient,
} from "viem";
import {
  EMPTY_RELATED_ROLES,
  THANKS_TOKEN_ABI,
  getChain,
  getPublicClient,
  thanksTokenAddress,
} from "../chain";
import type { Env } from "../env";
import { type IdentityClient, createIdentityClient } from "../identity";
import { createTurnkeySigner } from "../signer/turnkey";
import { sendFollowup } from "./responses";

interface ThxArgs {
  recipientSnowflake: string;
  amount: bigint;
  message: string;
}

/** Pull the recipient / amount / message options out of the interaction. */
export function parseThxArgs(
  interaction: APIChatInputApplicationCommandInteraction,
): ThxArgs | { error: string } {
  const opts = interaction.data?.options ?? [];
  let recipientSnowflake: string | undefined;
  let amountRaw: number | undefined;
  let message = "";
  for (const opt of opts) {
    // discord-api-types unions are intentionally narrow; cast to a
    // permissive shape and validate by `name`.
    const o = opt as { name: string; value?: string | number | boolean };
    if (o.name === "user" && typeof o.value === "string") {
      recipientSnowflake = o.value;
    } else if (o.name === "amount" && typeof o.value === "number") {
      amountRaw = o.value;
    } else if (o.name === "message" && typeof o.value === "string") {
      message = o.value;
    }
  }
  if (!recipientSnowflake) return { error: "missing user option" };
  if (amountRaw === undefined || amountRaw <= 0) {
    return { error: "amount must be a positive integer" };
  }
  return {
    recipientSnowflake,
    amount: BigInt(amountRaw),
    message,
  };
}

export interface ThxDeps {
  identity?: IdentityClient;
  publicClient?: PublicClient;
  signer?: LocalAccount;
  /** Inject the followup-message sender for tests. */
  followup?: (appId: string, token: string, content: string) => Promise<void>;
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

  const identity = deps.identity ?? createIdentityClient(env);
  const [sender, recipient] = await Promise.all([
    identity.getIdentity("discord", senderSf),
    identity.getIdentity("discord", parsed.recipientSnowflake),
  ]);
  if (!sender) {
    await followup(
      env.DISCORD_APP_ID,
      interaction.token,
      "You haven't linked a wallet. Run `/toban-setup` first.",
    );
    return;
  }
  if (!recipient) {
    await followup(
      env.DISCORD_APP_ID,
      interaction.token,
      "The recipient hasn't linked a wallet yet. Ask them to run `/toban-setup`.",
    );
    return;
  }

  const publicClient = deps.publicClient ?? getPublicClient(env);
  const token = thanksTokenAddress(env);
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
      `Not enough allowance for the bot (have ${allowance.toString()}, need ${parsed.amount.toString()}). Increase it at ${env.TOBAN_FRONTEND_URL}/allowance/discord-bot`,
    );
    return;
  }

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
        recipient.wallet as Address,
        parsed.amount,
        EMPTY_RELATED_ROLES,
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

  await followup(
    env.DISCORD_APP_ID,
    interaction.token,
    [
      `Sent **${parsed.amount.toString()}** THX to <@${parsed.recipientSnowflake}>.`,
      parsed.message ? `> ${parsed.message}` : null,
      `Tx: \`${txHash}\``,
    ]
      .filter(Boolean)
      .join("\n"),
  );
}
