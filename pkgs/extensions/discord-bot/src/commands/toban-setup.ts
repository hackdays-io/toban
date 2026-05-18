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
      "Could not read your Discord user id — please try again from a server channel.",
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

  const base = env.TOBAN_FRONTEND_URL.replace(/\/$/, "");
  const url = `${base}/connect/discord?token=${encodeURIComponent(token)}${
    treeId ? `&treeId=${encodeURIComponent(treeId)}` : ""
  }`;
  return ephemeral(
    [
      "Open this link in your browser within 15 minutes to connect your wallet:",
      url,
      "",
      "The link is for you only. Do not share it.",
    ].join("\n"),
  );
}
