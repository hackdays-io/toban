// MintThanksToken
// AmountOfMintThanksToken
// TransferThanksToken
// BalanceOfThanksToken

import { Address, BigInt as GraphBigInt } from "@graphprotocol/graph-ts";
import {
  AmountOfMintThanksToken,
  BalanceOfThanksToken,
  MintThanksToken,
  ThanksToken,
  TransferThanksToken,
} from "../generated/schema";
import {
  TokenMinted,
  Transfer,
} from "../generated/templates/ThanksToken/ThanksToken";

export function handleTokenMinted(ev: TokenMinted): void {
  const thanksToken = ThanksToken.load(ev.address.toHex());

  if (thanksToken === null) {
    return;
  }

  let tokenMinted = MintThanksToken.load(
    `${ev.params.from.toHex()}-${ev.params.to.toHex()}-${ev.block.number}`,
  );
  if (tokenMinted) return;

  tokenMinted = new MintThanksToken(
    `${ev.params.from.toHex()}-${ev.params.to.toHex()}-${ev.block.number}`,
  );
  tokenMinted.thanksToken = thanksToken.id;
  tokenMinted.from = ev.params.from.toHex();
  tokenMinted.to = ev.params.to.toHex();
  tokenMinted.amount = ev.params.amount;
  tokenMinted.workspaceId = thanksToken.workspaceId;
  tokenMinted.blockTimestamp = ev.block.timestamp;
  tokenMinted.blockNumber = ev.block.number;

  tokenMinted.save();

  let amountOfMint = AmountOfMintThanksToken.load(
    `${thanksToken.id}-${ev.params.from.toHex()}`,
  );
  if (amountOfMint) {
    amountOfMint.amount = amountOfMint.amount.plus(ev.params.amount);
    amountOfMint.updatedAt = ev.block.timestamp;
  } else {
    amountOfMint = new AmountOfMintThanksToken(
      `${thanksToken.id}-${ev.params.from.toHex()}`,
    );
    amountOfMint.thanksToken = thanksToken.id;
    amountOfMint.sender = ev.params.from.toHex();
    amountOfMint.amount = ev.params.amount;
    amountOfMint.workspaceId = thanksToken.workspaceId;
    amountOfMint.updatedAt = ev.block.timestamp;
  }
}

export function handleTransfer(ev: Transfer): void {
  const thanksToken = ThanksToken.load(ev.address.toHex());

  if (thanksToken === null) {
    return;
  }

  let transfer = TransferThanksToken.load(
    `${ev.address.toHex()}-${ev.params.from.toHex()}-${ev.params.to.toHex()}-${ev.params.value.toString()}-${ev.block.number}`,
  );
  if (transfer) return;

  transfer = new TransferThanksToken(
    `${ev.address.toHex()}-${ev.params.from.toHex()}-${ev.params.to.toHex()}-${ev.params.value.toString()}-${ev.block.number}`,
  );
  transfer.thanksToken = thanksToken.id;
  transfer.from = ev.params.from.toHex();
  transfer.to = ev.params.to.toHex();
  transfer.amount = ev.params.value;
  transfer.workspaceId = thanksToken.workspaceId;
  transfer.blockTimestamp = ev.block.timestamp;
  transfer.blockNumber = ev.block.number;
  transfer.save();

  updateBalance(
    thanksToken,
    ev.params.from,
    ev.params.value.neg(),
    ev.block.timestamp,
  );
  updateBalance(thanksToken, ev.params.to, ev.params.value, ev.block.timestamp);
}

function updateBalance(
  thanksToken: ThanksToken,
  account: Address,
  amount: GraphBigInt,
  timestamp: GraphBigInt,
) {
  let balance = BalanceOfThanksToken.load(
    `${thanksToken.id}-${account.toHex()}`,
  );
  if (balance) {
    balance.balance = balance.balance.plus(amount);
    balance.updatedAt = timestamp;
  } else if (account.toHex() !== "0x0000000000000000000000000000000000000000") {
    balance = new BalanceOfThanksToken(`${thanksToken.id}-${account.toHex()}`);
    balance.thanksToken = thanksToken.id;
    balance.owner = account.toHex();
    balance.balance = amount;
    balance.workspaceId = thanksToken.workspaceId;
    balance.updatedAt = timestamp;
  }

  if (balance) {
    balance.save();
  }
}
