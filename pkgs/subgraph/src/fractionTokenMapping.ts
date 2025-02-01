import { Address, BigInt as GraphBigInt } from "@graphprotocol/graph-ts";
import {
  InitialMint,
  TransferSingle,
} from "../generated/FractionToken/FractionToken";
import {
  BalanceOfFractionToken,
  InitializedFractionToken,
  TransferFractionToken,
} from "../generated/schema";
import { hatIdToTreeId } from "./helper/hat";

export function handleInitialMint(ev: InitialMint): void {
  const initializedFractionToken = new InitializedFractionToken(
    ev.params.tokenId.toHex(),
  );
  const treeId = hatIdToTreeId(ev.params.hatId.toHexString());
  initializedFractionToken.hatId = ev.params.hatId;
  initializedFractionToken.wearer = ev.params.wearer.toHex();
  initializedFractionToken.workspaceId = treeId;
  initializedFractionToken.blockTimestamp = ev.block.timestamp;
  initializedFractionToken.blockNumber = ev.block.number;

  initializedFractionToken.save();
}

export function handleTransferSingle(ev: TransferSingle): void {
  const id = `${ev.transaction.hash.toHex()}${ev.params.id.toHex()}${ev.params.from.toHex()}${ev.params.to.toHex()}`;
  const initializedFractionToken = InitializedFractionToken.load(
    ev.params.id.toHex(),
  );

  // Save Transfer History
  const transfer = new TransferFractionToken(id);
  transfer.from = ev.params.from.toHex();
  transfer.to = ev.params.to.toHex();
  transfer.tokenId = ev.params.id;
  transfer.amount = ev.params.value;
  transfer.workspaceId = initializedFractionToken
    ? initializedFractionToken.workspaceId
    : "";
  transfer.hatId = initializedFractionToken
    ? initializedFractionToken.hatId
    : GraphBigInt.fromString("0");
  transfer.wearer = initializedFractionToken
    ? initializedFractionToken.wearer
    : "";
  transfer.blockNumber = ev.block.number;
  transfer.blockTimestamp = ev.block.timestamp;

  // Update Balance of Tokens
  updateBalance(
    ev.params.id,
    ev.params.from,
    ev.params.value.neg(),
    initializedFractionToken,
    ev.block.timestamp,
  );
  updateBalance(
    ev.params.id,
    ev.params.to,
    ev.params.value,
    initializedFractionToken,
    ev.block.timestamp,
  );

  transfer.save();
}

function updateBalance(
  tokenId: GraphBigInt,
  account: Address,
  amount: GraphBigInt,
  initializedFractionToken: InitializedFractionToken | null,
  timestamp: GraphBigInt,
): void {
  let balance = BalanceOfFractionToken.load(`${tokenId}${account.toHex()}`);

  if (balance) {
    balance.balance = balance.balance.plus(amount);
  } else if (account.toHex() != "0x0000000000000000000000000000000000000000") {
    balance = new BalanceOfFractionToken(`${tokenId}${account.toHex()}`);
    balance.owner = account.toHex();
    balance.tokenId = tokenId;
    balance.balance = amount;
    balance.updatedAt = timestamp;
  }

  if (balance && initializedFractionToken) {
    balance.workspaceId = initializedFractionToken.workspaceId;
    balance.hatId = initializedFractionToken.hatId;
    balance.wearer = initializedFractionToken.wearer;
  }

  if (balance) {
    balance.save();
  }
}
