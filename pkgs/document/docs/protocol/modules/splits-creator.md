---
title: SplitsCreator
sidebar_position: 1
---

# SplitsCreator

**Source:** [`pkgs/contract/contracts/splitscreator/SplitsCreator.sol`](https://github.com/hackdays-io/toban/blob/main/pkgs/contract/contracts/splitscreator/SplitsCreator.sol)
· **Model and proofs:** [`pkgs/spec/Spec/SplitsCreator/`](https://github.com/hackdays-io/toban/tree/main/pkgs/spec/Spec/SplitsCreator)
· **Differential test:** [`pkgs/contract/test/SplitsCreator.Differential.ts`](https://github.com/hackdays-io/toban/blob/main/pkgs/contract/test/SplitsCreator.Differential.ts)

## Goal

Turn what a workspace has recorded (who held which role, for how long, how they shared that role, and how much they thanked each other) into a reward split that anyone can check. SplitsCreator computes the allocations and deploys a [0xSplits V2](https://docs.splits.org/) split contract with them. It does not hold or move any funds itself.

## Mechanism

Each workspace gets its own SplitsCreator. `SplitsCreatorFactory` deploys it as a minimal clone during `BigBang.bigbang`. Its dependencies are immutable clone arguments: Hats, the Splits factory, `HatsTimeFrameModule`, `HatsFractionTokenModule`, `ThanksToken` and `HatsQuestModule`.

```mermaid
flowchart LR
  caller([caller]) -- "create / createWithSalt / preview<br/>(SplitsInfo[], WeightsInfo)" --> SC[SplitsCreator]
  SC -- "getParticipants, balanceOf, mintedAmount" --> TT[ThanksToken]
  SC -- "getTokenRecipients, balanceOf, totalSupply" --> FT[HatsFractionTokenModule]
  SC -- "getWearingElapsedTime" --> TF[HatsTimeFrameModule]
  SC -- "getEscrowedBalance" --> QM[HatsQuestModule]
  SC -- "createSplitDeterministic" --> SF[0xSplits SplitFactoryV2]
  SF --> S[(Split)]
  SC -. "SplitsCreated(split, shareHolders, allocations, totalAllocation)" .-> subgraph[(subgraph)]
```

### Functions

| Function | Access | Effect |
| --- | --- | --- |
| `preview(splitsInfo, weightsInfo)` | anyone, view | Returns `(shareHolders, allocations, totalAllocation)`. |
| `create(splitsInfo, weightsInfo)` | anyone | Same computation, then deploys a split. The salt is `keccak256(abi.encode(splitsInfo))`. Reverts if there are fewer than 2 recipients. Emits `SplitsCreated`. |
| `createWithSalt(splitsInfo, weightsInfo, salt)` | anyone | Like `create`, with salt `keccak256(abi.encode(msg.sender, salt))`. Used by `ScheduledDistributor`, which needs to know the split address in advance. Mixing in `msg.sender` stops others from deploying at that address first. |

The caller chooses the roles (`hatId`), wearers and role multipliers (`multiplierTop / multiplierBottom`). The caller also chooses the four weights: `roleWeight`, `thanksTokenWeight`, `thanksTokenReceivedWeight` and `thanksTokenSentWeight`. Everything else is read on-chain.

### The allocation formula

Let $P = 10^9$ (`PRECISION`). Every `/` is integer division that rounds down, done in the order shown.

**Thanks side.** Every ThanksToken participant $p$ has a balance $b_p$ (thanks received) and a minted amount $m_p$ (thanks sent). Let $B = \sum b_p$ and $M = \sum m_p$, and let $r$ and $s$ be the received and sent weights. If $B > 0$ and $M > 0$, each participant's score is

$$
t_p = \left(\frac{r \cdot b_p \cdot P}{B} + \frac{s \cdot m_p \cdot P}{M}\right) \Big/ (r + s)
$$

Otherwise every score is 0.

**Role side.** For each role $R$, the multiplier is $\mu_R = \lfloor top / bottom \rfloor$. Each wearer $w$ has a share token. Its holders are the wearer and anyone the wearer passed part of the share to. A holder $h$ has balance $e_h$, plus any quest escrow credited back to it. The wearer's time multiplier is $\tau_w = \lfloor\sqrt{\text{seconds worn}}\rfloor$, or 1 when the workspace has no time frame module. With $S_R$ the sum of the role's share-token supplies, the holder's score is

$$
q_h = \frac{e_h \cdot \mu_R \cdot \tau_w \cdot P}{S_R}
$$

**Combining.** Let $W_t$ and $W_r$ be the thanks and role weights. A side takes part only if its weight and its score total $T$ are both non-zero. Each of its entries becomes

$$
\text{allocation} = \frac{x \cdot W \cdot P}{T} \Big/ (W_t + W_r)
$$

Thanks entries come first, in participant order. Role entries follow, in `SplitsInfo` order: each wearer, then the wearer's other holders. `totalAllocation` is the sum of all allocations. 0xSplits pays each recipient `allocation / totalAllocation` of the funds. An account that appears several times is paid for each entry.

## Rationale

- **Two independent sides, mixed by weight.** Role-based and thanks-based rewards measure different things: steady responsibility versus visible help. Normalizing each side to $P$ before mixing lets a workspace set the balance with two numbers, whatever the token amounts are. We rejected adding raw scores together: one side's units (token wei against shares × √seconds) would swamp the other.
- **√ of wear time.** Time should count, but showing up early should not decide the split forever. A square root rewards the first months most and still never lets a longer tenure count for less (SPL-7).
- **Skip a zero side instead of reverting.** A new workspace often has no thanks yet. If such a side made the whole split revert, `ScheduledDistributor.execute` would fall back to reclaiming the funds. Dropping the side keeps the other side's ratios exact (SPL-4).
- **Computed at creation, then frozen.** Allocations are fixed into an immutable split, so the result can be checked against the `SplitsCreated` event and the chain state at that block. We rejected computing at withdrawal time: the result would change after people agreed to it.
- **Permissionless creation.** Creating a split moves no money. A split matters only when someone sends funds to it, so the payer, for example `ScheduledDistributor` or the frontend, decides which split to pay.

## Principles

The ID of each principle is the same in this table, in the Lean theorem (`-- SPL-n` in [`Theorems.lean`](https://github.com/hackdays-io/toban/blob/main/pkgs/spec/Spec/SplitsCreator/Theorems.lean)) and in contract test names (`[SPL-n]`). `scripts/check-spec-ids.mjs` checks that the three agree. The [overview](../index.md#verification-status) explains the two status columns.

| ID | Principle | Proof | Implementation |
| --- | --- | --- | --- |
| `SPL-1` | `totalAllocation` is exactly the sum of `allocations`, and there is one allocation per recipient. | proven (Lean) | fuzzed |
| `SPL-2` | Each side gets at most its weight's share of $P$: the thanks side at most $P \cdot W_t/(W_t+W_r)$, the role side at most $P \cdot W_r/(W_t+W_r)$. | proven (Lean) | fuzzed |
| `SPL-3` | Rounding never creates value: `totalAllocation` ≤ $P$. | proven (Lean) | fuzzed |
| `SPL-4` | A side whose weight is 0, or whose scores are all 0, has no recipients, and the other side is paid as if it were alone. | proven (Lean) | fuzzed, tested |
| `SPL-5` | `preview` reverts exactly when a divisor would be 0. That happens when someone holds or has sent thanks but `received + sent` weight is 0, when a role has `multiplierBottom` = 0, or when a role has wearers but a total share supply of 0. | proven (Lean) | fuzzed |
| `SPL-6` | On the thanks side, a participant who has received and sent at least as much as another never gets less. | proven (Lean) | fuzzed |
| `SPL-7` | Within one role, a holder with at least as much share, of a wearer who has worn the role at least as long, never gets less. Time counts as ⌊√seconds⌋. | proven (Lean) | fuzzed |

**What "fuzzed" covers here.** The Lean model is executable. `lake exe gen-vectors` runs it on 23 hand-written edge cases and 150 seeded random inputs. The differential test feeds each input to the real contract through data mocks and requires the same recipients, allocations and total, or a revert when the model reverts. Once the outputs agree, the proven principles hold for the contract on those inputs. The model does not cover uint256 overflow, or how the FractionToken module builds its recipients list (see [Known limitations](../known-limitations.md)).

## Known limitations

- `multiplierTop / multiplierBottom` rounds down before it is used: 3/2 counts as 1, and 1/2 counts as 0, which removes the role.
- If anyone holds or has sent thanks, `received + sent` = 0 makes `preview` and `create` revert, even when `thanksTokenWeight` is 0 (SPL-5).
- `PRECISION` is written `10e8`, which is $10^9$.
- An account is not merged across entries: it can appear once on the thanks side and once for each role share it holds.
