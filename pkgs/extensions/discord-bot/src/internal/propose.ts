/**
 * `POST /internal/propose` — the one seam `@toban/mcp` crosses into this
 * package (`docs/mcp-extraction.md` §3).
 *
 * This is the body of what used to be `proposeTool` in this package's own
 * `src/mcp/tools.ts` (now `@toban/mcp`'s `src/tools.ts`), moved here so that
 * `ConfirmPayload` — and everything
 * that touches it (`buildConfirmMessage`, `discord-rest`) — stays in one
 * package. `@toban/mcp`'s propose tools are thin forwarders that build an
 * `InternalProposeRequest` and call this endpoint over the `CONFIRM` service
 * binding; they never see a `ConfirmPayload`.
 *
 * **The workspace check is reversed from the old guild-scoped design.**
 * `tbn1` tokens pinned a `guildId`, so the old check was "does the token's
 * guild match the channel's guild". `tbn2` tokens pin a `treeId`, so this
 * endpoint has to go the other way:
 *
 *   channelId --(rest.getChannelGuildId)--> guildId
 *             --(identity.getPlatformLink)--> treeId'
 *             treeId' === request.treeId ?
 *
 * Same strength as before (a channel still can't be pointed at another
 * workspace's token), just walked in the opposite direction. And because
 * this endpoint resolves `guildId` itself, `ConfirmPayload.guildId` is now
 * always a value discord-bot determined — never one that arrived in a
 * request body — which is strictly safer than the old flow.
 *
 * Authorization here is a **shared secret** (`x-toban-mcp-propose-secret`),
 * not the MCP bearer token — this route is reached over the `CONFIRM`
 * service binding, but a service binding does not stop the same request
 * from also being reachable at this Worker's public `workers.dev` URL. The
 * secret is what actually closes that path off from anyone who is not
 * `@toban/mcp`. (This is not spelled out in `docs/mcp-extraction.md`'s
 * secrets table — see this package's CLAUDE.md for why it was added.)
 */
import { isAddress, parseEther } from "viem";
import type { Env } from "../env.js";
import { type IdentityClient, createIdentityClient } from "../identity.js";
import { buildConfirmMessage } from "../mcp/confirm.js";
import { type DiscordRest, createDiscordRest } from "../mcp/discord-rest.js";

export type InternalProposeRequest =
  | {
      kind: "thx";
      /** The MCP token's home workspace — never a value the tool caller can widen. */
      treeId: string;
      channelId: string;
      forDiscordUserId: string;
      toDiscordUserId?: string;
      toAddress?: string;
      amount: number;
      message?: string;
    }
  | {
      kind: "quest";
      treeId: string;
      channelId: string;
      forDiscordUserId: string;
      questId: string;
    };

export type InternalProposeResponse =
  | { ok: true; messageId: string }
  | { ok: false; error: string };

export interface InternalProposeDeps {
  rest?: DiscordRest;
  identity?: IdentityClient;
}

