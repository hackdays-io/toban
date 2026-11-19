/**
 * Differential test: ThanksToken vs the Lean reference model.
 *
 * The vectors are generated from the uint256 model in pkgs/spec
 * (Spec/ThanksToken/Contract.lean) by `pnpm spec vectors`. Every principle
 * THX-n is proven for the model in Spec/ThanksToken/Theorems.lean; this test
 * shows the Solidity code behaves like the model, so the principles carry over
 * to the contract (on the call sequences covered here).
 *
 * Each case clones ThanksToken through ThanksTokenFactory like BigBang does,
 * with the FractionToken and time-frame module replaced by data mocks
 * (contracts/hatsmodules/mock/HatsModuleDataMocks.sol) set to the case's
 * roles. It then sends the calls in order from the wallets the vector names
 * (account k = the k-th test wallet, 0 = the zero address; permits are signed
 * by the vector's `signer`), and checks every call's outcome — success or the
 * same revert reason / panic as the model — plus totalSupply and
 * getParticipants after it. At the end it compares every account's balance,
 * mintedAmount, addressCoefficient, mintNonces and every mintAllowance.
 */
import {
  type Address,
  maxUint256,
  parseSignature,
  type WalletClient,
  zeroAddress,
  zeroHash,
} from "viem";
import { viem } from "../helpers/connection";
import { deployCreate2Deployer } from "../helpers/deploy/Create2Factory";
import {
  deployThanksToken,
  deployThanksTokenFactory,
  type ThanksTokenFactory,
} from "../helpers/deploy/ThanksToken";
import { expect } from "../helpers/test/chai";
import { loadVectors, panicMessage } from "../helpers/test/specVectors";

type Ref = { wearer: number; hatId: string };
type Step =
  | { kind: "mintableAmount"; owner: number; roles: Ref[] }
  | {
      kind: "mint";
      sender: number;
      to: number;
      amount: string;
      roles: Ref[];
    }
  | {
      kind: "batchMint";
      sender: number;
      to: number[];
      amounts: string[];
      roles: Ref[];
    }
  | {
      kind: "mintFrom";
      sender: number;
      from: number;
      to: number;
      value: string;
      roles: Ref[];
    }
  | { kind: "approveMint"; sender: number; spender: number; value: string }
  | {
      kind: "permitMint";
      sender: number;
      owner: number;
      spender: number;
      value: string;
      nonce: string;
      expired: boolean;
      signer: number;
    }
  | { kind: "transfer"; sender: number; to: number; amount: string }
  | {
      kind: "setAddressCoefficient";
      sender: number;
      account: number;
      coefficient: string;
    };
/** A view returns a value or overflows; a call also reports the state after it. */
type Expected =
  | { value: string }
  | { revert: "overflow" }
  | (({ ok: true } | { revert: keyof typeof revertMessage }) & {
      totalSupply: string;
      participants: number[];
    });
type Vector = {
  name: string;
  roles: {
    wearer: number;
    hatId: string;
    supply: string;
    elapsed: string;
    shares: { account: number; balance: string }[];
  }[];
  steps: { step: Step; expected: Expected }[];
  final: {
    accounts: {
      account: number;
      balance: string;
      minted: string;
      coefficient: string;
      nonce: string;
    }[];
    allowances: { owner: number; spender: number; value: string }[];
  };
};

// Revert reasons of the model's `Err`, as viem reports them.
const revertMessage = {
  selfMint: /Cannot mint to yourself/,
  zeroAmount: /Amount must be greater than 0/,
  exceedsMintable: /Amount exceeds mintable amount/,
  lengthMismatch: /Arrays length mismatch/,
  totalExceeds: /Total exceeds mintable amount/,
  mintToSpender: /Cannot mint to spender/,
  allowanceExceeded: /ThanksToken: mint allowance exceeded/,
  invalidOwner: /ThanksToken: invalid owner/,
  permitExpired: /ThanksToken: permit expired/,
  invalidSignature: /ThanksToken: invalid signature/,
  approveFromZero: /ThanksToken: approve from zero address/,
  approveToZero: /ThanksToken: approve to zero address/,
  notOwner: /Ownable: caller is not the owner/,
  invalidSender: /ERC20InvalidSender/,
  invalidReceiver: /ERC20InvalidReceiver/,
  insufficientBalance: /ERC20InsufficientBalance/,
  overflow: panicMessage.overflow,
};

