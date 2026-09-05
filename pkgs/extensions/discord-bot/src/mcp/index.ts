/**
 * `POST /mcp` — the Toban MCP endpoint.
 *
 * Lets any MCP-speaking client drive Toban: our own OpenClaw, a community's
 * existing OpenClaw, Claude Code, anything. Authorisation is a guild-scoped
 * bearer token (`auth.ts`), and writes only ever produce a confirm button
 * (`confirm.ts`) — so an agent we do not run is not a trusted party here.
 */
import type { Env } from "../env";
import { authenticate } from "./auth";
import { handleRpc } from "./protocol";
import { TOOL_DEFINITIONS, callTool } from "./tools";

const SERVER_NAME = "toban";
const SERVER_VERSION = "0.1.0";

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

export async function handleMcpRequest(
  env: Env,
  request: Request,
): Promise<Response> {
  const auth = await authenticate(
    env.MCP_TOKEN_SECRET,
    request.headers.get("authorization"),
  );
  if (!auth.ok) {
    return json({ error: auth.message }, auth.status);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json(
      {
        jsonrpc: "2.0",
        id: null,
        error: { code: -32700, message: "parse error" },
      },
      400,
    );
  }

  const deps = {
    serverName: SERVER_NAME,
    serverVersion: SERVER_VERSION,
    tools: TOOL_DEFINITIONS,
    callTool: (name: string, args: Record<string, unknown>) =>
      callTool(env, auth.guildId, name, args),
  };

  // A client may batch messages into an array; answer in kind.
  if (Array.isArray(body)) {
    const results = await Promise.all(body.map((m) => handleRpc(m, deps)));
    const answers = results.filter((r): r is object => r !== null);
    return answers.length === 0
      ? new Response(null, { status: 202 })
      : json(answers);
  }

  const answer = await handleRpc(body, deps);
  return answer === null ? new Response(null, { status: 202 }) : json(answer);
}
