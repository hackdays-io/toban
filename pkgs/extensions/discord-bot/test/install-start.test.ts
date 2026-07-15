import { jwtVerify } from "jose";
import { describe, expect, it } from "vitest";
import { handleInstallStart } from "../src/api/install/start";
import type { Env } from "../src/env";

const SECRET = "test-install-state-secret-hs256";

// Only the fields handleInstallStart touches; the rest of Env is irrelevant.
const env = {
  INSTALL_STATE_SECRET: SECRET,
  BOT_WORKER_URL: "https://bot.example.workers.dev",
  DISCORD_APP_ID: "1234567890",
} as unknown as Env;

function callStart(treeId: string | null): Promise<Response> {
  const url =
    treeId === null
      ? "https://bot.example.workers.dev/api/install/start"
      : `https://bot.example.workers.dev/api/install/start?treeId=${treeId}`;
  return handleInstallStart(env, new Request(url));
}

describe("handleInstallStart", () => {
  it("rejects a missing treeId with 400", async () => {
    const res = await callStart(null);
    expect(res.status).toBe(400);
  });

  it("rejects a non-decimal treeId with 400", async () => {
    const res = await callStart("0xabc");
    expect(res.status).toBe(400);
  });

  it("redirects to Discord OAuth with a verifiable state JWT", async () => {
    const res = await callStart("1888");
    expect(res.status).toBe(302);

    const location = res.headers.get("location");
    expect(location).toBeTruthy();
    const authorize = new URL(location as string);
    expect(authorize.origin + authorize.pathname).toBe(
      "https://discord.com/api/oauth2/authorize",
    );
    expect(authorize.searchParams.get("client_id")).toBe("1234567890");
    expect(authorize.searchParams.get("scope")).toBe(
      "bot applications.commands",
    );
    expect(authorize.searchParams.get("response_type")).toBe("code");
    expect(authorize.searchParams.get("redirect_uri")).toBe(
      "https://bot.example.workers.dev/api/install/callback",
    );

    // The state must be a JWT this Worker's secret can verify, and carry the
    // treeId + a jti (the callback single-use claims the jti). Crucially it
    // does NOT pin a guild — the admin picks that on Discord's consent screen.
    const state = authorize.searchParams.get("state");
    expect(state).toBeTruthy();
    const { payload } = await jwtVerify(
      state as string,
      new TextEncoder().encode(SECRET),
      { issuer: "toban-discord-bot", algorithms: ["HS256"] },
    );
    expect(payload.treeId).toBe("1888");
    expect(typeof payload.jti).toBe("string");
    expect((payload.jti as string).length).toBeGreaterThan(0);
    expect(payload.guild_id).toBeUndefined();
    expect(payload.guildId).toBeUndefined();
  });

  it("mints a fresh jti per call (single-use replay protection)", async () => {
    const decodeJti = async (res: Response) => {
      const loc = new URL(res.headers.get("location") as string);
      const { payload } = await jwtVerify(
        loc.searchParams.get("state") as string,
        new TextEncoder().encode(SECRET),
        { issuer: "toban-discord-bot", algorithms: ["HS256"] },
      );
      return payload.jti as string;
    };
    const [a, b] = await Promise.all([callStart("1888"), callStart("1888")]);
    expect(await decodeJti(a)).not.toBe(await decodeJti(b));
  });
});
