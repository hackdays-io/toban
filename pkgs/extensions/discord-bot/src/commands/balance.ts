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
  if (!snowflake)
    return ephemeral("Discord のユーザー ID を取得できませんでした。");

  const guildId = interaction.guild_id;
  if (!guildId) {
    return ephemeral("このコマンドはサーバー内で実行してください。");
  }

  const identity = deps.identity ?? createIdentityClient(env);
  const [record, platformLink] = await Promise.all([
    identity.getIdentity("discord", snowflake),
    identity.getPlatformLink("discord", guildId),
  ]);
  if (!record) {
    return ephemeral(
      "Discord アカウントがまだ連携されていません。`/toban-setup` を実行してウォレットを接続してください。",
    );
  }
  if (!platformLink) {
    return ephemeral(
      "このサーバーはまだ Toban ワークスペースに連携されていません。管理者に `/toban-link` の実行を依頼してください。",
    );
  }

  const client = getPublicClient(env);
  const spender = env.TURNKEY_BOT_SIGNER_ADDRESS as Hex;
  const owner = record.wallet as Address;

  // Token resolution and role-context resolution both depend only on
  // (treeId, owner) and hit different subgraphs, so run them concurrently
  // — `/balance` is not deferred and must stay inside Discord's 3s ACK.
  const resolveTokenAddress =
    deps.resolveTokenAddress ??
    ((treeId) => resolveThanksTokenAddress(env, treeId));
  const [token, relatedRoles] = await Promise.all([
    resolveTokenAddress(platformLink.treeId),
    resolveRelatedRoles(env, owner, platformLink.treeId),
  ]);
  if (!token) {
    return ephemeral(
      `ワークスペースの ThanksToken を取得できませんでした（tree ${platformLink.treeId}）。`,
    );
  }

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
      `ウォレット: \`${owner}\``,
      `Bot への許可枠: **${formatEther(allowance as bigint)}** THX`,
      `送信可能枠: **${formatEther(mintable as bigint)}** THX`,
    ].join("\n"),
  );
}
