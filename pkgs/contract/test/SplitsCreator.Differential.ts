/**
 * Differential test: SplitsCreator.preview vs the Lean reference model.
 *
 * The vectors are generated from the uint256 model in pkgs/spec (Spec/SplitsCreator/Contract.lean) by
 * `pnpm spec vectors`. Every principle SPL-n is proven for the model in
 * Spec/SplitsCreator/Theorems.lean; this test shows the Solidity code computes
 * the same thing as the model, so the principles carry over to the contract
 * (on the inputs covered here).
 *
 * Each case feeds SplitsCreator exactly the model's inputs through data mocks
 * (contracts/splitscreator/mock/SplitsCreatorDataMocks.sol), clones it through
 * SplitsCreatorFactory like BigBang does, then compares the
 * recipients, allocations and totalAllocation — or that it reverts with the
 * same panic (0x11 overflow / 0x12 division by zero) as the model.
 */
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { type Address, zeroAddress, zeroHash } from "viem";
import { viem } from "../helpers/connection";
import { deployCreate2Deployer } from "../helpers/deploy/Create2Factory";
import {
  deploySplitsCreator,
  deploySplitsCreatorFactory,
} from "../helpers/deploy/Splits";
import { expect } from "../helpers/test/chai";

type Holder = { addr: Address; balance: string; escrow: string };
type Wearer = {
  self: Holder;
  elapsed: string;
  supply: string;
  others: Holder[];
};
type Role = {
  hatId: string;
  multiplierTop: string;
  multiplierBottom: string;
  wearers: Wearer[];
};
type Vector = {
  name: string;
  input: {
    modules: { timeFrame: boolean; quest: boolean };
    weights: Record<
      | "roleWeight"
      | "thanksTokenWeight"
      | "thanksTokenReceivedWeight"
      | "thanksTokenSentWeight",
      string
    >;
    participants: { addr: Address; balance: string; minted: string }[];
    roles: Role[];
  };
  expected:
    | {
        recipients: Address[];
        allocations: string[];
        totalAllocation: string;
      }
    | { revert: "overflow" | "divZero" };
};

// viem's messages for Solidity panics 0x11 and 0x12.
const panicMessage = {
  overflow: /Arithmetic operation resulted in underflow or overflow/,
  divZero: /Division or modulo by zero/,
};

const vectorsPath = createRequire(import.meta.url).resolve(
  "@toban/spec/vectors/splits-creator.json",
);
const { cases } = JSON.parse(readFileSync(vectorsPath, "utf8")) as {
  cases: Vector[];
};

const big = (s: string) => BigInt(s);

describe("[SPL-1][SPL-2][SPL-3][SPL-4][SPL-5][SPL-6][SPL-7][SPL-8] SplitsCreator.preview matches the Lean model (differential)", () => {
  // The production clone path: SplitsCreatorFactory with this test as BigBang.
  let factory: Awaited<
    ReturnType<typeof deploySplitsCreatorFactory>
  >["SplitsCreatorFactory"];

  before(async () => {
    const { Create2Deployer } = await deployCreate2Deployer();
    const { SplitsCreator } = await deploySplitsCreator(
      Create2Deployer.address,
    );
    ({ SplitsCreatorFactory: factory } = await deploySplitsCreatorFactory(
      SplitsCreator.address,
      Create2Deployer.address,
    ));
    const [deployer] = await viem.getWalletClients();
    await factory.write.setBigBang([deployer.account.address]);
  });

  it("has vectors for edge cases and generated cases", () => {
    expect(cases.length).to.be.greaterThan(100);
    for (const kind of ["overflow", "divZero"]) {
      expect(
        cases.some((c) => "revert" in c.expected && c.expected.revert === kind),
      ).to.equal(true);
    }
  });

  for (const [index, c] of cases.entries()) {
    it(c.name, async () => {
      const { modules, weights, participants, roles } = c.input;

      const thanks = await viem.deployContract("ThanksTokenDataMock");
      const fraction = await viem.deployContract("FractionTokenDataMock");
      const timeFrame = modules.timeFrame
        ? await viem.deployContract("TimeFrameDataMock")
        : undefined;
      const quest = modules.quest
        ? await viem.deployContract("QuestDataMock")
        : undefined;

      await thanks.write.setParticipants([
        participants.map((p) => p.addr),
        participants.map((p) => big(p.balance)),
        participants.map((p) => big(p.minted)),
      ]);

      for (const role of roles) {
        const hatId = big(role.hatId);
        for (const w of role.wearers) {
          const holders = [w.self, ...w.others];
          // Shape getTokenRecipients like HatsFractionTokenModule: empty until
          // shares are moved, then the wearer plus every holder. The quest
          // module, when present, is listed too (it escrows shares) and must
          // be skipped by SplitsCreator.
          const recipients: Address[] = [
            ...(w.others.length > 0 || quest ? holders.map((h) => h.addr) : []),
            ...(quest ? [quest.address] : []),
          ];
          await fraction.write.setWearer([
            hatId,
            w.self.addr,
            big(w.supply),
            recipients,
            holders.map((h) => h.addr),
            holders.map((h) => big(h.balance)),
          ]);
          if (timeFrame) {
            await timeFrame.write.setElapsed([
              w.self.addr,
              hatId,
              big(w.elapsed),
            ]);
          }
          if (quest) {
            for (const h of holders) {
              await quest.write.setEscrow([
                h.addr,
                hatId,
                w.self.addr,
                big(h.escrow),
              ]);
            }
          }
        }
      }

      const cloneArgs = [
        BigInt(index), // topHatId: only part of the clone salt
        zeroAddress, // Hats: not read by preview
        zeroAddress, // SplitFactoryV2: not read by preview
        timeFrame?.address ?? zeroAddress,
        fraction.address,
        thanks.address,
        quest?.address ?? zeroAddress,
        zeroHash,
      ] as const;
      await factory.write.createSplitCreatorDeterministic(cloneArgs);
      const splitsCreator = await viem.getContractAt(
        "SplitsCreator",
        await factory.read.predictDeterministicAddress(cloneArgs),
      );

      const splitsInfo = roles.map((r) => ({
        hatId: big(r.hatId),
        multiplierTop: big(r.multiplierTop),
        multiplierBottom: big(r.multiplierBottom),
        wearers: r.wearers.map((w) => w.self.addr),
      }));
      const weightsInfo = {
        roleWeight: big(weights.roleWeight),
        thanksTokenWeight: big(weights.thanksTokenWeight),
        thanksTokenReceivedWeight: big(weights.thanksTokenReceivedWeight),
        thanksTokenSentWeight: big(weights.thanksTokenSentWeight),
      };

      const call = splitsCreator.read.preview([splitsInfo, weightsInfo]);
      if ("revert" in c.expected) {
        await expect(call).to.be.rejectedWith(panicMessage[c.expected.revert]);
        return;
      }
      const [recipients, allocations, totalAllocation] = await call;
      expect(recipients.map((a) => a.toLowerCase())).to.deep.equal(
        c.expected.recipients,
      );
      expect(allocations).to.deep.equal(c.expected.allocations.map(big));
      expect(totalAllocation).to.equal(big(c.expected.totalAllocation));
    });
  }
});
