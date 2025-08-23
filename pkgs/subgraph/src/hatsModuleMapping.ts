import { Address, BigInt as GraphBigInt } from "@graphprotocol/graph-ts";
import {
  BalanceOfFractionToken,
  HatsFractionTokenModule,
  InitializedFractionToken,
  TransferFractionToken,
} from "../generated/schema";
import {
  InitialMint,
  TransferSingle,
} from "../generated/templates/HatsFractionTokenModule/HatsFractionTokenModule";

// failed to process trigger: block #9045576 (0x9f9f…1ec3), transaction 23157f0c260a4aa62d2000c834b6e1fc67c353dd4de4d6bca19e5b41fdf29f49: error while executing at wasm backtrace: 0: 0x365c - <unknown>!src/hatsModuleMapping/updateBalance 1: 0x3b8b - <unknown>!src/hatsModuleMapping/handleRoleShareTransferSingle: Entity BalanceOfFractionToken[634718699214179794530190354350675720613565149972855461858442661081604627901740x777ee5eeed30c3712bee6c83260d786857d9c556]: missing value for non-nullable field `hatsFractionTokenModule`: Entity BalanceOfFractionToken[634718699214179794530190354350675720613565149972855461858442661081604627901740x777ee5eeed30c3712bee6c83260d786857d9c556]: missing value for non-nullable field `hatsFractionTokenModule`

export function handleRoleShareInitialMint(ev: InitialMint): void {
  const module = HatsFractionTokenModule.load(ev.address.toHex());
  const id = `${ev.address.toHex()}-${ev.params.tokenId.toHexString()}`;

  if (module === null) {
    return;
  }

  let initializedEvent = InitializedFractionToken.load(id);
  if (initializedEvent) return;

  initializedEvent = new InitializedFractionToken(id);
  initializedEvent.hatsFractionTokenModule = module.id;
  initializedEvent.tokenId = ev.params.tokenId;
  initializedEvent.hatId = ev.params.hatId;
  initializedEvent.wearer = ev.params.wearer.toHex();
  initializedEvent.workspaceId = module.workspaceId;
  initializedEvent.blockTimestamp = ev.block.timestamp;
  initializedEvent.blockNumber = ev.block.number;

  initializedEvent.save();

  updateBalance(
    ev.params.tokenId,
    ev.params.wearer,
    ev.params.amount,
    initializedEvent,
    ev.block.timestamp,
  );
}

export function handleRoleShareTransferSingle(ev: TransferSingle): void {
  const module = HatsFractionTokenModule.load(ev.address.toHex());
  const id = `${ev.address.toHex()}-${ev.params.id.toHexString()}`;
  const initializedRoleShare = InitializedFractionToken.load(id);

  if (initializedRoleShare === null || module === null) {
    return;
  }

  let transfer = TransferFractionToken.load(
    `${ev.address.toHex()}-${ev.params.id.toHexString()}-${ev.params.to.toHexString()}-${ev.params.from.toHexString()}-${ev.block.number}`,
  );
  if (transfer) return;
  transfer = new TransferFractionToken(
    `${ev.address.toHex()}-${ev.params.id.toHexString()}-${ev.params.to.toHexString()}-${ev.params.from.toHexString()}-${ev.block.number}`,
  );
  transfer.hatsFractionTokenModule = module.id;
  transfer.from = ev.params.from.toHex();
  transfer.to = ev.params.to.toHex();
  transfer.tokenId = ev.params.id;
  transfer.amount = ev.params.value;
  transfer.workspaceId = module.workspaceId;
  transfer.blockTimestamp = ev.block.timestamp;
  transfer.blockNumber = ev.block.number;

  updateBalance(
    ev.params.id,
    ev.params.from,
    ev.params.value.neg(),
    initializedRoleShare,
    ev.block.timestamp,
  );

  updateBalance(
    ev.params.id,
    ev.params.to,
    ev.params.value,
    initializedRoleShare,
    ev.block.timestamp,
  );

  transfer.save();
}

function updateBalance(
  tokenId: GraphBigInt,
  account: Address,
  amount: GraphBigInt,
  initializedRoleShare: InitializedFractionToken,
  timestamp: GraphBigInt,
): void {
  let balance = BalanceOfFractionToken.load(
    `${initializedRoleShare.id}-${tokenId.toHex()}-${account.toHex()}`,
  );
  if (balance) {
    balance.balance = balance.balance.plus(amount);
    balance.updatedAt = timestamp;
  } else if (account.toHex() !== "0x0000000000000000000000000000000000000000") {
    balance = new BalanceOfFractionToken(
      `${initializedRoleShare.id}-${tokenId.toHex()}-${account.toHex()}`,
    );
    balance.owner = account.toHex();
    balance.tokenId = tokenId;
    balance.balance = amount;
    balance.updatedAt = timestamp;
  }

  if (balance && initializedRoleShare) {
    balance.hatsFractionTokenModule =
      initializedRoleShare.hatsFractionTokenModule;
    balance.workspaceId = initializedRoleShare.workspaceId;
    balance.hatId = initializedRoleShare.hatId;
    balance.wearer = initializedRoleShare.wearer;
  }

  if (balance) {
    balance.save();
  }
}
