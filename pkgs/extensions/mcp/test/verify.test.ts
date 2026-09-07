import { privateKeyToAccount } from "viem/accounts";
import { describe, expect, it } from "vitest";
import {
  MCP_TOKEN_LIST_PRIMARY_TYPE,
  MCP_TOKEN_LIST_TYPES,
  buildMcpTokenDomain,
} from "../src/eip712/mcp-token.js";
import { verifyMcpTokenAuthViaRpc } from "../src/verify.js";
import { TEST_PRIVATE_KEY, makeNonce } from "./fixtures.js";

const CHAIN_ID = 11155111; // sepolia

// A deliberately unreachable RPC URL. This is safe here because viem's
// `verifyTypedData` action recovers the signer address offline first and
// only falls back to an on-chain universal-signature-validator call when
// that recovery doesn't match `address` (EIP-1271 / ERC-6492 path) — for a
// plain EOA signature over the *actual* signed hash, the network call is
// never reached. That is exactly the code path these tests exercise: does
// `verifyMcpTokenAuthViaRpc` compute the hash from the pinned
// types/domain, or from whatever the caller's envelope claims.
const RPC_URL = "https://mcp-verify-test.invalid";

describe("verifyMcpTokenAuthViaRpc — types/domain pinning (finding #6)", () => {
  it("verifies a correctly-signed McpTokenListRequest", async () => {
    const account = privateKeyToAccount(TEST_PRIVATE_KEY);
    const domain = buildMcpTokenDomain(CHAIN_ID);
    const message = {
      wallet: account.address,
      treeId: "42",
      expires: BigInt(Math.floor(Date.now() / 1000) + 300),
      nonce: makeNonce(),
    };
    const typedData = {
      domain,
      types: MCP_TOKEN_LIST_TYPES,
      primaryType: MCP_TOKEN_LIST_PRIMARY_TYPE,
      message,
    } as const;
    const signature = await account.signTypedData(typedData);

    await expect(
      verifyMcpTokenAuthViaRpc(typedData, signature, account.address, RPC_URL),
    ).resolves.toBe(true);
  });

  it("ignores a caller-forged types/domain and still verifies against the pinned constants", async () => {
    const account = privateKeyToAccount(TEST_PRIVATE_KEY);
    const domain = buildMcpTokenDomain(CHAIN_ID);
    const message = {
      wallet: account.address,
      treeId: "42",
      expires: BigInt(Math.floor(Date.now() / 1000) + 300),
      nonce: makeNonce(),
    };
    const realTypedData = {
      domain,
      types: MCP_TOKEN_LIST_TYPES,
      primaryType: MCP_TOKEN_LIST_PRIMARY_TYPE,
      message,
    } as const;
    // Sign the *real* shape only — an attacker who merely captured this
    // signature has no way to produce a valid signature for a different
    // types/domain shape over the same message.
    const signature = await account.signTypedData(realTypedData);

    // Hand the verifier an envelope that lies about its own shape: an extra
    // unsigned domain key, and a `types` object with its field order
    // reversed. Neither should have any effect once `types`/`domain` are
    // pinned rather than read off the input — if `verifyMcpTokenAuthViaRpc`
    // ever again used the caller's `types`/`domain` to compute the struct
    // hash, this would recompute a different digest than the one actually
    // signed, `ecrecover` would return the wrong address, and this
    // assertion would flip to `false`, catching the regression.
    const forgedTypedData = {
      domain: { ...domain, verifyingContract: `0x${"11".repeat(20)}` },
      types: {
        McpTokenListRequest: [
          ...MCP_TOKEN_LIST_TYPES.McpTokenListRequest,
        ].reverse(),
      },
      primaryType: MCP_TOKEN_LIST_PRIMARY_TYPE,
      message,
    } as unknown as typeof realTypedData;

    await expect(
      verifyMcpTokenAuthViaRpc(
        forgedTypedData,
        signature,
        account.address,
        RPC_URL,
      ),
    ).resolves.toBe(true);
  });

  it("rejects a signature that does not match the pinned message/domain", async () => {
    const account = privateKeyToAccount(TEST_PRIVATE_KEY);
    const other = privateKeyToAccount(
      "0x4255eae8014f884ef15131c347774e88433a38c0be42c455cd64714153aca385",
    );
    const domain = buildMcpTokenDomain(CHAIN_ID);
    const message = {
      wallet: account.address,
      treeId: "42",
      expires: BigInt(Math.floor(Date.now() / 1000) + 300),
      nonce: makeNonce(),
    };
    const typedData = {
      domain,
      types: MCP_TOKEN_LIST_TYPES,
      primaryType: MCP_TOKEN_LIST_PRIMARY_TYPE,
      message,
    } as const;
    // Signed by the wrong account for the claimed `expectedAddress`.
    const signature = await other.signTypedData(typedData);

    await expect(
      verifyMcpTokenAuthViaRpc(typedData, signature, account.address, RPC_URL),
    ).resolves.toBe(false);
  });
});
