// SPDX-License-Identifier: MIT

pragma solidity ^0.8.24;

interface ISplitsCreator {
	struct SplitsInfo {
		uint256 hatId;
		uint256 multiplierBottom;
		uint256 multiplierTop;
		address[] wearers;
	}

	struct WeightsInfo {
		uint256 roleWeight;
		uint256 thanksTokenWeight;
		uint256 thanksTokenReceivedWeight;
		uint256 thanksTokenSentWeight;
	}

	event SplitsCreated(
		address split,
		address[] shareHolders,
		uint256[] allocations,
		uint256 totalAllocation
	);

	function create(SplitsInfo[] memory _splitInfos, WeightsInfo memory _weightsInfo) external returns (address);

	function createWithSalt(
		SplitsInfo[] memory _splitInfos,
		WeightsInfo memory _weightsInfo,
		bytes32 _salt
	) external returns (address);

	function preview(
		SplitsInfo[] memory _splitsInfo,
		WeightsInfo memory _weightsInfo
	) external view returns (
		address[] memory shareHolders,
		uint256[] memory allocations,
		uint256 totalAllocation
	);
}
