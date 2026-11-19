/**
 * Differential test: HatsFractionTokenModule vs the Lean reference model.
 *
 * The vectors are generated from the uint256 model in pkgs/spec
 * (Spec/HatsFractionTokenModule/Contract.lean) by `pnpm spec vectors`. Every
 * principle HFT-n is proven for the model in
 * Spec/HatsFractionTokenModule/Theorems.lean; this test shows the Solidity code
 * computes the same thing as the model, so the principles carry over to the
 * contract (on the inputs covered here).
 *
 * Each case is a sequence of transactions against a fresh module clone, set up
 * through HatsModuleFactory like BigBang does, with Hats Protocol replaced by
 * the shared stand-in (contracts/hats/mock/HatsAuthorityMock.sol) set to the
 * case's `world`; both are deployed afresh per case. Every transaction must succeed or revert exactly
 * as the model says (custom error and arguments, or panic code); afterwards
 * every share the case touched must have the model's recipients, supplies,
 * raw balances and `balanceOf` / `totalSupply` views.
 */
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import {
  type Address,
  BaseError,
  ContractFunctionRevertedError,
  encodeAbiParameters,
  encodePacked,
  getAddress,
  keccak256,
  zeroAddress,
} from "viem";
import { viem } from "../helpers/connection";
import { deployCreate2Deployer } from "../helpers/deploy/Create2Factory";
import {
  deployHatsFractionTokenModule,
  deployHatsModuleFactory,
} from "../helpers/deploy/Hats";
import { expect } from "../helpers/test/chai";

type Acct = number; // 0 = address(0), k = wallet k - 1
type Share = { hat: string; wearer: Acct };
type Arg = { addr: Acct } | { uint: string } | { id: Share };
type Expected =
  | "ok"
  | { panic: "0x11" | "0x32" }
  | { error: string; args: Arg[] };
type Op =
  | { fn: "mintInitialSupply" | "mint"; sender: Acct; hat: string; wearer: Acct; amount: string }
  | { fn: "batchMintInitialSupply"; sender: Acct; hats: string[]; wearers: Acct[]; amounts: string[] }
  | { fn: "burn"; sender: Acct; hat: string; wearer: Acct; target: Acct; amount: string }
  | { fn: "safeTransferFrom"; sender: Acct; from: Acct; to: Acct; id: Share; amount: string }
  | { fn: "safeBatchTransferFrom"; sender: Acct; from: Acct; to: Acct; ids: Share[]; amounts: string[] }
  | { fn: "setApprovalForAll"; sender: Acct; operator: Acct; approved: boolean };
type Vector = {
  name: string;
  accounts: number;
  world: {
    domain: string;
    defaultTokenSupply: string;
    wearers: { account: Acct; hat: string }[];
    admins: { account: Acct; hat: string }[];
  };
  steps: { op: Op; expected: Expected }[];
  final: {
    supplyAll: string;
    shares: {
      share: Share;
      recipients: Acct[];
      supply: string;
      balances: string[];
      balanceOf: string[];
      totalSupply: string;
    }[];
  };
};

const vectorsPath = createRequire(import.meta.url).resolve(
  "@toban/spec/vectors/hats-fraction-token-module.json",
);
const { cases } = JSON.parse(readFileSync(vectorsPath, "utf8")) as {
  cases: Vector[];
};

const big = (s: string) => BigInt(s);
/** The top hat the module is set up for: domain 1, as in the vectors. */
const TOP_HAT = 1n << 224n;

