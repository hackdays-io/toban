// SPDX-License-Identifier: MIT

pragma solidity ^0.8.24;

import { ISplitsCreator } from "./ISplitsCreator.sol";
import { ISplitFactoryV2 } from "../splits/interfaces/ISplitFactoryV2.sol";
import { SplitV2Lib } from "../splits/libraries/SplitV2.sol";
import { IFractionToken } from "../fractiontoken/IFractionToken.sol";
import { ERC2771Context } from "@openzeppelin/contracts/metatx/ERC2771Context.sol";

contract SplitsCreator is ISplitsCreator, ERC2771Context {
	ISplitFactoryV2 splitFactoryV2;

	IFractionToken fractionToken;

	constructor(
		address _splitFactoryV2,
		address _fractionToken,
		address _trustedForwarder
	) ERC2771Context(_trustedForwarder) {
		splitFactoryV2 = ISplitFactoryV2(_splitFactoryV2);
		fractionToken = IFractionToken(_fractionToken);
	}

	function create(
		SplitsInfo[] memory _splitInfos
	) external returns (address) {
		uint256 numOfShareHolders = 0;
		for (uint i = 0; i < _splitInfos.length; i++) {
			SplitsInfo memory _splitInfo = _splitInfos[i];
			for (uint si = 0; si < _splitInfo.wearers.length; si++) {
				uint256 tokenId = fractionToken.getTokenId(
					_splitInfo.hatId,
					_splitInfo.wearers[si]
				);
				address[] memory recepients = fractionToken.getTokenRecipients(
					tokenId
				);
				numOfShareHolders += recepients.length + 1;
			}
		}

		address[] memory shareHolders = new address[](numOfShareHolders);
		address[] memory warers = new address[](numOfShareHolders);
		uint256[] memory hatIdsOfShareHolders = new uint256[](
			numOfShareHolders
		);
		uint256[] memory multipliersOfShareHolders = new uint256[](
			numOfShareHolders
		);

		uint256 shareHolderIndex = 0;

		for (uint i = 0; i < _splitInfos.length; i++) {
			SplitsInfo memory _splitInfo = _splitInfos[i];
			for (uint si = 0; si < _splitInfo.wearers.length; si++) {
				uint256 tokenId = fractionToken.getTokenId(
					_splitInfo.hatId,
					_splitInfo.wearers[si]
				);
				uint256 multiplier = _splitInfo.multiplierTop /
					_splitInfo.multiplierBottom;

				shareHolders[shareHolderIndex] = _splitInfo.wearers[si];
				warers[shareHolderIndex] = _splitInfo.wearers[si];
				hatIdsOfShareHolders[shareHolderIndex] = _splitInfo.hatId;
				multipliersOfShareHolders[shareHolderIndex] = multiplier;
				shareHolderIndex++;

				address[] memory recipients = fractionToken.getTokenRecipients(
					tokenId
				);
				for (uint j = 0; j < recipients.length; j++) {
					shareHolders[shareHolderIndex] = recipients[j];
					warers[shareHolderIndex] = _splitInfo.wearers[si];
					hatIdsOfShareHolders[shareHolderIndex] = _splitInfo.hatId;
					multipliersOfShareHolders[shareHolderIndex] = multiplier;
					shareHolderIndex++;
				}
			}
		}

		uint256[] memory balanceOfShareHolders = fractionToken.balanceOfBatch(
			shareHolders,
			warers,
			hatIdsOfShareHolders
		);

		uint256 totalAllocation = 0;
		uint256[] memory allocations = new uint256[](shareHolderIndex);
		for (uint i = 0; i < shareHolderIndex; i++) {
			uint256 share = balanceOfShareHolders[i] *
				multipliersOfShareHolders[i];
			totalAllocation += share;
			allocations[i] = share;
		}

		SplitV2Lib.Split memory _splitParams = SplitV2Lib.Split({
			recipients: shareHolders,
			allocations: allocations,
			totalAllocation: totalAllocation,
			distributionIncentive: 0
		});

		address split = splitFactoryV2.createSplit(
			_splitParams,
			address(this),
			msg.sender
		);

		emit SplitsCreated(split);

		return split;
	}
}
