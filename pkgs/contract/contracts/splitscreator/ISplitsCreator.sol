// SPDX-License-Identifier: MIT

pragma solidity ^0.8.24;

interface ISplitsCreator {
	struct SplitsInfo {
		uint256 hatId;
		uint256 multiplierBottom;
		uint256 multiplierTop;
		address[] wearers;
	}

	event SplitsCreated(
		address split,
		address[] shareHolders,
		uint256[] allocations,
		uint256 totalAllocation
	);

	function create(SplitsInfo[] memory _splitInfos) external returns (address);
}
