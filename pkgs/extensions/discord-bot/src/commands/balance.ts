/**
 * /balance
 *
 * Read-only. Resolves the caller's Discord snowflake -> wallet via the
 * identity worker, then reads `mintAllowance(self, bot)` and
 * `mintableAmount(self, self, [])` from the ThanksToken contract.
 *
 * `mintableAmount` is queried with `to = self` and an empty
 * `relatedRoles` array as a probe — agent A's spec says that returns
 * the upper bound under the caller's current role context. This will
 * be replaced with proper role context once the role-resolver is wired
 * up (TODO).
 */
import type {
  APIChatInputApplicationCommandInteraction,
  APIInteractionResponse,
} from "discord-api-types/v10";
import type { Address, Hex } from "viem";
import {
  EMPTY_RELATED_ROLES,
  THANKS_TOKEN_ABI,
  getPublicClient,
  thanksTokenAddress,
} from "../chain";
import type { Env } from "../env";
import { type IdentityClient, createIdentityClient } from "../identity";
import { ephemeral } from "./responses";

export interface BalanceDeps {
  identity?: IdentityClient;
}

export async function handleBalance(
  env: Env,
  interaction: APIChatInputApplicationCommandInteraction,
  deps: BalanceDeps = {},
): Promise<APIInteractionResponse> {
  const snowflake = interaction.member?.user.id ?? interaction.user?.id;
  if (!snowflake) return ephemeral("Could not read your Discord user id.");

  const identity = deps.identity ?? createIdentityClient(env);
  const record = await identity.getIdentity("discord", snowflake);
  if (!record) {
    return ephemeral(
      "Your Discord account isn't linked yet. Run `/toban-setup` to connect a wallet.",
    );
  }

  const client = getPublicClient(env);
  const token = thanksTokenAddress(env);
  const spender = env.TURNKEY_BOT_SIGNER_ADDRESS as Hex;
  const owner = record.wallet as Address;

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
      args: [owner, owner, EMPTY_RELATED_ROLES],
    }),
  ]);

  return ephemeral(
    [
      `Wallet: \`${owner}\``,
      `Allowance for bot: **${allowance.toString()}** THX`,
      `Mintable budget : **${mintable.toString()}** THX`,
    ].join("\n"),
  );
}
