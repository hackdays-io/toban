// SPDX-License-Identifier: MIT

pragma solidity ^0.8.24;

interface ISplitsCreatorFactory {
	function SPLITS_CREATOR_IMPLEMENTATION() external view returns (address);

	function createSplitCreatorDeterministic(
		uint256 _topHatId,
		address _hats,
		address _splitFactoryV2,
		address _hatsTimeFrameModule,
		address _fractionToken,
		bytes32 _salt
	) external returns (address);
}
