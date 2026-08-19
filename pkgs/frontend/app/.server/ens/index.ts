import { createNamespaceProvider } from "./namespace";
import { NameApiError, type NameProvider } from "./provider";

export { NameApiError } from "./provider";
export type { NameProvider, UpsertNameParams } from "./provider";

const DEFAULT_PARENT_NAME = "toban.eth";
const DEFAULT_TIMEOUT_MS = 8_000;

const readMode = (): "mainnet" | "sepolia" => {
  const mode = process.env.NAMESPACE_MODE;
  if (mode === "sepolia") return "sepolia";
  if (mode === undefined || mode === "mainnet") return "mainnet";
  throw new NameApiError(
    500,
    `NAMESPACE_MODE must be "mainnet" or "sepolia", got "${mode}"`,
  );
};

const readTimeoutMs = (): number => {
  const raw = process.env.NAMESPACE_TIMEOUT_MS;
  if (!raw) return DEFAULT_TIMEOUT_MS;
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_TIMEOUT_MS;
};

/** The parent domain every Toban subname hangs off, e.g. `toban.eth`. */
export const getParentName = (): string =>
  process.env.ENS_PARENT_NAME || DEFAULT_PARENT_NAME;

let cached: NameProvider | undefined;

/**
 * Build (once) the provider backing `/api/ens/*`.
 *
 * Resolved lazily rather than at module load so a missing API key surfaces as
 * a 503 on the one route that needs it, instead of taking down every server
 * render.
 */
export const getNameProvider = (): NameProvider => {
  if (cached) return cached;

  const apiKey = process.env.NAMESPACE_API_KEY;
  if (!apiKey) {
    throw new NameApiError(
      503,
      "NAMESPACE_API_KEY is not configured; ENS name resolution is unavailable",
    );
  }

  cached = createNamespaceProvider({
    apiKey,
    parentName: getParentName(),
    mode: readMode(),
    timeoutMs: readTimeoutMs(),
  });
  return cached;
};
