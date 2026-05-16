import type { Hex } from "viem";
import { beforeEach, describe, expect, it } from "vitest";

import { hashVerifierToken } from "../eip712/identity-binding.js";
import { handleConnect } from "../handlers/connect.js";
import {
  DISCORD_PROVIDER_NAME,
  discordProvider,
} from "../providers/discord.js";
import type { IdentityEnv, ProviderDefinition } from "../providers/types.js";
import { getIdentity } from "../queries.js";
import {
  buildSignedBinding,
  getTestAccount,
  makeEs256Keys,
  makeNonce,
  makeTestDb,
  serialiseConnectBody,
  signDiscordVerifierToken,
} from "./fixtures.js";

const CHAIN_ID = 11155111;

async function setup() {
  const { db } = makeTestDb();
  const keys = await makeEs256Keys();
  const env: IdentityEnv = {
    DISCORD_BOT_VERIFIER_PUBLIC_KEY: keys.publicKeyPem,
  };
  const account = getTestAccount();
  const registry: Record<string, ProviderDefinition> = {
    [discordProvider.name]: discordProvider,
  };
  return { db, keys, env, account, registry };
}

async function happyPath(opts: { accountId?: string } = {}) {
  const ctx = await setup();
  const accountId = opts.accountId ?? "111111111111111111";
  const token = await signDiscordVerifierToken({
    privateKey: ctx.keys.privateKey,
    accountId,
    expSeconds: Math.floor(Date.now() / 1000) + 300,
  });
  const binding = await buildSignedBinding({
    account: ctx.account,
    chainId: CHAIN_ID,
    provider: DISCORD_PROVIDER_NAME,
    accountId,
    verifierToken: token,
  });
  return { ...ctx, token, binding, accountId };
}

function makeRequest(body: string): Request {
  return new Request("https://example.test/api/connect", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body,
  });
}

describe("handlers/connect — happy path", () => {
  it("returns 200 and persists the identity", async () => {
    const ctx = await happyPath();
    const res = await handleConnect(
      makeRequest(
        serialiseConnectBody({
          provider: DISCORD_PROVIDER_NAME,
          verifier_token: ctx.token,
          identity_binding: {
            typedData: ctx.binding.typedData,
            signature: ctx.binding.signature,
          },
        }),
      ),
      { db: ctx.db, env: ctx.env, registry: ctx.registry },
    );
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });

    const row = await getIdentity(ctx.db, DISCORD_PROVIDER_NAME, ctx.accountId);
    expect(row?.wallet).toBe(ctx.account.address);
  });
});

