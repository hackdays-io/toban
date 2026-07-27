/**
 * /toban-setup
 *
 * Pure response: no chain reads, no DB writes. Issue a verifier_token
 * JWT bound to the caller's Discord snowflake and return it inside an
 * ephemeral message so the user can finish identity binding via the
 * Toban frontend.
 */
import type {
  APIChatInputApplicationCommandInteraction,
  APIInteractionResponse,
} from "discord-api-types/v10";
import type { Env } from "../env";
import { createIdentityClient } from "../identity";
import { issueVerifierToken } from "../verifier";
import { ephemeral } from "./responses";

export async function handleTobanSetup(
  env: Env,
  interaction: APIChatInputApplicationCommandInteraction,
): Promise<APIInteractionResponse> {
  const snowflake = interaction.member?.user.id ?? interaction.user?.id;
  if (!snowflake) {
    return ephemeral(
      "Discord のユーザー ID を取得できませんでした。サーバーのチャンネルから再度お試しください。",
    );
  }
  const token = await issueVerifierToken(env.VERIFIER_PRIVATE_KEY, snowflake);

  // Lookup the platform_link for this guild so we can hand the
  // frontend a treeId for the next step (allowance setup). Best-effort:
  // if the guild isn't linked yet we still let the user finish identity
  // binding and pick a workspace afterwards.
  let treeId: string | undefined;
  if (interaction.guild_id) {
    try {
      const link = await createIdentityClient(env).getPlatformLink(
        "discord",
        interaction.guild_id,
      );
      treeId = link?.treeId;
    } catch {
      // Identity worker down — proceed without treeId.
    }
  }

  // verifier_token rides in the URL *fragment* (`#token=…`) so it does
  // not leak via browser history, Referer headers, or server logs.
  // treeId stays in the query string — it's not a secret.
  const base = env.TOBAN_FRONTEND_URL.replace(/\/$/, "");
  const treeQuery = treeId ? `?treeId=${encodeURIComponent(treeId)}` : "";
  const url = `${base}/connect/discord${treeQuery}#token=${encodeURIComponent(token)}`;
  return ephemeral(
    [
      "15 分以内にこのリンクをブラウザで開き、ウォレットを接続してください:",
      url,
      "",
      "このリンクはあなた専用です。他の人と共有しないでください。",
    ].join("\n"),
  );
}
