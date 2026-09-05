/**
 * Minimal MCP server over JSON-RPC 2.0 / HTTP.
 *
 * Only what a tool-using client needs: `initialize`, `tools/list`,
 * `tools/call`, `ping`, and the `notifications/*` no-ops. No SSE, no
 * resources, no prompts — a Worker has no long-lived connection to hold open,
 * and every Toban tool is a request/response.
 *
 * Transport note: clients configured with `transport: "streamable-http"` POST
 * a single JSON-RPC message and accept a single JSON response, which is what
 * this returns. Notifications (no `id`) get HTTP 202 with an empty body.
 */

export interface JsonRpcRequest {
  jsonrpc: "2.0";
  id?: string | number | null;
  method: string;
  params?: Record<string, unknown>;
}

export interface ToolDefinition {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
}

/** What a tool handler returns; `isError` maps to MCP's tool-level error. */
export interface ToolResult {
  text: string;
  isError?: boolean;
}

export interface ProtocolDeps {
  serverName: string;
  serverVersion: string;
  tools: ToolDefinition[];
  callTool(name: string, args: Record<string, unknown>): Promise<ToolResult>;
}

/** Latest revision we implement; used when a client sends nothing usable. */
const DEFAULT_PROTOCOL_VERSION = "2025-06-18";

export const JSON_RPC_ERRORS = {
  parse: -32700,
  invalidRequest: -32600,
  methodNotFound: -32601,
  invalidParams: -32602,
  internal: -32603,
} as const;

function result(id: JsonRpcRequest["id"], value: unknown) {
  return { jsonrpc: "2.0" as const, id: id ?? null, result: value };
}

function error(id: JsonRpcRequest["id"], code: number, message: string) {
  return { jsonrpc: "2.0" as const, id: id ?? null, error: { code, message } };
}

/**
 * Handle one JSON-RPC message.
 *
 * Returns `null` for notifications (the caller answers 202). Tool failures
 * come back as a *successful* JSON-RPC result carrying `isError: true` — MCP
 * distinguishes "the tool ran and refused" from "the protocol broke", and
 * collapsing the two makes clients retry things they should not.
 */
export async function handleRpc(
  message: unknown,
  deps: ProtocolDeps,
): Promise<object | null> {
  if (
    typeof message !== "object" ||
    message === null ||
    (message as JsonRpcRequest).jsonrpc !== "2.0" ||
    typeof (message as JsonRpcRequest).method !== "string"
  ) {
    return error(null, JSON_RPC_ERRORS.invalidRequest, "invalid JSON-RPC 2.0");
  }
  const req = message as JsonRpcRequest;
  const isNotification = req.id === undefined || req.id === null;

  if (req.method.startsWith("notifications/")) return null;

  switch (req.method) {
    case "initialize": {
      const requested = req.params?.protocolVersion;
      return result(req.id, {
        protocolVersion:
          typeof requested === "string" ? requested : DEFAULT_PROTOCOL_VERSION,
        capabilities: { tools: { listChanged: false } },
        serverInfo: { name: deps.serverName, version: deps.serverVersion },
      });
    }
    case "ping":
      return result(req.id, {});
    case "tools/list":
      return result(req.id, { tools: deps.tools });
    case "tools/call": {
      const name = req.params?.name;
      if (typeof name !== "string") {
        return error(req.id, JSON_RPC_ERRORS.invalidParams, "name is required");
      }
      const args =
        (req.params?.arguments as Record<string, unknown> | undefined) ?? {};
      try {
        const out = await deps.callTool(name, args);
        return result(req.id, {
          content: [{ type: "text", text: out.text }],
          isError: out.isError === true,
        });
      } catch (err) {
        // An unexpected throw is a server fault, not a tool refusal. Log the
        // detail; hand the client something it can surface without leaking
        // internals.
        console.error(`mcp tool ${name} threw:`, err);
        return error(req.id, JSON_RPC_ERRORS.internal, "tool execution failed");
      }
    }
    default:
      if (isNotification) return null;
      return error(
        req.id,
        JSON_RPC_ERRORS.methodNotFound,
        `unknown method: ${req.method}`,
      );
  }
}
