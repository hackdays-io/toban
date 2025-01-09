import { BigInt, BigDecimal } from "@graphprotocol/graph-ts";
import { Executed } from "../generated/BigBang/BigBang";
import {
	InitialMint,
	TransferSingle,
} from "../generated/FractionToken/FractionToken";

import {
	Workspace,
	InitializedFractionToken,
	TransferFractionToken,
} from "../generated/schema";

function hatIdToTreeId(hatId: string): string {
	const id = parseInt("0x" + hatId.slice(2).padStart(64, "0").substring(0, 8))
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
	workspace.splitCreator = ev.params.splitCreator.toHex();
	workspace.blockTimestamp = ev.block.timestamp;
	workspace.blockNumber = ev.block.number;

	workspace.save();
}

export function handleInitialMint(ev: InitialMint): void {
	let initializedFractionToken = new InitializedFractionToken(
		ev.params.tokenId.toHex()
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
		ev.params.id.toHex()
	);

	let transfer = new TransferFractionToken(id);
	transfer.id = `${ev.address}${ev.params.id}`;
	transfer.workspaceId = "";
	transfer.holderAddress = ev.params.from.toHex();
	transfer.hatId = BigInt.fromString("0");
	transfer.wearer = "";
	transfer.tokenId = ev.params.id;
	transfer.balance = ev.params.value; // TODO: 送金前の残高から送金額のvalueを引く
	transfer.updatedAt = ev.block.timestamp;

	if (initializedFractionToken) {
		transfer.workspaceId = initializedFractionToken.workspaceId;
		transfer.hatId = initializedFractionToken.hatId;
		transfer.wearer = initializedFractionToken.wearer;
	}

	transfer.save();
}
