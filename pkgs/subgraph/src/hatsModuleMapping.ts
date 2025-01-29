import {
  HatsHatCreatorModule,
  HatsHatCreatorModuleAuthority,
  HatsTimeFrameModule,
  HatsTimeFrameModuleAuthority,
} from "../generated/schema";
import {
  CreateHatAuthorityGranted,
  CreateHatAuthorityRevoked,
} from "../generated/templates/HatsHatCreatorModule/HatsHatCreatorModule";
import {
  OperationAuthorityGranted,
  OperationAuthorityRevoked,
} from "../generated/templates/HatsTimeFrameModule/HatsTimeFrameModule";

export function handleOperationAuthorityGranted(
  ev: OperationAuthorityGranted,
): void {
  const module = HatsTimeFrameModule.load(ev.address.toHex());

  if (module === null) {
    return;
  }

  let authority = HatsTimeFrameModuleAuthority.load(
    `${ev.address.toHex()}-${ev.params.authority.toHexString()}`,
  );
  if (authority) {
    authority.authorised = true;
  } else {
    authority = new HatsTimeFrameModuleAuthority(
      `${ev.address.toHex()}-${ev.params.authority.toHexString()}`,
    );
    authority.workspaceId = module.workspaceId;
    authority.address = ev.params.authority.toHex();
    authority.authorised = true;
    authority.blockNumber = ev.block.number;
    authority.blockTimestamp = ev.block.timestamp;
  }
  authority.save();
}

export function handleOperationAuthorityRevoked(
  ev: OperationAuthorityRevoked,
): void {
  const module = HatsTimeFrameModule.load(ev.address.toHex());

  if (module === null) {
    return;
  }

  let authority = HatsTimeFrameModuleAuthority.load(
    `${ev.address.toHex()}-${ev.params.authority.toHexString()}`,
  );
  if (authority) {
    authority.authorised = false;
  } else {
    authority = new HatsTimeFrameModuleAuthority(
      `${ev.address.toHex()}-${ev.params.authority.toHexString()}`,
    );
    authority.workspaceId = module.workspaceId;
    authority.address = ev.params.authority.toHex();
    authority.authorised = false;
    authority.blockNumber = ev.block.number;
    authority.blockTimestamp = ev.block.timestamp;
  }
  authority.save();
}

export function handleCreateHatAuthorityGranted(
  ev: CreateHatAuthorityGranted,
): void {
  const module = HatsHatCreatorModule.load(ev.address.toHex());

  if (module === null) {
    return;
  }

  let authority = HatsHatCreatorModuleAuthority.load(
    `${ev.address.toHex()}-${ev.params.authority.toHexString()}`,
  );
  if (authority) {
    authority.authorised = true;
  } else {
    authority = new HatsHatCreatorModuleAuthority(
      `${ev.address.toHex()}-${ev.params.authority.toHexString()}`,
    );
    authority.workspaceId = module.workspaceId;
    authority.address = ev.params.authority.toHex();
    authority.authorised = true;
    authority.blockNumber = ev.block.number;
    authority.blockTimestamp = ev.block.timestamp;
  }
  authority.save();
}

export function handleCreateHatAuthorityRevoked(
  ev: CreateHatAuthorityRevoked,
): void {
  const module = HatsHatCreatorModule.load(ev.address.toHex());

  if (module === null) {
    return;
  }

  let authority = HatsHatCreatorModuleAuthority.load(
    `${ev.address.toHex()}-${ev.params.authority.toHexString()}`,
  );
  if (authority) {
    authority.authorised = false;
  } else {
    authority = new HatsHatCreatorModuleAuthority(
      `${ev.address.toHex()}-${ev.params.authority.toHexString()}`,
    );
    authority.workspaceId = module.workspaceId;
    authority.address = ev.params.authority.toHex();
    authority.authorised = false;
    authority.blockNumber = ev.block.number;
    authority.blockTimestamp = ev.block.timestamp;
  }
  authority.save();
}
