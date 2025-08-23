import { Executed } from "../generated/BigBang/BigBang";
import {
  HatsFractionTokenModule,
  ThanksToken,
  Workspace,
} from "../generated/schema";
import { hatIdToTreeId } from "./helper/hat";
import {
  ThanksToken as ThanksTokenTemplate,
  HatsFractionTokenModule as HatsFractionTokenModuleTemplate,
} from "../generated/templates";

export function handleExecuted(ev: Executed): void {
  const treeId = hatIdToTreeId(ev.params.topHatId.toHexString());
  let workspace = new Workspace(treeId);

  workspace.topHatId = ev.params.topHatId;
  workspace.creator = ev.params.creator.toHex();
  workspace.owner = ev.params.owner.toHex();
  workspace.topHatId = ev.params.topHatId;
  workspace.hatterHatId = ev.params.hatterHatId;
  workspace.operatorHatId = ev.params.operatorHatId;
  workspace.creatorHatId = ev.params.creatorHatId;
  workspace.minterHatId = ev.params.minterHatId;
  workspace.hatsTimeFrameModule = ev.params.hatsTimeFrameModule.toHex();
  workspace.hatsHatCreatorModule = ev.params.hatsHatCreatorModule.toHex();
  workspace.hatsFractionTokenModule = ev.params.hatsFractionTokenModule.toHex();
  workspace.thanksToken = ev.params.thanksToken.toHex();
  workspace.splitCreator = ev.params.splitCreator.toHex();
  workspace.blockTimestamp = ev.block.timestamp;
  workspace.blockNumber = ev.block.number;

  workspace.save();

  const newHatsFractionTokenModule = new HatsFractionTokenModule(
    ev.params.hatsFractionTokenModule.toHex(),
  );
  newHatsFractionTokenModule.workspaceId = treeId;
  newHatsFractionTokenModule.save();

  HatsFractionTokenModuleTemplate.create(ev.params.hatsFractionTokenModule);

  const newThanksToken = new ThanksToken(ev.params.thanksToken.toHex());
  newThanksToken.workspaceId = treeId;
  newThanksToken.save();

  ThanksTokenTemplate.create(ev.params.thanksToken);
}
