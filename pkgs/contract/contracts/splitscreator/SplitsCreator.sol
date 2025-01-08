// SPDX-License-Identifier: MIT

pragma solidity ^0.8.24;

import { IHats } from "../hats/src/Interfaces/IHats.sol";
import { ISplitsCreator } from "./ISplitsCreator.sol";
import { ISplitFactoryV2 } from "../splits/interfaces/ISplitFactoryV2.sol";
import { SplitV2Lib } from "../splits/libraries/SplitV2.sol";
import { IFractionToken } from "../fractiontoken/IFractionToken.sol";
import { IHatsTimeFrameModule } from "../timeframe/IHatsTimeFrameModule.sol";
import { Clone } from "solady/src/utils/Clone.sol";

contract SplitsCreator is ISplitsCreator, Clone {
	function HATS() public pure returns (IHats) {
		return IHats(_getArgAddress(12));
	}

	function SPLIT_FACTORY_V2() public pure returns (ISplitFactoryV2) {
		return ISplitFactoryV2(_getArgAddress(44));
	}

	function HATS_TIME_FRAME_MODULE()
		public
		pure
		returns (IHatsTimeFrameModule)
	{
		return IHatsTimeFrameModule(_getArgAddress(76));
	}

	function FRACTION_TOKEN() public pure returns (IFractionToken) {
		return IFractionToken(_getArgAddress(108));
	}

	/**
	 * @notice Creates a new split contract based on the provided splits information.
	 * @param _splitsInfo An array of SplitsInfo structs containing details about roles, wearers, and multipliers.
	 * @return The address of the newly created split contract.
	 */
	function create(
		SplitsInfo[] memory _splitsInfo
	) external returns (address) {
		(
			address[] memory shareHolders,
			uint256[] memory allocations,
			uint256 totalAllocation
		) = _calculateAllocations(_splitsInfo);

		SplitV2Lib.Split memory _splitParams = SplitV2Lib.Split({
			recipients: shareHolders,
			allocations: allocations,
			totalAllocation: totalAllocation,
			distributionIncentive: 0
		});

		address split = SPLIT_FACTORY_V2().createSplitDeterministic(
			_splitParams,
			address(this),
			msg.sender,
			_generateSalt(_splitsInfo)
		);

		emit SplitsCreated(split, shareHolders, allocations, totalAllocation);

		return split;
	}

	/**
	 * @notice Previews the allocations without creating a split contract.
	 * @param _splitsInfo An array of SplitsInfo structs containing details about roles, wearers, and multipliers.
	 * @return shareHolders An array of shareholder addresses.
	 * @return allocations Corresponding allocations for each shareholder.
	 * @return totalAllocation Sum of all allocations.
	 */
	function preview(
		SplitsInfo[] memory _splitsInfo
	)
		external
		view
		returns (
			address[] memory shareHolders,
			uint256[] memory allocations,
			uint256 totalAllocation
		)
	{
		(shareHolders, allocations, totalAllocation) = _calculateAllocations(
			_splitsInfo
		);
	}

	/**
	 * @dev Internal function to calculate allocations for shareholders.
	 * @param _splitsInfo An array of SplitsInfo structs containing details about roles, wearers, and multipliers.
	 * @return shareHolders An array of shareholder addresses.
	 * @return allocations Corresponding allocations for each shareholder.
	 * @return totalAllocation Sum of all allocations.
	 */
	function _calculateAllocations(
		SplitsInfo[] memory _splitsInfo
	)
		internal
		view
		returns (
			address[] memory shareHolders,
			uint256[] memory allocations,
			uint256 totalAllocation
		)
	{
		uint256 numOfShareHolders = 0;
		for (uint256 i = 0; i < _splitsInfo.length; i++) {
			SplitsInfo memory _splitInfo = _splitsInfo[i];
			for (uint256 si = 0; si < _splitInfo.wearers.length; si++) {
				address[] memory recipients = FRACTION_TOKEN()
					.getTokenRecipients(
						FRACTION_TOKEN().getTokenId(
							_splitInfo.hatId,
							_splitInfo.wearers[si]
						)
					);
				if (recipients.length == 0) {
					numOfShareHolders++;
				} else {
					numOfShareHolders += recipients.length;
				}
			}
		}

		shareHolders = new address[](numOfShareHolders);
		allocations = new uint256[](numOfShareHolders);
		uint256 shareHolderIndex = 0;

		for (uint256 i = 0; i < _splitsInfo.length; i++) {
			SplitsInfo memory _splitInfo = _splitsInfo[i];

			uint256 roleMultiplier = _splitInfo.multiplierTop /
				_splitInfo.multiplierBottom;

			uint256 fractionTokenSupply = 0;
			uint256 currentShareHolderIndex = shareHolderIndex;
			for (uint256 j = 0; j < _splitInfo.wearers.length; j++) {
				uint256 hatsTimeFrameMultiplier = _getHatsTimeFrameMultiplier(
					_splitInfo.wearers[j],
					_splitInfo.hatId
				);

				fractionTokenSupply += FRACTION_TOKEN().totalSupply(
					_splitInfo.wearers[j],
					_splitInfo.hatId
				);

				uint256 wearerBalance = FRACTION_TOKEN().balanceOf(
					_splitInfo.wearers[j],
					_splitInfo.wearers[j],
					_splitInfo.hatId
				);

				uint256 wearerScore = wearerBalance *
					roleMultiplier *
					hatsTimeFrameMultiplier;

				shareHolders[shareHolderIndex] = _splitInfo.wearers[j];
				allocations[shareHolderIndex] = wearerScore;

				shareHolderIndex++;

				address[] memory recipients = FRACTION_TOKEN()
					.getTokenRecipients(
						FRACTION_TOKEN().getTokenId(
							_splitInfo.hatId,
							_splitInfo.wearers[j]
						)
					);

				for (uint256 k = 0; k < recipients.length; k++) {
					if (recipients[k] == _splitInfo.wearers[j]) continue;

					uint256 recipientBalance = FRACTION_TOKEN().balanceOf(
						recipients[k],
						_splitInfo.wearers[j],
						_splitInfo.hatId
					);

					uint256 recipientScore = recipientBalance *
						roleMultiplier *
						hatsTimeFrameMultiplier;

					shareHolders[shareHolderIndex] = recipients[k];
					allocations[shareHolderIndex] = recipientScore;
					shareHolderIndex++;
				}
			}

			for (uint256 l = 0; l < allocations.length; l++) {
				if (l >= currentShareHolderIndex && l < shareHolderIndex) {
					allocations[l] =
						(allocations[l] * 10e5) /
						fractionTokenSupply;
				}
			}
		}

		totalAllocation = 0;
		for (uint256 i = 0; i < allocations.length; i++) {
			totalAllocation += allocations[i];
		}

		return (shareHolders, allocations, totalAllocation);
	}

	function _getHatsTimeFrameMultiplier(
		address _wearer,
		uint256 _hatId
	) internal view returns (uint256) {
		if (address(HATS_TIME_FRAME_MODULE()) == address(0)) return 1;
		return
			_sqrt(
				HATS_TIME_FRAME_MODULE().getWearingElapsedTime(_wearer, _hatId)
			);
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

	function _generateSalt(
		SplitsInfo[] memory splitsInfo
	) internal pure returns (bytes32) {
		return keccak256(abi.encode(splitsInfo));
	}
}
