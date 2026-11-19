---
title: Permission model
sidebar_position: 3
---

# Permission model

Toban has two kinds of authority:

- **Protocol owner**: the owner of the upgradeable singletons (`BigBang`, and the factories for SplitsCreator, ThanksToken and ScheduledDistributor). It can upgrade them and swap the implementations and dependencies they use for *new* workspaces. It has no special power inside an existing workspace.
- **Workspace roles**: inside a workspace, Hats Protocol decides authority. `bigbang` mints the top hat to itself, creates the workspace's hats, then transfers the top hat to `_owner`. From then on, the top hat's wearer administers the tree, and modules check hat admin or wearer status.

## Singletons

| Contract | Owner-only | Anyone |
| --- | --- | --- |
| BigBang | `set*` (Hats, module implementations, factories), upgrade | `bigbang(...)`: create a workspace |
| SplitsCreatorFactory | `setImplementation`, `setBigBang`, upgrade | `predictDeterministicAddress` (view). `createSplitCreatorDeterministic` can be called only by `BigBang`. |
| ThanksTokenFactory | `setImplementation`, `setHatsAddress`, `setBigBang`, upgrade | To be specified on the [ThanksToken](./modules/thanks-token.md) page. |
| ScheduledDistributorFactory | `setImplementation`, `setHats`, upgrade | To be specified on the [ScheduledDistributor](./modules/scheduled-distributor.md) page. |

## Per-workspace contracts

| Contract | Rule |
| --- | --- |
| SplitsCreator | `preview`, `create` and `createWithSalt` are open to anyone. Creating a split moves no funds, and the payer chooses which split to fund. See [SplitsCreator › Rationale](./modules/splits-creator.md#rationale). |
| Other modules | To be specified on each module's page. |