describe("handlers/connect — failure paths", () => {
  let ctx: Awaited<ReturnType<typeof happyPath>>;
  beforeEach(async () => {
    ctx = await happyPath();
  });

  it("400 invalid_body for non-JSON body", async () => {
    const res = await handleConnect(
      new Request("https://example.test/api/connect", {
        method: "POST",
        body: "not json",
      }),
      { db: ctx.db, env: ctx.env, registry: ctx.registry },
    );
    expect(res.status).toBe(400);
    expect(await res.json()).toMatchObject({ error: "invalid_body" });
  });

  it("400 invalid_body for missing fields", async () => {
    const res = await handleConnect(
      makeRequest(JSON.stringify({ provider: "discord" })),
      { db: ctx.db, env: ctx.env, registry: ctx.registry },
    );
    expect(res.status).toBe(400);
    expect(await res.json()).toMatchObject({ error: "invalid_body" });
  });

  it("400 unknown_provider for unregistered provider", async () => {
    const res = await handleConnect(
      makeRequest(
        serialiseConnectBody({
          provider: "slack",
          verifier_token: ctx.token,
          identity_binding: {
            typedData: ctx.binding.typedData,
            signature: ctx.binding.signature,
          },
        }),
      ),
      { db: ctx.db, env: ctx.env, registry: ctx.registry },
    );
    expect(res.status).toBe(400);
    expect(await res.json()).toMatchObject({ error: "unknown_provider" });
  });

  it("400 provider_mismatch when message.provider differs from request.provider", async () => {
    const tampered = await buildSignedBinding({
      account: ctx.account,
      chainId: CHAIN_ID,
      provider: DISCORD_PROVIDER_NAME,
      accountId: ctx.accountId,
      verifierToken: ctx.token,
      providerOverride: "slack",
    });
    const res = await handleConnect(
      makeRequest(
        serialiseConnectBody({
          provider: DISCORD_PROVIDER_NAME,
          verifier_token: ctx.token,
          identity_binding: {
            typedData: tampered.typedData,
            signature: tampered.signature,
          },
        }),
      ),
      { db: ctx.db, env: ctx.env, registry: ctx.registry },
    );
    expect(res.status).toBe(400);
    expect(await res.json()).toMatchObject({ error: "provider_mismatch" });
  });

  it("400 binding_expired when message.expires is past", async () => {
    const past = await buildSignedBinding({
      account: ctx.account,
      chainId: CHAIN_ID,
      provider: DISCORD_PROVIDER_NAME,
      accountId: ctx.accountId,
      verifierToken: ctx.token,
      expires: BigInt(Math.floor(Date.now() / 1000) - 10),
    });
    const res = await handleConnect(
      makeRequest(
        serialiseConnectBody({
          provider: DISCORD_PROVIDER_NAME,
          verifier_token: ctx.token,
          identity_binding: {
            typedData: past.typedData,
            signature: past.signature,
          },
        }),
      ),
      { db: ctx.db, env: ctx.env, registry: ctx.registry },
    );
    expect(res.status).toBe(400);
    expect(await res.json()).toMatchObject({ error: "binding_expired" });
  });

  it("400 verifier_token_hash_mismatch when verifierTokenHash differs from keccak256(token)", async () => {
    const wrongHash = hashVerifierToken("different-token");
    const tampered = await buildSignedBinding({
      account: ctx.account,
      chainId: CHAIN_ID,
      provider: DISCORD_PROVIDER_NAME,
      accountId: ctx.accountId,
      verifierToken: ctx.token,
      verifierTokenHashOverride: wrongHash,
    });
    const res = await handleConnect(
      makeRequest(
        serialiseConnectBody({
          provider: DISCORD_PROVIDER_NAME,
          verifier_token: ctx.token,
          identity_binding: {
            typedData: tampered.typedData,
            signature: tampered.signature,
          },
        }),
      ),
      { db: ctx.db, env: ctx.env, registry: ctx.registry },
    );
    expect(res.status).toBe(400);
    expect(await res.json()).toMatchObject({
      error: "verifier_token_hash_mismatch",
    });
  });

  it("400 verifier_token_invalid when JWT is bogus", async () => {
    const res = await handleConnect(
      makeRequest(
        serialiseConnectBody({
          provider: DISCORD_PROVIDER_NAME,
          verifier_token: "not.a.jwt",
          identity_binding: {
            typedData: {
              ...ctx.binding.typedData,
              message: {
                ...ctx.binding.typedData.message,
                verifierTokenHash: hashVerifierToken("not.a.jwt"),
              },
            },
            // Need a valid sig of the tampered message — easiest: re-sign.
            signature: await ctx.account.signTypedData({
              domain: ctx.binding.typedData.domain,
              types: ctx.binding.typedData.types,
              primaryType: ctx.binding.typedData.primaryType,
              message: {
                ...ctx.binding.typedData.message,
                verifierTokenHash: hashVerifierToken("not.a.jwt"),
              },
            }),
          },
        }),
      ),
      { db: ctx.db, env: ctx.env, registry: ctx.registry },
    );
    expect(res.status).toBe(400);
    expect(await res.json()).toMatchObject({ error: "verifier_token_invalid" });
  });

  it("400 verifier_token_expired when JWT is past exp", async () => {
    const expiredToken = await signDiscordVerifierToken({
      privateKey: ctx.keys.privateKey,
      accountId: ctx.accountId,
      expSeconds: Math.floor(Date.now() / 1000) - 60,
    });
    const expiredHash = hashVerifierToken(expiredToken);
    const binding = await buildSignedBinding({
      account: ctx.account,
      chainId: CHAIN_ID,
      provider: DISCORD_PROVIDER_NAME,
      accountId: ctx.accountId,
      verifierToken: expiredToken,
      verifierTokenHashOverride: expiredHash,
    });
    const res = await handleConnect(
      makeRequest(
        serialiseConnectBody({
          provider: DISCORD_PROVIDER_NAME,
          verifier_token: expiredToken,
          identity_binding: {
            typedData: binding.typedData,
            signature: binding.signature,
          },
        }),
      ),
      { db: ctx.db, env: ctx.env, registry: ctx.registry },
    );
    expect(res.status).toBe(400);
    expect(await res.json()).toMatchObject({ error: "verifier_token_expired" });
  });

  it("400 account_id_mismatch when message.accountId differs from JWT accountId", async () => {
    const tampered = await buildSignedBinding({
      account: ctx.account,
      chainId: CHAIN_ID,
      provider: DISCORD_PROVIDER_NAME,
      accountId: ctx.accountId,
      verifierToken: ctx.token,
      accountIdOverride: "999999999999999999",
    });
    const res = await handleConnect(
      makeRequest(
        serialiseConnectBody({
          provider: DISCORD_PROVIDER_NAME,
          verifier_token: ctx.token,
          identity_binding: {
            typedData: tampered.typedData,
            signature: tampered.signature,
          },
        }),
      ),
      { db: ctx.db, env: ctx.env, registry: ctx.registry },
    );
    expect(res.status).toBe(400);
    expect(await res.json()).toMatchObject({ error: "account_id_mismatch" });
  });

  it("400 wallet_mismatch when signature is by a different wallet", async () => {
    // Sign with the test account, but rewrite the message.wallet field to a
    // different address — recover() will return the signer (test account),
    // which won't match the rewritten wallet field.
    const otherWallet = "0x000000000000000000000000000000000000dEaD" as const;
    const binding = await buildSignedBinding({
      account: ctx.account,
      chainId: CHAIN_ID,
      provider: DISCORD_PROVIDER_NAME,
      accountId: ctx.accountId,
      verifierToken: ctx.token,
      walletOverride: otherWallet,
    });
    const res = await handleConnect(
      makeRequest(
        serialiseConnectBody({
          provider: DISCORD_PROVIDER_NAME,
          verifier_token: ctx.token,
          identity_binding: {
            typedData: binding.typedData,
            signature: binding.signature,
          },
        }),
      ),
      { db: ctx.db, env: ctx.env, registry: ctx.registry },
    );
    expect(res.status).toBe(400);
    expect(await res.json()).toMatchObject({ error: "wallet_mismatch" });
  });

  it("400 nonce_reused when the same nonce is replayed", async () => {
    // First call succeeds.
    const reusedNonce = makeNonce();
    const binding1 = await buildSignedBinding({
      account: ctx.account,
      chainId: CHAIN_ID,
      provider: DISCORD_PROVIDER_NAME,
      accountId: ctx.accountId,
      verifierToken: ctx.token,
      nonce: reusedNonce,
    });
    const res1 = await handleConnect(
      makeRequest(
        serialiseConnectBody({
          provider: DISCORD_PROVIDER_NAME,
          verifier_token: ctx.token,
          identity_binding: {
            typedData: binding1.typedData,
            signature: binding1.signature,
          },
        }),
      ),
      { db: ctx.db, env: ctx.env, registry: ctx.registry },
    );
    expect(res1.status).toBe(200);

    // Second call with a fresh signature but the same nonce should fail.
    const binding2 = await buildSignedBinding({
      account: ctx.account,
      chainId: CHAIN_ID,
      provider: DISCORD_PROVIDER_NAME,
      accountId: ctx.accountId,
      verifierToken: ctx.token,
      nonce: reusedNonce,
    });
    const res2 = await handleConnect(
      makeRequest(
        serialiseConnectBody({
          provider: DISCORD_PROVIDER_NAME,
          verifier_token: ctx.token,
          identity_binding: {
            typedData: binding2.typedData,
            signature: binding2.signature,
          },
        }),
      ),
      { db: ctx.db, env: ctx.env, registry: ctx.registry },
    );
    expect(res2.status).toBe(400);
    expect(await res2.json()).toMatchObject({ error: "nonce_reused" });
  });

  it("400 wallet_mismatch when signature is malformed", async () => {
    const bogusSig = `0x${"00".repeat(65)}` as Hex;
    const res = await handleConnect(
      makeRequest(
        serialiseConnectBody({
          provider: DISCORD_PROVIDER_NAME,
          verifier_token: ctx.token,
          identity_binding: {
            typedData: ctx.binding.typedData,
            signature: bogusSig,
          },
        }),
      ),
      { db: ctx.db, env: ctx.env, registry: ctx.registry },
    );
    expect(res.status).toBe(400);
    expect(await res.json()).toMatchObject({ error: "wallet_mismatch" });
  });
});
