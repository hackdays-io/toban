/**
 * `POST /mcp` — the Toban MCP endpoint.
 *
 * Moved from `@toban/discord-bot`'s `src/mcp/index.ts` (`docs/mcp-extraction.md`
 * §3, §8). Lets any MCP-speaking client drive Toban: our own OpenClaw, a
 * community's existing OpenClaw, Claude Code, anything. Authorisation is a
 * `tbn2` bearer token pinning a home `treeId` (`auth.ts`), and writes only
 * ever produce a confirm button by forwarding to `@toban/discord-bot`
 * (`tools.ts`) — so an agent we do not run is not a trusted party here.
 */
import { drizzle } from "drizzle-orm/d1";
import { authenticate } from "./auth.js";
import type { Env } from "./env.js";
import { json } from "./http.js";
import { handleRpc } from "./protocol.js";
import { getToken } from "./registry.js";
import { TOOL_DEFINITIONS, callTool } from "./tools.js";

const SERVER_NAME = "toban";
const SERVER_VERSION = "0.2.0";

export async function handleMcpRequest(
  env: Env,
  request: Request,
): Promise<Response> {
  const db = drizzle(env.DB);
  const auth = await authenticate(
    env.MCP_TOKEN_SECRET,
    request.headers.get("authorization"),
    async (tokenId) => {
      const row = await getToken(db, tokenId);
      if (!row) return null;
      return { treeId: row.treeId, revoked: row.revokedAt !== null };
    },
  );
  if (!auth.ok) {
    return json(auth.status, { error: auth.message });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json(400, {
      jsonrpc: "2.0",
      id: null,
      error: { code: -32700, message: "parse error" },
    });
  }

  const deps = {
    serverName: SERVER_NAME,
    serverVersion: SERVER_VERSION,
    tools: TOOL_DEFINITIONS,
    callTool: (name: string, args: Record<string, unknown>) =>
      callTool(env, auth, name, args),
  };

  // A client may batch messages into an array; answer in kind.
  if (Array.isArray(body)) {
    const results = await Promise.all(body.map((m) => handleRpc(m, deps)));
    const answers = results.filter((r): r is object => r !== null);
    return answers.length === 0
      ? new Response(null, { status: 202 })
      : json(200, answers);
  }

  const answer = await handleRpc(body, deps);
  return answer === null
    ? new Response(null, { status: 202 })
    : json(200, answer);
}
