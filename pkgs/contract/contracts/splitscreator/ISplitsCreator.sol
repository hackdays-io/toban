// SPDX-License-Identifier: MIT

pragma solidity ^0.8.24;

interface ISplitsCreator {
	struct SplitsInfo {
		uint256 hatId;
		uint256 multiplierBottom;
		uint256 multiplierTop;
		address[] wearers;
	}

	event SplitsCreated(address split);

	function initialize(
		address _hatsTimeFrameModule,
		address _fractionToken
	) external;

	function create(SplitsInfo[] memory _splitInfos) external returns (address);
}
