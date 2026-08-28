import { HATS_QUEST_MODULE_ABI } from "abi/hatsQuestModule";
import {
  type Address,
  type Log,
  encodeAbiParameters,
  encodeEventTopics,
  getAddress,
  parseAbiParameters,
} from "viem";
import { describe, expect, it } from "vitest";
import { extractMyQuestIds } from "./useHatsQuestModule";

const MODULE = "0x1111111111111111111111111111111111111111" as Address;
const OTHER_MODULE = "0x2222222222222222222222222222222222222222" as Address;
const ME = "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa" as Address;
const SOMEONE_ELSE = "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb" as Address;
const WEARER = "0xcccccccccccccccccccccccccccccccccccccccc" as Address;

// Builds the log a real `QuestCreated` emission produces, so the filter is
// exercised against genuine topic encoding rather than a hand-shaped object.
const questCreatedLog = (opts: {
  address: Address;
  questId: bigint;
  creator: Address;
  hatId?: bigint;
}): Log =>
  ({
    address: opts.address,
    topics: encodeEventTopics({
      abi: HATS_QUEST_MODULE_ABI,
      eventName: "QuestCreated",
      args: {
        questId: opts.questId,
        creator: opts.creator,
        hatId: opts.hatId ?? 1n,
      },
    }),
    data: encodeAbiParameters(parseAbiParameters("address, uint256, string"), [
      WEARER,
      100n,
      "ipfs://cid",
    ]),
    blockNumber: 1n,
    blockHash: `0x${"1".repeat(64)}`,
    transactionHash: `0x${"2".repeat(64)}`,
    transactionIndex: 0,
    logIndex: 0,
    removed: false,
  }) as Log;

describe("extractMyQuestIds", () => {
  it("returns the ids in emission order", () => {
    const logs = [1n, 2n, 3n].map((questId) =>
      questCreatedLog({ address: MODULE, questId, creator: ME }),
    );
    expect(extractMyQuestIds(logs, MODULE, ME)).toEqual([1n, 2n, 3n]);
  });

  // The bundle receipt carries every UserOperation the bundler packed, so a
  // co-bundled creator's quest must not be handed back as ours.
  it("drops QuestCreated emitted by another creator", () => {
    const logs = [
      questCreatedLog({ address: MODULE, questId: 7n, creator: SOMEONE_ELSE }),
      questCreatedLog({ address: MODULE, questId: 8n, creator: ME }),
      questCreatedLog({ address: MODULE, questId: 9n, creator: SOMEONE_ELSE }),
    ];
    expect(extractMyQuestIds(logs, MODULE, ME)).toEqual([8n]);
  });

  // Another workspace's quest module emits the identical event signature.
  it("drops QuestCreated emitted by another quest module", () => {
    const logs = [
      questCreatedLog({ address: OTHER_MODULE, questId: 4n, creator: ME }),
      questCreatedLog({ address: MODULE, questId: 5n, creator: ME }),
    ];
    expect(extractMyQuestIds(logs, MODULE, ME)).toEqual([5n]);
  });

  // Receipt logs come back lowercase, but the module address arrives from the
  // subgraph and the creator from the wallet — either can be checksummed.
  it("matches addresses case-insensitively", () => {
    const logs = [
      questCreatedLog({ address: MODULE, questId: 11n, creator: ME }),
    ];
    expect(extractMyQuestIds(logs, getAddress(MODULE), getAddress(ME))).toEqual(
      [11n],
    );
  });

  it("ignores unrelated logs and returns empty when nothing matches", () => {
    const logs = [
      questCreatedLog({ address: MODULE, questId: 1n, creator: SOMEONE_ELSE }),
      {
        address: MODULE,
        topics: [`0x${"f".repeat(64)}`],
        data: "0x",
        blockNumber: 1n,
        blockHash: `0x${"1".repeat(64)}`,
        transactionHash: `0x${"2".repeat(64)}`,
        transactionIndex: 0,
        logIndex: 1,
        removed: false,
      } as Log,
    ];
    expect(extractMyQuestIds(logs, MODULE, ME)).toEqual([]);
  });
});
