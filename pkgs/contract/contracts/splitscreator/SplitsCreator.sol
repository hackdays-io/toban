// SPDX-License-Identifier: MIT

pragma solidity ^0.8.24;

import { ISplitsCreator } from "./ISplitsCreator.sol";
import { ISplitFactoryV2 } from "../splits/interfaces/ISplitFactoryV2.sol";
import { SplitV2Lib } from "../splits/libraries/SplitV2.sol";
import { IFractionToken } from "../fractiontoken/IFractionToken.sol";
import { IHatsTimeFrameModule } from "../timeframe/IHatsTimeFrameModule.sol";
import { ERC2771Context } from "@openzeppelin/contracts/metatx/ERC2771Context.sol";
import { Initializable } from "@openzeppelin/contracts/proxy/utils/Initializable.sol";

contract SplitsCreator is ISplitsCreator, ERC2771Context, Initializable {
	ISplitFactoryV2 public splitFactoryV2;

	IFractionToken public fractionToken;

	IHatsTimeFrameModule public hatsTimeFrameModule;

	constructor(
		address _splitFactoryV2,
		address _trustedForwarder
	) ERC2771Context(_trustedForwarder) {
		splitFactoryV2 = ISplitFactoryV2(_splitFactoryV2);
	}

	function initialize(
		address _hatsTimeFrameModule,
		address _fractionToken
	) external initializer {
		hatsTimeFrameModule = IHatsTimeFrameModule(_hatsTimeFrameModule);
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
		uint256[] memory roleMultipliersOfShareHolders = new uint256[](
			numOfShareHolders
		);
		uint256[] memory hatsTimeFrameMultipliersOfShareHolders = new uint256[](
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
				uint256 roleMultiplier = _splitInfo.multiplierTop /
					_splitInfo.multiplierBottom;
				uint256 hatsTimeFrameMultiplier = _getHatsTimeFrameMultiplier(
					_splitInfo.wearers[si],
					_splitInfo.hatId
				);

				// ロール保持者に対する分配の計算
				shareHolders[shareHolderIndex] = _splitInfo.wearers[si];
				warers[shareHolderIndex] = _splitInfo.wearers[si];
				hatIdsOfShareHolders[shareHolderIndex] = _splitInfo.hatId;
				roleMultipliersOfShareHolders[
					shareHolderIndex
				] = roleMultiplier;
				hatsTimeFrameMultipliersOfShareHolders[
					shareHolderIndex
				] = hatsTimeFrameMultiplier;
				shareHolderIndex++;

				// FractionTokenのホルダーに対する分配の計算
				address[] memory recipients = fractionToken.getTokenRecipients(
					tokenId
				);
				for (uint j = 0; j < recipients.length; j++) {
					shareHolders[shareHolderIndex] = recipients[j];
					warers[shareHolderIndex] = _splitInfo.wearers[si];
					hatIdsOfShareHolders[shareHolderIndex] = _splitInfo.hatId;
					roleMultipliersOfShareHolders[
						shareHolderIndex
					] = roleMultiplier;
					hatsTimeFrameMultipliersOfShareHolders[
						shareHolderIndex
					] = hatsTimeFrameMultiplier;
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
				roleMultipliersOfShareHolders[i];
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

	function _getHatsTimeFrameMultiplier(
		address _wearer,
		uint256 _hatId
	) internal view returns (uint256) {
		if (address(hatsTimeFrameModule) == address(0)) return 1;
		return
			_sqrt(hatsTimeFrameModule.getWearingElapsedTime(_wearer, _hatId));
	}

	function _sqrt(uint256 y) internal pure returns (uint256 z) {
		if (y > 3) {
			z = y;
			uint256 x = y / 2 + 1;
			while (x < z) {
				z = x;
				x = (y / x + x) / 2;
			}
		} else if (y != 0) {
			z = 1;
		}
		// else z = 0 (default value)
	}
}