function json(body: InternalProposeResponse, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function parseRequest(raw: unknown): InternalProposeRequest | null {
  if (typeof raw !== "object" || raw === null) return null;
  const r = raw as Record<string, unknown>;
  if (
    typeof r.treeId !== "string" ||
    typeof r.channelId !== "string" ||
    typeof r.forDiscordUserId !== "string"
  ) {
    return null;
  }
  if (r.kind === "thx") {
    if (typeof r.amount !== "number") return null;
    return {
      kind: "thx",
      treeId: r.treeId,
      channelId: r.channelId,
      forDiscordUserId: r.forDiscordUserId,
      toDiscordUserId:
        typeof r.toDiscordUserId === "string" ? r.toDiscordUserId : undefined,
      toAddress: typeof r.toAddress === "string" ? r.toAddress : undefined,
      amount: r.amount,
      message: typeof r.message === "string" ? r.message : undefined,
    };
  }
  if (r.kind === "quest") {
    if (typeof r.questId !== "string") return null;
    return {
      kind: "quest",
      treeId: r.treeId,
      channelId: r.channelId,
      forDiscordUserId: r.forDiscordUserId,
      questId: r.questId,
    };
  }
  return null;
}

/**
 * `POST /internal/propose` handler. Mounted by `src/index.ts` behind the
 * `x-toban-mcp-propose-secret` check — see the module doc above for why
 * that check exists even though this route is meant to be reached only via
 * the `CONFIRM` service binding.
 */
export async function handleInternalPropose(
  env: Env,
  request: Request,
  deps: InternalProposeDeps = {},
): Promise<Response> {
  if (
    !env.MCP_INTERNAL_PROPOSE_SECRET ||
    request.headers.get("x-toban-mcp-propose-secret") !==
      env.MCP_INTERNAL_PROPOSE_SECRET
  ) {
    return json({ ok: false, error: "unauthorized" }, 401);
  }

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return json({ ok: false, error: "invalid request body" }, 400);
  }
  const req = parseRequest(raw);
  if (!req) {
    return json({ ok: false, error: "invalid request body" }, 400);
  }

  const rest = deps.rest ?? createDiscordRest(env.DISCORD_BOT_TOKEN);
  const identity = deps.identity ?? createIdentityClient(env);

  const guildId = await rest.getChannelGuildId(req.channelId);
  if (!guildId) {
    return json({
      ok: false,
      error: "指定されたチャンネルが見つからないか、Bot から見えません。",
    });
  }

  // Reversed workspace check (see module doc): the channel's guild must map
  // back to the same treeId the token is scoped to.
  const link = await identity.getPlatformLink("discord", guildId);
  if (!link) {
    return json({
      ok: false,
      error:
        "このチャンネルの Discord サーバーは Toban ワークスペースに連携されていません。",
    });
  }
  if (link.treeId !== req.treeId) {
    return json({
      ok: false,
      error: "指定されたチャンネルはこのワークスペースのものではありません。",
    });
  }

  if (req.kind === "thx") {
    if (!Number.isInteger(req.amount) || req.amount <= 0) {
      return json({
        ok: false,
        error: "amount には 1 以上の整数を指定してください。",
      });
    }
    if (!req.toDiscordUserId && !req.toAddress) {
      return json({
        ok: false,
        error: "toDiscordUserId か toAddress のどちらかが必要です。",
      });
    }
    if (
      req.toAddress &&
      !req.toAddress.endsWith(".eth") &&
      !isAddress(req.toAddress)
    ) {
      return json({
        ok: false,
        error: `アドレスの形式が正しくありません: ${req.toAddress}`,
      });
    }
    // Validates only; the confirm-button path re-parses from the payload so
    // the two can never disagree about the scale.
    parseEther(String(req.amount));

    const posted = await rest.postMessage(
      req.channelId,
      buildConfirmMessage({
        kind: "thx",
        guildId,
        forUser: req.forDiscordUserId,
        target: req.toDiscordUserId
          ? { user: req.toDiscordUserId }
          : { address: req.toAddress as string },
        amount: String(req.amount),
        message: req.message ?? "",
      }),
    );
    if (!posted) {
      return json({
        ok: false,
        error: "確認メッセージを投稿できませんでした。",
      });
    }
    return json({ ok: true, messageId: posted.id });
  }

  if (!/^\d+$/.test(req.questId)) {
    return json({
      ok: false,
      error: "questId には 10 進数の文字列を指定してください。",
    });
  }
  const posted = await rest.postMessage(
    req.channelId,
    buildConfirmMessage({
      kind: "quest",
      guildId,
      forUser: req.forDiscordUserId,
      questId: req.questId,
      questLabel: `${env.TOBAN_FRONTEND_URL}/${req.treeId}/quest/${req.questId}`,
    }),
  );
  if (!posted) {
    return json({ ok: false, error: "確認メッセージを投稿できませんでした。" });
  }
  return json({ ok: true, messageId: posted.id });
}