const { cases, owner } = loadVectors<{ cases: Vector[]; owner: number }>(
  "thanks-token",
);

const big = (s: string) => BigInt(s);

describe("[THX-1][THX-2][THX-3][THX-4][THX-5][THX-6][THX-7][THX-8] ThanksToken matches the Lean model (differential)", () => {
  let factory: ThanksTokenFactory;
  let wallets: WalletClient[];
  let chainId: number;

  const addr = (k: number): Address =>
    k === 0 ? zeroAddress : (wallets[k].account?.address as Address);
  const wallet = (k: number) => {
    if (k === 0) throw new Error("no wallet for the zero address");
    return { account: wallets[k].account } as { account: never };
  };
  const refs = (rs: Ref[]) =>
    rs.map((r) => ({ wearer: addr(r.wearer), hatId: big(r.hatId) }));

  before(async () => {
    wallets = await viem.getWalletClients();
    chainId = await (await viem.getPublicClient()).getChainId();
    const { Create2Deployer } = await deployCreate2Deployer();
    const { ThanksToken } = await deployThanksToken(Create2Deployer.address);
    const deployerAddr = wallets[0].account?.address as Address;
    ({ ThanksTokenFactory: factory } = await deployThanksTokenFactory(
      {
        initialOwner: deployerAddr,
        implementation: ThanksToken.address,
        hatsAddress: zeroAddress, // not read by the functions under test
      },
      Create2Deployer.address,
    ));
    // This test plays BigBang, the only caller allowed to create clones.
    await factory.write.setBigBang([deployerAddr]);
  });

  it("has vectors for every kind of call and revert", () => {
    expect(cases.length).to.be.greaterThan(40);
    const seen = new Set(
      cases.flatMap((c) =>
        c.steps.map(({ expected: e }) =>
          "revert" in e ? e.revert : "ok" in e ? "ok" : "value",
        ),
      ),
    );
    for (const r of [
      "ok",
      "overflow",
      "exceedsMintable",
      "totalExceeds",
      "allowanceExceeded",
      "invalidSignature",
    ]) {
      expect(seen.has(r), r).to.equal(true);
    }
  });

  for (const [index, c] of cases.entries()) {
    it(c.name, async () => {
      const fraction = await viem.deployContract("FractionTokenDataMock");
      const timeFrame = await viem.deployContract("TimeFrameDataMock");
      for (const r of c.roles) {
        await fraction.write.setWearer([
          big(r.hatId),
          addr(r.wearer),
          big(r.supply),
          [],
          r.shares.map((s) => addr(s.account)),
          r.shares.map((s) => big(s.balance)),
        ]);
        await timeFrame.write.setElapsed([
          addr(r.wearer),
          big(r.hatId),
          big(r.elapsed),
        ]);
      }

      const cloneArgs = [
        `Thx${index}`,
        `THX${index}`,
        addr(owner),
        fraction.address,
        timeFrame.address,
        zeroHash,
      ] as const;
      await factory.write.createThanksTokenDeterministic(cloneArgs);
      const token = await viem.getContractAt(
        "ThanksToken",
        await factory.read.predictThanksTokenAddress(cloneArgs),
      );

      const send = async (step: Step): Promise<unknown> => {
        switch (step.kind) {
          case "mintableAmount":
            return token.read.mintableAmount([
              addr(step.owner),
              refs(step.roles),
            ]);
          case "mint":
            return token.write.mint(
              [addr(step.to), big(step.amount), refs(step.roles), "0x"],
              wallet(step.sender),
            );
          case "batchMint":
            return token.write.batchMint(
              [
                step.to.map(addr),
                step.amounts.map(big),
                refs(step.roles),
                "0x",
              ],
              wallet(step.sender),
            );
          case "mintFrom":
            return token.write.mintFrom(
              [
                addr(step.from),
                addr(step.to),
                big(step.value),
                refs(step.roles),
                "0x",
              ],
              wallet(step.sender),
            );
          case "approveMint":
            return token.write.approveMint(
              [addr(step.spender), big(step.value)],
              wallet(step.sender),
            );
          case "permitMint": {
            const deadline = step.expired ? 0n : maxUint256;
            const signer = wallets[step.signer];
            const signature = await signer.signTypedData({
              account: signer.account as never,
              domain: {
                name: "ThanksToken",
                version: "1",
                chainId,
                verifyingContract: token.address,
              },
              types: {
                PermitMint: [
                  { name: "owner", type: "address" },
                  { name: "spender", type: "address" },
                  { name: "value", type: "uint256" },
                  { name: "nonce", type: "uint256" },
                  { name: "deadline", type: "uint256" },
                ],
              },
              primaryType: "PermitMint",
              message: {
                owner: addr(step.owner),
                spender: addr(step.spender),
                value: big(step.value),
                nonce: big(step.nonce),
                deadline,
              },
            });
            const { r, s, v, yParity } = parseSignature(signature);
            return token.write.permitMint(
              [
                addr(step.owner),
                addr(step.spender),
                big(step.value),
                deadline,
                Number(v ?? BigInt(yParity + 27)),
                r,
                s,
              ],
              wallet(step.sender),
            );
          }
          case "transfer":
            return token.write.transfer(
              [addr(step.to), big(step.amount)],
              wallet(step.sender),
            );
          case "setAddressCoefficient":
            return token.write.setAddressCoefficient(
              [addr(step.account), big(step.coefficient)],
              wallet(step.sender),
            );
        }
      };

      for (const [i, { step, expected }] of c.steps.entries()) {
        const where = `step ${i} (${step.kind})`;
        if ("revert" in expected) {
          await expect(send(step), where).to.be.rejectedWith(
            revertMessage[expected.revert],
          );
        } else if ("value" in expected) {
          expect(await send(step), where).to.equal(big(expected.value));
        } else {
          await send(step);
        }
        if (!("totalSupply" in expected)) continue; // a view: no state to compare
        const [supply, participants] = await Promise.all([
          token.read.totalSupply(),
          token.read.getParticipants(),
        ]);
        expect(supply, where).to.equal(big(expected.totalSupply));
        expect(
          participants.map((a) => a.toLowerCase()),
          where,
        ).to.deep.equal(
          expected.participants.map((k) => addr(k).toLowerCase()),
        );
      }

      // Views only, so the reads can run concurrently.
      const accounts = await Promise.all(
        c.final.accounts.map(async (a) => {
          const who = addr(a.account);
          return Promise.all([
            token.read.balanceOf([who]),
            token.read.mintedAmount([who]),
            token.read.addressCoefficient([who]),
            token.read.mintNonces([who]),
          ]);
        }),
      );
      for (const [k, a] of c.final.accounts.entries()) {
        expect(accounts[k], `account ${a.account}`).to.deep.equal(
          [a.balance, a.minted, a.coefficient, a.nonce].map(big),
        );
      }
      const allowances = await Promise.all(
        c.final.allowances.map((al) =>
          token.read.mintAllowance([addr(al.owner), addr(al.spender)]),
        ),
      );
      for (const [k, al] of c.final.allowances.entries()) {
        expect(allowances[k], `allowance ${al.owner} → ${al.spender}`).to.equal(
          big(al.value),
        );
      }
    });
  }
});
