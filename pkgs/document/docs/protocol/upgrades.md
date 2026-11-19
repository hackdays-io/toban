---
title: Upgrade policy
sidebar_position: 4
---

# Upgrade policy

| Contract | Pattern | Upgraded by |
| --- | --- | --- |
| BigBang | UUPS proxy (OpenZeppelin upgradeable 5.0.2) | Owner, `upgradeToAndCall` |
| SplitsCreatorFactory | UUPS proxy | Owner |
| ThanksTokenFactory | UUPS proxy | Owner |
| ScheduledDistributorFactory | UUPS proxy | Owner |
| SplitsCreator, ThanksToken, ScheduledDistributor | Minimal clone (Solady `LibClone`) of the factory's implementation | Never. A clone is immutable. |
| Hats modules | Clone created by `HatsModuleFactory` | Never |

What this means:

- **Existing workspaces keep the logic they were created with.** Changing a factory's implementation (`setImplementation`) or a BigBang module implementation (`setHats*ModuleImpl`) affects only workspaces created afterwards.
- **Splits are final.** A 0xSplits split created by SplitsCreator keeps its allocations forever. Changing the formula changes only future splits.
- **Principles are versioned with the code.** A module page describes the implementation on `main`. If a change breaks a principle, the Lean proof or the differential test fails, and the principle must be revised in the same pull request.

Deployment and upgrade procedures are in [`DEPLOYMENT.md`](https://github.com/hackdays-io/toban/blob/main/DEPLOYMENT.md).
