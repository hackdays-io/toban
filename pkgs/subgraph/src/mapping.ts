import { BigInt as GraphBigInt } from "@graphprotocol/graph-ts";
import { Executed } from "../generated/BigBang/BigBang";
import {
  InitialMint,
  TransferSingle,
} from "../generated/FractionToken/FractionToken";
import {
  HatsHatCreatorModule as HatsHatCreatorModuleTemplate,
  HatsTimeFrameModule as HatsTimeFrameModuleTemplate,
} from "../generated/templates";

import {
  HatsHatCreatorModule,
  HatsTimeFrameModule,
  InitializedFractionToken,
  TransferFractionToken,
  Workspace,
} from "../generated/schema";

function hatIdToTreeId(hatId: string): string {
  const id = Number.parseInt(
    `0x${hatId.slice(2).padStart(64, "0").substring(0, 8)}`,
  )
    .toString()
    .split(".")[0];
  return id;
}

export function handleExecuted(ev: Executed): void {
  const treeId = hatIdToTreeId(ev.params.topHatId.toHexString());
  let workspace = new Workspace(treeId);

  workspace.topHatId = ev.params.topHatId;
  workspace.creator = ev.params.creator.toHex();
  workspace.topHatId = ev.params.topHatId;
  workspace.hatterHatId = ev.params.hatterHatId;
  workspace.hatsTimeFrameModule = ev.params.hatsTimeFrameModule.toHex();
  workspace.hatsHatCreatorModule = ev.params.hatsHatCreatorModule.toHex();
  workspace.splitCreator = ev.params.splitCreator.toHex();
  workspace.blockTimestamp = ev.block.timestamp;
  workspace.blockNumber = ev.block.number;

  workspace.save();

  // Create new index from template for HatsModules
  const newHatsHatCreatorModule = new HatsHatCreatorModule(
    ev.params.hatsHatCreatorModule.toHex(),
  );
  newHatsHatCreatorModule.workspaceId = treeId;
  newHatsHatCreatorModule.save();

  HatsHatCreatorModuleTemplate.create(ev.params.hatsHatCreatorModule);

  const newHatsTimeFrameModule = new HatsTimeFrameModule(
    ev.params.hatsTimeFrameModule.toHex(),
  );
  newHatsTimeFrameModule.workspaceId = treeId;
  newHatsTimeFrameModule.save();

  HatsTimeFrameModuleTemplate.create(ev.params.hatsTimeFrameModule);
}

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
  const id =
    ev.transaction.hash.toHex() +
    ev.params.id.toHex() +
    ev.params.from.toHex() +
    ev.params.to.toHex();
  const initializedFractionToken = InitializedFractionToken.load(
    ev.params.id.toHex(),
  );

  const transfer = new TransferFractionToken(id);
  transfer.from = ev.params.from.toHex();
  transfer.to = ev.params.to.toHex();
  transfer.tokenId = ev.params.id;
  transfer.amount = ev.params.value;
  transfer.workspaceId = "";
  transfer.hatId = GraphBigInt.fromString("0");
  transfer.wearer = "";
  transfer.blockNumber = ev.block.number;
  transfer.blockTimestamp = ev.block.timestamp;

  if (initializedFractionToken) {
    transfer.workspaceId = initializedFractionToken.workspaceId;
    transfer.hatId = initializedFractionToken.hatId;
    transfer.wearer = initializedFractionToken.wearer;
  }

  transfer.save();
}
