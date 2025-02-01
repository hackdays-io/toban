import { Executed } from "../generated/BigBang/BigBang";
import {
  HatsHatCreatorModule,
  HatsTimeFrameModule,
  Workspace,
} from "../generated/schema";
import {
  HatsHatCreatorModule as HatsHatCreatorModuleTemplate,
  HatsTimeFrameModule as HatsTimeFrameModuleTemplate,
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
