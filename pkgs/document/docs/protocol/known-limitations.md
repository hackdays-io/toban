---
title: Known limitations
sidebar_position: 5
---

# Known limitations

## Scope of verification

- **Toban's own logic only.** Hats Protocol and 0xSplits are audited external code. They are not modeled, and their behavior is taken as given.
- **The model has unbounded integers.** Lean's `Nat` never overflows, but Solidity's `uint256` reverts on overflow. The principles hold for the contract as long as no intermediate product overflows. Realistic inputs stay well below that limit.
- **Data from other contracts is an input.** The SplitsCreator model takes balances, supplies, wear times and escrow as given numbers. It assumes `HatsFractionTokenModule.getTokenRecipients` is either empty or lists the wearer once, plus distinct other holders, and possibly the quest module. Whether that module keeps this shape belongs to that module's own spec (not written yet).
- **Fuzzed is not proven for the implementation.** The differential test compares the contract with the model on 173 inputs, not on all inputs. Exhaustive verification of the implementation itself (for example with Halmos or Certora) is out of scope for now.

## SplitsCreator

See [SplitsCreator › Known limitations](./modules/splits-creator.md#known-limitations).