describe("[HFT-1][HFT-2][HFT-3][HFT-4][HFT-5][HFT-6][HFT-7][HFT-8] HatsFractionTokenModule matches the Lean model (differential)", () => {
  let implementation: Address;
  let wallets: Awaited<ReturnType<typeof viem.getWalletClients>>;

  const addr = (a: Acct): Address =>
    a === 0 ? zeroAddress : getAddress(wallets[a - 1].account.address);
  const tokenId = (s: Share) =>
    BigInt(
      keccak256(
        encodePacked(["uint256", "address"], [big(s.hat), addr(s.wearer)]),
      ),
    );
  const argValue = (a: Arg) =>
    "addr" in a
      ? addr(a.addr)
      : "uint" in a
        ? big(a.uint)
        : tokenId(a.id);

  before(async () => {
    const { Create2Deployer } = await deployCreate2Deployer();
    const { HatsFractionTokenModule } = await deployHatsFractionTokenModule(
      "0.0.0",
      Create2Deployer.address,
    );
    implementation = HatsFractionTokenModule.address;
    wallets = await viem.getWalletClients();
  });

  it("has vectors for edge cases and generated cases", () => {
    expect(cases.length).to.be.greaterThan(100);
    const outcomes = new Set(
      cases.flatMap((c) =>
        c.steps.map(({ expected: e }) =>
          e === "ok" ? "ok" : "panic" in e ? e.panic : e.error,
        ),
      ),
    );
    for (const o of ["ok", "0x11", "0x32", "CannotTransferAllTokens"]) {
      expect(outcomes.has(o), o).to.equal(true);
    }
  });

  for (const c of cases) {
    it(c.name, async () => {
      expect(c.world.domain).to.equal("1");
      const hats = await viem.deployContract("HatsAuthorityMock");
      const { HatsModuleFactory: factory } = await deployHatsModuleFactory(
        hats.address,
      );
      const roles = new Set([...c.world.wearers, ...c.world.admins].map((x) => x.hat));
      for (const hat of roles) {
        const of = (xs: { account: Acct; hat: string }[]) =>
          xs.filter((x) => x.hat === hat).map((x) => addr(x.account));
        await hats.write.setAuthority([big(hat), of(c.world.admins), of(c.world.wearers)]);
      }
      const initData = encodeAbiParameters(
        [{ type: "string" }, { type: "uint256" }],
        ["", big(c.world.defaultTokenSupply)],
      );
      const salt = 0n;
      await factory.write.createHatsModule([
        implementation,
        TOP_HAT,
        "0x",
        initData,
        salt,
      ]);
      const module = await viem.getContractAt(
        "HatsFractionTokenModule",
        (await factory.read.getHatsModuleAddress([
          implementation,
          TOP_HAT,
          "0x",
          salt,
        ])) as Address,
      );

      for (const [i, { op, expected }] of c.steps.entries()) {
        const account = addr(op.sender);
        const run = (mode: "simulate" | "write") => {
          const m = module[mode];
          const opts = { account };
          switch (op.fn) {
            case "mintInitialSupply":
            case "mint":
              return m[op.fn]([big(op.hat), addr(op.wearer), big(op.amount)], opts);
            case "batchMintInitialSupply":
              return m.batchMintInitialSupply(
                [op.hats.map(big), op.wearers.map(addr), op.amounts.map(big)],
                opts,
              );
            case "burn":
              return m.burn(
                [big(op.hat), addr(op.wearer), addr(op.target), big(op.amount)],
                opts,
              );
            case "safeTransferFrom":
              return m.safeTransferFrom(
                [addr(op.from), addr(op.to), tokenId(op.id), big(op.amount), "0x"],
                opts,
              );
            case "safeBatchTransferFrom":
              return m.safeBatchTransferFrom(
                [addr(op.from), addr(op.to), op.ids.map(tokenId), op.amounts.map(big), "0x"],
                opts,
              );
            case "setApprovalForAll":
              return m.setApprovalForAll([addr(op.operator), op.approved], opts);
          }
        };
        const where = `step ${i} (${op.fn})`;

        let reverted: ContractFunctionRevertedError | undefined;
        try {
          await run("simulate");
        } catch (e) {
          const r =
            e instanceof BaseError
              ? e.walk((x) => x instanceof ContractFunctionRevertedError)
              : undefined;
          if (!(r instanceof ContractFunctionRevertedError)) throw e;
          reverted = r;
        }

        if (expected === "ok") {
          expect(reverted?.shortMessage, where).to.equal(undefined);
          await run("write");
        } else if ("panic" in expected) {
          expect(reverted?.data?.errorName, where).to.equal("Panic");
          expect(reverted?.data?.args?.[0], where).to.equal(big(expected.panic));
        } else {
          expect(reverted?.data?.errorName, where).to.equal(expected.error);
          expect(reverted?.data?.args ?? [], where).to.deep.equal(
            expected.args.map(argValue),
          );
        }
      }

      // The final state: every read is independent, so issue them together.
      const accounts = Array.from({ length: c.accounts }, (_, k) => addr(k + 1));
      const read = module.read;
      expect(await read.totalSupply()).to.equal(big(c.final.supplyAll));
      const actual = await Promise.all(
        c.final.shares.map(async (f) => {
          const id = tokenId(f.share);
          const hat = big(f.share.hat);
          const wearer = addr(f.share.wearer);
          const [tokenIdOnChain, recipients, supply, totalSupply, balances, views] =
            await Promise.all([
              read.getTokenId([hat, wearer]),
              read.getTokenRecipients([id]),
              read.totalSupply([id]),
              read.totalSupply([wearer, hat]),
              Promise.all(accounts.map((a) => read.balanceOf([a, id]))),
              Promise.all(accounts.map((a) => read.balanceOf([a, wearer, hat]))),
            ]);
          return { id, tokenIdOnChain, recipients, supply, totalSupply, balances, views };
        }),
      );
      for (const [j, f] of c.final.shares.entries()) {
        const a = actual[j];
        const at = `share (${f.share.hat}, ${f.share.wearer})`;
        expect(a.tokenIdOnChain, at).to.equal(a.id);
        expect(a.recipients, at).to.deep.equal(f.recipients.map(addr));
        expect(a.supply, at).to.equal(big(f.supply));
        expect(a.totalSupply, at).to.equal(big(f.totalSupply));
        expect(a.balances, `${at} balances`).to.deep.equal(f.balances.map(big));
        expect(a.views, `${at} balanceOf(account, wearer, hatId)`).to.deep.equal(
          f.balanceOf.map(big),
        );
      }
    });
  }
});
