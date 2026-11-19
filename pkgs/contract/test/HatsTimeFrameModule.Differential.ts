/**
 * Differential test: HatsTimeFrameModule vs the Lean reference model.
 *
 * The vectors are generated from the uint256 model in pkgs/spec
 * (Spec/HatsTimeFrameModule/Contract.lean) by `pnpm spec vectors`. Every
 * principle HTF-n is proven for the model in Spec/HatsTimeFrameModule/Theorems.lean;
 * this test shows the Solidity code computes the same thing as the model, so
 * the principles carry over to the contract (on the call sequences covered here).
 *
 * Each case deploys a fresh module clone through HatsModuleFactory, with Hats
 * replaced by a mock that answers the authority checks from the vector
 * (contracts/hats/mock/HatsAuthorityMock.sol). It then runs
 * the steps, each at its block timestamp. After every step it compares the
 * revert reason (require message or Panic 0x11) and, for every account, the
 * four storage values and getWearingElapsedTime with the model.
 */
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import {
  type Address,
  encodeAbiParameters,
  zeroAddress,
} from "viem";
import { networkHelpers, viem } from "../helpers/connection";
import { deployCreate2Deployer } from "../helpers/deploy/Create2Factory";
import {
  deployHatsModuleFactory,
  deployHatsTimeFrameModule,
} from "../helpers/deploy/Hats";
import { expect } from "../helpers/test/chai";

type Op =
  | { kind: "mintHat"; caller: number; wearer: number; time: string }
  | {
      kind: "batchMintHat";
      caller: number;
      wearers: number[];
      times: string[];
    }
  | {
      kind: "deactivate" | "reactivate" | "renounce";
      caller: number;
      wearer: number;
    };
type Slot = {
  account: number;
  woreTime: string;
  deactivatedTime: string;
  totalActiveTime: string;
  isActive: boolean;
  elapsed: { value: string } | { revert: string };
};
type Step = {
  time: string;
  op: Op | null;
  revert: string | null;
  slots: Slot[];
};
type Vector = {
  name: string;
  env: { admins: number[]; minters: number[] };
  steps: Step[];
};

const vectorsPath = createRequire(import.meta.url).resolve(
  "@toban/spec/vectors/hats-time-frame-module.json",
);
const { cases } = JSON.parse(readFileSync(vectorsPath, "utf8")) as {
  cases: Vector[];
};

// viem's message for Solidity Panic 0x11.
const revertMatcher = (reason: string) =>
  reason === "panic 0x11"
    ? /Arithmetic operation resulted in underflow or overflow/
    : reason;

const HAT_ID = 1n;
const MINTER_HAT_ID = 2n;
const { time } = networkHelpers;

async function deployFixture() {
  const { Create2Deployer } = await deployCreate2Deployer();
  const { HatsTimeFrameModule: implementation } =
    await deployHatsTimeFrameModule("0.0.0", Create2Deployer.address);
  const hats = await viem.deployContract("HatsAuthorityMock");
  const { HatsModuleFactory } = await deployHatsModuleFactory(hats.address);
  return { implementation, hats, HatsModuleFactory };
}

