import { CID } from "multiformats/cid";
import * as Digest from "multiformats/hashes/digest";
import { bytesToHex, hexToBytes } from "viem";

// HatsQuestModule stores quest metadata as `bytes32 metadataHash` (the
// multihash digest of the IPFS object). We decode any CID (v0 or v1) to its
// 32-byte sha2-256 digest and reconstruct a CIDv0 ("Qm…") on read — the
// Pinata gateway resolves equivalent content under either version, since the
// underlying multihash is identical.

const SHA2_256 = 0x12;

export const cidToBytes32 = (cidStr: string): `0x${string}` => {
  const cid = CID.parse(cidStr);
  if (cid.multihash.code !== SHA2_256) {
    throw new Error(
      `cidToBytes32: only sha2-256 multihashes are supported (got code ${cid.multihash.code})`,
    );
  }
  if (cid.multihash.digest.length !== 32) {
    throw new Error(
      `cidToBytes32: expected 32-byte digest (got ${cid.multihash.digest.length})`,
    );
  }
  return bytesToHex(cid.multihash.digest);
};

export const bytes32ToCid = (hash: `0x${string}`): string => {
  const digest = Digest.create(SHA2_256, hexToBytes(hash));
  return CID.createV0(digest).toString();
};
