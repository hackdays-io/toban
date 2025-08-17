import { Address, BigInt as GraphBigInt } from "@graphprotocol/graph-ts";
import { TokensMinted, Transfer } from "../generated/ThanksToken/ThanksToken";
import {
  ThanksToken,
  ThanksTokenBalance,
  ThanksTokenMint,
  ThanksTokenTransfer,
} from "../generated/schema";

export function handleTokensMinted(ev: TokensMinted): void {
  // Create mint record
  const id = `${ev.transaction.hash.toHex()}${ev.logIndex.toString()}`;
  const mint = new ThanksTokenMint(id);

  mint.thanksToken = ev.address.toHex();
  mint.to = ev.params.to.toHex();
  mint.amount = ev.params.amount;
  mint.workspaceId = getWorkspaceIdFromThanksToken(ev.address.toHex());
  mint.blockTimestamp = ev.block.timestamp;
  mint.blockNumber = ev.block.number;

  // Update balance for recipient
  updateThanksTokenBalance(
    ev.address.toHex(),
    ev.params.to,
    ev.params.amount,
    getWorkspaceIdFromThanksToken(ev.address.toHex()),
    ev.block.timestamp,
  );

  mint.save();
}

export function handleTransfer(ev: Transfer): void {
  // Skip mint/burn events (handled by TokensMinted and specific burn events)
  if (
    ev.params.from.toHex() == "0x0000000000000000000000000000000000000000" ||
    ev.params.to.toHex() == "0x0000000000000000000000000000000000000000"
  ) {
    return;
  }

  // Create transfer record
  const id = `${ev.transaction.hash.toHex()}${ev.logIndex.toString()}`;
  const transfer = new ThanksTokenTransfer(id);

  transfer.thanksToken = ev.address.toHex();
  transfer.from = ev.params.from.toHex();
  transfer.to = ev.params.to.toHex();
  transfer.amount = ev.params.value;
  transfer.workspaceId = getWorkspaceIdFromThanksToken(ev.address.toHex());
  transfer.blockTimestamp = ev.block.timestamp;
  transfer.blockNumber = ev.block.number;

  // Update balances
  updateThanksTokenBalance(
    ev.address.toHex(),
    ev.params.from,
    ev.params.value.neg(),
    getWorkspaceIdFromThanksToken(ev.address.toHex()),
    ev.block.timestamp,
  );
  updateThanksTokenBalance(
    ev.address.toHex(),
    ev.params.to,
    ev.params.value,
    getWorkspaceIdFromThanksToken(ev.address.toHex()),
    ev.block.timestamp,
  );

  transfer.save();
}

function updateThanksTokenBalance(
  thanksTokenAddress: string,
  account: Address,
  amount: GraphBigInt,
  workspaceId: string,
  timestamp: GraphBigInt,
): void {
  const balanceId = `${thanksTokenAddress}${account.toHex()}`;
  let balance = ThanksTokenBalance.load(balanceId);

  if (balance) {
    balance.balance = balance.balance.plus(amount);
  } else if (account.toHex() != "0x0000000000000000000000000000000000000000") {
    balance = new ThanksTokenBalance(balanceId);
    balance.thanksToken = thanksTokenAddress;
    balance.owner = account.toHex();
    balance.balance = amount;
    balance.workspaceId = workspaceId;
  }

  if (balance) {
    balance.updatedAt = timestamp;
    balance.save();
  }
}

// Helper function to get workspace ID from ThanksToken address
function getWorkspaceIdFromThanksToken(thanksTokenAddress: string): string {
  const thanksToken = ThanksToken.load(thanksTokenAddress);
  return thanksToken ? thanksToken.workspaceId : "";
}
