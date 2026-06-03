/**
 * Cloudflare Workers entry.
 *
 * Routes:
 *   POST /discord/interactions  -> Ed25519-verified Discord interaction
 *   GET  /api/install/callback  -> OAuth bot-install callback
 *
 * Anything else returns 404.
 */
import {
  type APIChatInputApplicationCommandInteraction,
  type APIInteraction,
  InteractionResponseType,
  InteractionType,
} from "discord-api-types/v10";
import { handleInstallCallback } from "./api/install/callback";
import { handleBalance } from "./commands/balance";
import { deferredEphemeral, ephemeral, pong } from "./commands/responses";
import { executeThx } from "./commands/thx";
import { handleTobanLink } from "./commands/toban-link";
import { handleTobanSetup } from "./commands/toban-setup";
import type { Env } from "./env";
import { verifyDiscordInteraction } from "./interactions/verify";

function jsonResponse(body: unknown, init: ResponseInit = {}): Response {
  return new Response(JSON.stringify(body), {
    ...init,
    headers: {
      "content-type": "application/json",
      ...(init.headers ?? {}),
    },
  });
}

async function handleInteraction(
  env: Env,
  ctx: ExecutionContext,
  request: Request,
): Promise<Response> {
  const signature = request.headers.get("X-Signature-Ed25519");
  const timestamp = request.headers.get("X-Signature-Timestamp");
  const rawBody = await request.text();
  if (!signature || !timestamp) {
    return new Response("missing signature headers", { status: 401 });
  }
  const ok = await verifyDiscordInteraction(
    env.DISCORD_PUBLIC_KEY,
    signature,
    timestamp,
    rawBody,
  );
  if (!ok) return new Response("invalid signature", { status: 401 });

  let interaction: APIInteraction;
  try {
    interaction = JSON.parse(rawBody) as APIInteraction;
  } catch {
    return new Response("invalid body", { status: 400 });
  }

  if (interaction.type === InteractionType.Ping) {
    return jsonResponse(pong());
  }
  if (interaction.type !== InteractionType.ApplicationCommand) {
    return jsonResponse(ephemeral("Unsupported interaction type"));
  }

  const cmd = interaction as APIChatInputApplicationCommandInteraction;
  const name = cmd.data?.name;
  switch (name) {
    case "toban-setup":
      return jsonResponse(await handleTobanSetup(env, cmd));
    case "toban-link":
      return jsonResponse(await handleTobanLink(env, cmd));
    case "balance":
      return jsonResponse(await handleBalance(env, cmd));
    case "thx": {
      // 3-second budget — defer immediately, run real work in background.
      ctx.waitUntil(executeThx(env, cmd));
      return jsonResponse({
        type: InteractionResponseType.DeferredChannelMessageWithSource,
        data: { flags: 1 << 6 /* EPHEMERAL */ },
      });
    }
    default:
      return jsonResponse(deferredEphemeral());
  }
}

export default {
  async fetch(
    request: Request,
    env: Env,
    ctx: ExecutionContext,
  ): Promise<Response> {
    const url = new URL(request.url);
    if (request.method === "POST" && url.pathname === "/discord/interactions") {
      return handleInteraction(env, ctx, request);
    }
    if (request.method === "GET" && url.pathname === "/api/install/callback") {
      return handleInstallCallback(env, request);
    }
    return new Response("not found", { status: 404 });
  },
};
