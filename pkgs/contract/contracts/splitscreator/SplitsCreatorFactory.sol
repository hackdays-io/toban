// SPDX-License-Identifier: MIT

pragma solidity ^0.8.24;

import { LibClone } from "solady/src/utils/LibClone.sol";
import { SplitsCreator } from "./SplitsCreator.sol";
import { ISplitsCreator } from "./ISplitsCreator.sol";
import { OwnableUpgradeable } from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

contract SplitsCreatorFactory is OwnableUpgradeable {
	event SplitCreatorCreated(
		address indexed creator,
		address indexed splitCreator,
		uint256 topHatId,
		address splitFactoryV2,
		address hatsTimeFrameModule,
		address fractionToken
	);

	address public SPLITS_CREATOR_IMPLEMENTATION;
	
	address public BIG_BANG;

	function initialize(
		address _splitsCreatorImplementation
	) public initializer {
		__Ownable_init(msg.sender);
		SPLITS_CREATOR_IMPLEMENTATION = _splitsCreatorImplementation;
	}

	function createSplitCreatorDeterministic(
		uint256 _topHatId,
		address _hats,
		address _splitFactoryV2,
		address _hatsTimeFrameModule,
		address _fractionToken,
		bytes32 _salt
	) external returns (address splitCreator) {
		if (_msgSender() != BIG_BANG) {
			revert("SplitsCreatorFactory: Only BigBang can call this function");
		}

		splitCreator = LibClone.cloneDeterministic(
			SPLITS_CREATOR_IMPLEMENTATION,
			abi.encode(
				_hats,
				_splitFactoryV2,
				_hatsTimeFrameModule,
				_fractionToken
			),
			_getSalt(
				_topHatId,
				_hats,
				_splitFactoryV2,
				_hatsTimeFrameModule,
				_fractionToken,
				_salt
			)
		);

		emit SplitCreatorCreated(
			msg.sender,
			splitCreator,
			_topHatId,
			_splitFactoryV2,
			_hatsTimeFrameModule,
			_fractionToken
		);
	}

	function predictDeterministicAddress(
		uint256 _topHatId,
		address _hats,
		address _splitFactoryV2,
		address _hatsTimeFrameModule,
		address _fractionToken,
		bytes32 _salt
	) external view returns (address) {
		return
			LibClone.predictDeterministicAddress(
				SPLITS_CREATOR_IMPLEMENTATION,
				abi.encode(
					_hats,
					_splitFactoryV2,
					_hatsTimeFrameModule,
					_fractionToken
				),
				_getSalt(
					_topHatId,
					_hats,
					_splitFactoryV2,
					_hatsTimeFrameModule,
					_fractionToken,
					_salt
				),
				address(this)
			);
	}

	function setImplementation(
		address _implementation
	) external onlyOwner {
		SPLITS_CREATOR_IMPLEMENTATION = _implementation;
	}

	function setBigBang(
		address _bigBang
	) external onlyOwner {
		BIG_BANG = _bigBang;
	}

	function _getSalt(
		uint256 _topHatId,
		address _hats,
		address _splitFactoryV2,
		address _hatsTimeFrameModule,
		address _fractionToken,
		bytes32 _salt
	) internal pure returns (bytes32) {
		return
			keccak256(
				abi.encodePacked(
					_topHatId,
					_hats,
					_splitFactoryV2,
					_hatsTimeFrameModule,
					_fractionToken,
					_salt
				)
			);
	}
}
