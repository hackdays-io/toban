/**
 * Local development helper for @toban/identity.
 *
 * Generates a P-256 verifier keypair (stored under `.dev-keys/`) on first
 * run and writes the matching SPKI public key into `.dev.vars` so
 * `wrangler dev` picks it up as `DISCORD_BOT_VERIFIER_PUBLIC_KEY`. Then
 * issues an ES256 `verifier_token` JWT for the supplied Discord snowflake
 * so a developer can paste it into `/connect/discord?token=…` and exercise
 * the full signing flow without running the bot worker.
 *
 * Usage:
 *   pnpm identity dev-token --snowflake 1234567890
 *   pnpm identity dev-token --snowflake 1234567890 --ttl 600   # seconds
 *
 * The private key never leaves the local filesystem; commit-ignore is
 * enforced by `pkgs/extensions/identity/.gitignore`.
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  SignJWT,
  exportPKCS8,
  exportSPKI,
  generateKeyPair,
  importPKCS8,
} from "jose";

const ALG = "ES256";
const ISSUER = "toban-discord-bot";
const PROVIDER = "discord";

const here = dirname(fileURLToPath(import.meta.url));
const pkgRoot = resolve(here, "..");
const keysDir = resolve(pkgRoot, ".dev-keys");
const privatePath = resolve(keysDir, "verifier-private.pem");
const publicPath = resolve(keysDir, "verifier-public.pem");
const devVarsPath = resolve(pkgRoot, ".dev.vars");

// Match the Alchemy URL the frontend (`pkgs/frontend/hooks/useViem.ts`) uses
// for Sepolia so dev signs and verifies against the same RPC. Override via
// IDENTITY_DEV_RPC_URL if you want a different provider.
const DEFAULT_RPC_URL =
  process.env.IDENTITY_DEV_RPC_URL ??
  `https://eth-sepolia.g.alchemy.com/v2/${process.env.VITE_ALCHEMY_KEY ?? ""}`;

async function ensureKeys(): Promise<{ pkcs8: string; spki: string }> {
  if (existsSync(privatePath) && existsSync(publicPath)) {
    return {
      pkcs8: readFileSync(privatePath, "utf-8"),
      spki: readFileSync(publicPath, "utf-8"),
    };
  }
  mkdirSync(keysDir, { recursive: true });
  const { privateKey, publicKey } = await generateKeyPair(ALG, {
    extractable: true,
  });
  const pkcs8 = await exportPKCS8(privateKey);
  const spki = await exportSPKI(publicKey);
  writeFileSync(privatePath, pkcs8, { mode: 0o600 });
  writeFileSync(publicPath, spki, { mode: 0o644 });
  // Newline-escaped for .dev.vars (wrangler reads KEY="value" lines).
  const escapedSpki = spki.replace(/\n/g, "\\n");
  const lines = [
    `DISCORD_BOT_VERIFIER_PUBLIC_KEY="${escapedSpki}"`,
    `RPC_URL="${DEFAULT_RPC_URL}"`,
  ];
  writeFileSync(devVarsPath, `${lines.join("\n")}\n`);
  console.error(
    `Generated verifier keypair under ${keysDir} and wrote ${devVarsPath}.`,
  );
  if (!process.env.VITE_ALCHEMY_KEY && !process.env.IDENTITY_DEV_RPC_URL) {
    console.error(
      "warning: VITE_ALCHEMY_KEY is not set in the environment, so RPC_URL in .dev.vars is incomplete. " +
        "Either export VITE_ALCHEMY_KEY before re-running, or edit .dev.vars manually to point at a Sepolia RPC.",
    );
  }
  return { pkcs8, spki };
}

function parseArgs(): {
  snowflake: string;
  ttlSeconds: number;
  treeId: string | undefined;
  frontendUrl: string;
} {
  const args = process.argv.slice(2);
  let snowflake: string | undefined;
  let ttl = 15 * 60;
  let treeId: string | undefined;
  let frontendUrl =
    process.env.TOBAN_DEV_FRONTEND_URL ?? "http://localhost:5173";
  for (let i = 0; i < args.length; i += 1) {
    if (args[i] === "--snowflake") snowflake = args[++i];
    else if (args[i] === "--ttl") ttl = Number.parseInt(args[++i], 10);
    else if (args[i] === "--tree-id") treeId = args[++i];
    else if (args[i] === "--frontend") frontendUrl = args[++i];
  }
  if (!snowflake) {
    console.error(
      "usage: dev-token --snowflake <discord snowflake> [--tree-id <id>] [--ttl <seconds>] [--frontend <url>]",
    );
    process.exit(2);
  }
  return { snowflake, ttlSeconds: ttl, treeId, frontendUrl };
}

async function main(): Promise<void> {
  const { snowflake, ttlSeconds, treeId, frontendUrl } = parseArgs();
  const { pkcs8 } = await ensureKeys();
  const privateKey = await importPKCS8(pkcs8, ALG);
  const now = Math.floor(Date.now() / 1000);
  const token = await new SignJWT({
    provider: PROVIDER,
    accountId: snowflake,
  })
    .setProtectedHeader({ alg: ALG })
    .setIssuer(ISSUER)
    .setIssuedAt(now)
    .setExpirationTime(now + ttlSeconds)
    .sign(privateKey);

  // stdout: bare token (so `... | xargs` or `$(...)` works).
  console.log(token);

  // stderr: human-friendly URL to copy. Putting it last keeps it next to the
  // prompt in a tty so it's easy to spot/paste.
  console.error(
    `\nToken issued for snowflake=${snowflake}, ttl=${ttlSeconds}s.`,
  );
  const base = frontendUrl.replace(/\/$/, "");
  const url = treeId
    ? `${base}/connect/discord?token=${token}&treeId=${encodeURIComponent(treeId)}`
    : `${base}/connect/discord?token=${token}`;
  console.error("\nOpen in browser (one line):");
  console.error(url);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
