import { CID } from "multiformats/cid";
import * as Digest from "multiformats/hashes/digest";
import { bytesToHex, hexToBytes } from "viem";

// HatsQuestModule stores quest metadata as `bytes32 metadataHash` (the
// multihash digest of the IPFS object). We decode any CID (v0 or v1) to its
// 32-byte sha2-256 digest and reconstruct a CIDv1 with the raw codec on read.
//
// Why raw / CIDv1 and not CIDv0: Pinata's v3 upload endpoint stores JSON
// objects as single raw blocks (CIDv1, codec 0x55), so the `cid` it returns
// looks like `bafkrei…`. The IPFS gateway routes by the *whole* CID (codec
// included), not just the multihash, so a `Qm…` (CIDv0 forces dag-pb codec
// 0x70) reconstructed from the same digest does **not** resolve to the same
// block and the gateway returns 500. Pinning a raw block under a dag-pb CID
// is not equivalent — it's a different content addresss.

const SHA2_256 = 0x12;
const RAW_CODEC = 0x55;

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
  return CID.createV1(RAW_CODEC, digest).toString();
};
