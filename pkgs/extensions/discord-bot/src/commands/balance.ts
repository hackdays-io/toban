/**
 * /balance
 *
 * Read-only. Resolves the caller's Discord snowflake -> wallet via the
 * identity worker, then reads `mintAllowance(self, bot)` and
 * `mintableAmount(self, [])` from the ThanksToken contract. With an
 * empty `relatedRoles`, `mintableAmount` returns the address-coefficient
 * cap — a safe upper bound until role-context plumbing arrives.
 */
import type {
  APIChatInputApplicationCommandInteraction,
  APIInteractionResponse,
} from "discord-api-types/v10";
import { type Address, type Hex, formatEther } from "viem";
import {
  THANKS_TOKEN_ABI,
  getPublicClient,
  resolveRelatedRoles,
  resolveThanksTokenAddress,
} from "../chain";
import type { Env } from "../env";
import { type IdentityClient, createIdentityClient } from "../identity";
import { ephemeral } from "./responses";

export interface BalanceDeps {
  identity?: IdentityClient;
  resolveTokenAddress?: (treeId: string) => Promise<Hex | null>;
}

export async function handleBalance(
  env: Env,
  interaction: APIChatInputApplicationCommandInteraction,
  deps: BalanceDeps = {},
): Promise<APIInteractionResponse> {
  const snowflake = interaction.member?.user.id ?? interaction.user?.id;
  if (!snowflake) return ephemeral("Could not read your Discord user id.");

  const guildId = interaction.guild_id;
  if (!guildId) {
    return ephemeral("This command must be run inside a server.");
  }

  const identity = deps.identity ?? createIdentityClient(env);
  const [record, platformLink] = await Promise.all([
    identity.getIdentity("discord", snowflake),
    identity.getPlatformLink("discord", guildId),
  ]);
  if (!record) {
    return ephemeral(
      "Your Discord account isn't linked yet. Run `/toban-setup` to connect a wallet.",
    );
  }
  if (!platformLink) {
    return ephemeral(
      "This server isn't linked to a Toban workspace yet. Ask an admin to run `/toban-link` first.",
    );
  }

  const resolveTokenAddress =
    deps.resolveTokenAddress ??
    ((treeId) => resolveThanksTokenAddress(env, treeId));
  const token = await resolveTokenAddress(platformLink.treeId);
  if (!token) {
    return ephemeral(
      `Could not resolve the workspace's ThanksToken (tree ${platformLink.treeId}).`,
    );
  }

  const client = getPublicClient(env);
  const spender = env.TURNKEY_BOT_SIGNER_ADDRESS as Hex;
  const owner = record.wallet as Address;

  const relatedRoles = await resolveRelatedRoles(
    env,
    owner,
    platformLink.treeId,
  );

  const [allowance, mintable] = await Promise.all([
    client.readContract({
      address: token,
      abi: THANKS_TOKEN_ABI,
      functionName: "mintAllowance",
      args: [owner, spender],
    }),
    client.readContract({
      address: token,
      abi: THANKS_TOKEN_ABI,
      functionName: "mintableAmount",
      args: [owner, relatedRoles],
    }),
  ]);

  return ephemeral(
    [
      `Wallet: \`${owner}\``,
      `Allowance for bot: **${formatEther(allowance as bigint)}** THX`,
      `Mintable budget : **${formatEther(mintable as bigint)}** THX`,
    ].join("\n"),
  );
}
