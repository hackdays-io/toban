// SPDX-License-Identifier: MIT

pragma solidity ^0.8.24;

import { LibClone } from "solady/src/utils/LibClone.sol";
import { SplitsCreator } from "./SplitsCreator.sol";

contract SplitsCreatorFactory {
	event SplitCreatorCreated(
		address indexed creator,
		address indexed splitCreator,
		uint256 topHatId,
		address hatsTimeFrameModule,
		address fractionToken
	);

	address public immutable SPLITS_CREATOR_IMPLEMENTATION;

	constructor(address _splitsCreatorImplementation) {
		SPLITS_CREATOR_IMPLEMENTATION = _splitsCreatorImplementation;
	}

	function createSplitCreatorDeterministic(
		uint256 _topHatId,
		address _hatsTimeFrameModule,
		address _fractionToken,
		bytes32 _salt
	) external returns (address splitCreator) {
		splitCreator = LibClone.cloneDeterministic(
			SPLITS_CREATOR_IMPLEMENTATION,
			_getSalt(_topHatId, _hatsTimeFrameModule, _fractionToken, _salt)
		);

		SplitsCreator(splitCreator).initialize(
			_hatsTimeFrameModule,
			_fractionToken
		);

		emit SplitCreatorCreated(
			splitCreator,
			splitCreator,
			_topHatId,
			_hatsTimeFrameModule,
			_fractionToken
		);
	}

	function predictDeterministicAddress(
		uint256 _topHatId,
		address _hatsTimeFrameModule,
		address _fractionToken,
		bytes32 _salt
	) external view returns (address) {
		return
			LibClone.predictDeterministicAddress(
				SPLITS_CREATOR_IMPLEMENTATION,
				_getSalt(
					_topHatId,
					_hatsTimeFrameModule,
					_fractionToken,
					_salt
				),
				address(this)
			);
	}

	function _getSalt(
		uint256 _topHatId,
		address _hatsTimeFrameModule,
		address _fractionToken,
		bytes32 _salt
	) internal pure returns (bytes32) {
		return
			keccak256(
				abi.encodePacked(
					_topHatId,
					_hatsTimeFrameModule,
					_fractionToken,
					_salt
				)
			);
	}
}
