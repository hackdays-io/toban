import { BigInt } from "@graphprotocol/graph-ts";
import { Executed } from "../generated/BigBang/BigBang";
import {
  HatsHatCreatorModule,
  HatsTimeFrameModule,
  ThanksToken,
  Workspace,
} from "../generated/schema";
import {
  HatsHatCreatorModule as HatsHatCreatorModuleTemplate,
  HatsTimeFrameModule as HatsTimeFrameModuleTemplate,
  ThanksToken as ThanksTokenTemplate,
} from "../generated/templates";
import { hatIdToTreeId } from "./helper/hat";

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
  workspace.thanksToken = ev.params.thanksToken.toHex();
  workspace.blockTimestamp = ev.block.timestamp;
  workspace.blockNumber = ev.block.number;

  workspace.save();

  // Create ThanksToken entity and start indexing
  const thanksToken = new ThanksToken(ev.params.thanksToken.toHex());
  thanksToken.workspaceId = treeId;
  thanksToken.address = ev.params.thanksToken.toHex();
  thanksToken.name = `ThanksToken ${ev.params.topHatId.toString()}`;
  thanksToken.symbol = `THX${ev.params.topHatId.toString()}`;
  thanksToken.totalSupply = BigInt.fromI32(0);
  thanksToken.blockTimestamp = ev.block.timestamp;
  thanksToken.blockNumber = ev.block.number;
  thanksToken.save();

  ThanksTokenTemplate.create(ev.params.thanksToken);

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
