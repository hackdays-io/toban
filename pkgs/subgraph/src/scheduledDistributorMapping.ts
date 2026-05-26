import { Address, BigInt as GraphBigInt } from "@graphprotocol/graph-ts";
import { ScheduledDistributorCreated } from "../generated/ScheduledDistributorFactory/ScheduledDistributorFactory";
import {
  ScheduledDistributor,
  ScheduledDistributorDeposit,
  ScheduledDistributorTokenBalance,
  SplitsCreatorWorkspace,
} from "../generated/schema";
import { ScheduledDistributor as ScheduledDistributorTemplate } from "../generated/templates";
import {
  Deposited,
  Executed as DistributorExecuted,
  Reclaimed,
  RuleCreated,
} from "../generated/templates/ScheduledDistributor/ScheduledDistributor";

function tokensToStrings(addrs: Address[]): string[] {
  const out: string[] = [];
  for (let i = 0; i < addrs.length; i++) {
    out.push(addrs[i].toHex());
  }
  return out;
}

function balanceId(distributorId: string, token: string): string {
  return distributorId + "-" + token;
}

function ensureBalance(
  distributorId: string,
  token: string,
  timestamp: GraphBigInt,
): ScheduledDistributorTokenBalance {
  const id = balanceId(distributorId, token);
  let bal = ScheduledDistributorTokenBalance.load(id);
  if (bal === null) {
    bal = new ScheduledDistributorTokenBalance(id);
    bal.scheduledDistributor = distributorId;
    bal.token = token;
    bal.totalDeposited = GraphBigInt.fromI32(0);
    bal.updatedAt = timestamp;
  }
  return bal;
}

export function handleScheduledDistributorCreated(
  ev: ScheduledDistributorCreated,
): void {
  const id = ev.params.distributor.toHex();
  let dist = ScheduledDistributor.load(id);
  if (dist === null) {
    dist = new ScheduledDistributor(id);
  }
  dist.scheduler = ev.params.scheduler.toHex();
  dist.splitsCreator = ev.params.splitsCreator.toHex();
  const tokens = tokensToStrings(ev.params.tokens);
  dist.tokens = tokens;
  dist.depositor = ev.params.scheduler.toHex();
  dist.backupWallet = ev.params.scheduler.toHex();
  dist.scheduledDate = ev.params.scheduledDate;
  dist.status = "Pending";
  dist.createdAt = ev.block.timestamp;
  dist.createdBlock = ev.block.number;

  const lookup = SplitsCreatorWorkspace.load(ev.params.splitsCreator.toHex());
  if (lookup !== null) {
    dist.workspaceId = lookup.workspaceId;
  }

  dist.save();

  // Seed a token-balance row per declared token so the frontend can render
  // even before any deposit lands.
  for (let i = 0; i < tokens.length; i++) {
    const bal = ensureBalance(id, tokens[i], ev.block.timestamp);
    bal.save();
  }

  ScheduledDistributorTemplate.create(ev.params.distributor);
}

export function handleRuleCreated(ev: RuleCreated): void {
  const id = ev.address.toHex();
  let dist = ScheduledDistributor.load(id);
  if (dist === null) {
    // Should already be created by the factory event, but be defensive.
    dist = new ScheduledDistributor(id);
    dist.status = "Pending";
    dist.createdAt = ev.block.timestamp;
    dist.createdBlock = ev.block.number;
  }
  dist.scheduler = ev.params.scheduler.toHex();
  dist.splitsCreator = ev.params.splitsCreator.toHex();
  const tokens = tokensToStrings(ev.params.tokens);
  dist.tokens = tokens;
  dist.depositor = ev.params.depositor.toHex();
  dist.backupWallet = ev.params.backupWallet.toHex();
  dist.scheduledDate = ev.params.scheduledDate;
  if (dist.workspaceId === null) {
    const lookup = SplitsCreatorWorkspace.load(ev.params.splitsCreator.toHex());
    if (lookup !== null) {
      dist.workspaceId = lookup.workspaceId;
    }
  }
  dist.save();

  for (let i = 0; i < tokens.length; i++) {
    const bal = ensureBalance(id, tokens[i], ev.block.timestamp);
    bal.save();
  }
}

export function handleDeposited(ev: Deposited): void {
  const id = ev.address.toHex();
  const dist = ScheduledDistributor.load(id);
  if (dist === null) return;

  const token = ev.params.token.toHex();
  const bal = ensureBalance(id, token, ev.block.timestamp);
  bal.totalDeposited = bal.totalDeposited.plus(ev.params.amount);
  bal.updatedAt = ev.block.timestamp;
  bal.save();

  const depositId =
    id + "-" + ev.transaction.hash.toHex() + "-" + ev.logIndex.toString();
  const deposit = new ScheduledDistributorDeposit(depositId);
  deposit.scheduledDistributor = id;
  deposit.token = token;
  deposit.from = ev.params.from.toHex();
  deposit.amount = ev.params.amount;
  deposit.blockTimestamp = ev.block.timestamp;
  deposit.blockNumber = ev.block.number;
  deposit.txHash = ev.transaction.hash;
  deposit.save();
}

export function handleExecuted(ev: DistributorExecuted): void {
  const id = ev.address.toHex();
  const dist = ScheduledDistributor.load(id);
  if (dist === null) return;
  dist.status = "Executed";
  dist.split = ev.params.split.toHex();
  dist.executedAt = ev.block.timestamp;
  dist.save();

  const token = ev.params.token.toHex();
  const bal = ensureBalance(id, token, ev.block.timestamp);
  bal.executedAmount = ev.params.amount;
  bal.updatedAt = ev.block.timestamp;
  bal.save();
}

export function handleReclaimed(ev: Reclaimed): void {
  const id = ev.address.toHex();
  const dist = ScheduledDistributor.load(id);
  if (dist === null) return;
  dist.status = "Reclaimed";
  dist.reclaimedAt = ev.block.timestamp;
  dist.save();

  const token = ev.params.token.toHex();
  const bal = ensureBalance(id, token, ev.block.timestamp);
  bal.reclaimedAmount = ev.params.amount;
  bal.updatedAt = ev.block.timestamp;
  bal.save();
}