describe("[HTF-1][HTF-2][HTF-3][HTF-4][HTF-5][HTF-6][HTF-7] HatsTimeFrameModule matches the Lean model (differential)", () => {
  // Account k of the vectors is signer k; account 0 is address(0).
  let wallets: Awaited<ReturnType<typeof viem.getWalletClients>>;
  const address = (k: number): Address =>
    k === 0 ? zeroAddress : (wallets[k].account?.address as Address);

  before(async () => {
    wallets = await viem.getWalletClients();
  });

  after(async () => {
    // The vectors move the shared chain's clock to 2096 (T0 in the vectors).
    // Revert to the fixture snapshot, which the first case took before any
    // step set a timestamp, so later test files see timestamps near now.
    await networkHelpers.loadFixture(deployFixture);
  });

  it("has vectors for edge cases and generated cases", () => {
    expect(cases.length).to.be.greaterThan(100);
    const reverts = new Set(
      cases.flatMap((c) => c.steps.map((s) => s.revert)),
    );
    for (const reason of [
      "Not authorized",
      "Hat is already inactive",
      "Hat is already active",
      "Hat already minted",
      "Empty wearers array",
      "Array length mismatch",
      "Batch size too large",
      "Invalid wearer address",
      "panic 0x11",
    ]) {
      expect(reverts.has(reason), reason).to.equal(true);
    }
    const steps = cases.flatMap((c) => c.steps);
    // Some reads must revert, or the elapsed-revert path is never compared.
    expect(
      steps.some((s) => s.slots.some((slot) => "revert" in slot.elapsed)),
    ).to.equal(true);
    // Callers sign as signer k, which cannot stand for address(0).
    expect(steps.every((s) => !s.op || s.op.caller >= 1)).to.equal(true);
  });

  for (const c of cases) {
    it(c.name, async () => {
      const { implementation, hats, HatsModuleFactory } =
        await networkHelpers.loadFixture(deployFixture);
      await hats.write.setAuthority([
        MINTER_HAT_ID,
        c.env.admins.map(address),
        c.env.minters.map(address),
      ]);
      const initData = encodeAbiParameters(
        [{ type: "uint256" }],
        [MINTER_HAT_ID],
      );
      await HatsModuleFactory.write.createHatsModule([
        implementation.address,
        HAT_ID,
        "0x",
        initData,
        0n,
      ]);
      const moduleAddress = await HatsModuleFactory.read.getHatsModuleAddress(
        [implementation.address, HAT_ID, "0x", 0n],
      );
      const modules = new Map<
        number,
        ReturnType<typeof viem.getContractAt<"HatsTimeFrameModule">>
      >();
      const moduleAs = (k: number) => {
        if (!modules.has(k)) {
          modules.set(
            k,
            viem.getContractAt("HatsTimeFrameModule", moduleAddress, {
              client: { wallet: wallets[k] },
            }),
          );
        }
        // biome-ignore lint/style/noNonNullAssertion: set just above
        return modules.get(k)!;
      };
      const reader = await moduleAs(0);
      const publicClient = await viem.getPublicClient();

      for (const [i, step] of c.steps.entries()) {
        const at = `step ${i} (${step.op?.kind ?? "read"} at ${step.time})`;
        const timestamp = BigInt(step.time);
        await time.setNextBlockTimestamp(timestamp);

        if (step.op) {
          const op = step.op;
          const module = await moduleAs(op.caller);
          const call =
            op.kind === "mintHat"
              ? module.write.mintHat([
                  HAT_ID,
                  address(op.wearer),
                  BigInt(op.time),
                ])
              : op.kind === "batchMintHat"
                ? module.write.batchMintHat([
                    HAT_ID,
                    op.wearers.map(address),
                    op.times.map(BigInt),
                  ])
                : module.write[op.kind]([HAT_ID, address(op.wearer)]);
          if (step.revert === null) {
            await call;
          } else {
            await expect(call, at).to.be.rejectedWith(
              revertMatcher(step.revert),
            );
          }
        }

        // A reverted call (or a read step) mines no block: mine an empty one
        // so the reads below run at this step's timestamp.
        let block = await publicClient.getBlock();
        if (block.timestamp !== timestamp) {
          await networkHelpers.mine();
          block = await publicClient.getBlock();
        }
        expect(block.timestamp, at).to.equal(timestamp);
        const blockNumber = block.number;

        await Promise.all(
          step.slots.map(async (slot) => {
            const who = address(slot.account);
            const where = `${at}, account ${slot.account}`;
            const read = { blockNumber };
            const [woreTime, deactivatedTime, totalActiveTime, isActive] =
              await Promise.all([
                reader.read.woreTime([HAT_ID, who], read),
                reader.read.deactivatedTime([HAT_ID, who], read),
                reader.read.totalActiveTime([HAT_ID, who], read),
                reader.read.isActive([HAT_ID, who], read),
              ]);
            expect(
              { woreTime, deactivatedTime, totalActiveTime, isActive },
              where,
            ).to.deep.equal({
              woreTime: BigInt(slot.woreTime),
              deactivatedTime: BigInt(slot.deactivatedTime),
              totalActiveTime: BigInt(slot.totalActiveTime),
              isActive: slot.isActive,
            });
            const elapsed = reader.read.getWearingElapsedTime(
              [who, HAT_ID],
              read,
            );
            if ("revert" in slot.elapsed) {
              await expect(elapsed, where).to.be.rejectedWith(
                revertMatcher(slot.elapsed.revert),
              );
            } else {
              expect(await elapsed, where).to.equal(
                BigInt(slot.elapsed.value),
              );
            }
          }),
        );
      }
    });
  }
});
