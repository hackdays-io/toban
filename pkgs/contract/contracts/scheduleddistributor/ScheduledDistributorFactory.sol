// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {OwnableUpgradeable} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import {UUPSUpgradeable} from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import {LibClone} from "solady/src/utils/LibClone.sol";
import {IScheduledDistributor} from "./IScheduledDistributor.sol";
import {IScheduledDistributorFactory} from "./IScheduledDistributorFactory.sol";

/**
 * @title ScheduledDistributorFactory
 * @notice Opt-in factory that deploys per-reservation ScheduledDistributor
 *         clones. Permissionless: anyone may create a distributor for a
 *         workspace they have rights to (the rule itself names a SplitsCreator
 *         and confirmed wearers; this factory does no workspace-level access
 *         check). One clone = one reservation.
 */
contract ScheduledDistributorFactory is
	OwnableUpgradeable,
	UUPSUpgradeable,
	IScheduledDistributorFactory
{
	address public IMPLEMENTATION;
	address public HATS;

	function initialize(
		address _initialOwner,
		address _implementation,
		address _hatsAddress
	) public initializer {
		__Ownable_init(_initialOwner);
		__UUPSUpgradeable_init();
		IMPLEMENTATION = _implementation;
		HATS = _hatsAddress;
	}

	function createScheduledDistributor(
		IScheduledDistributor.InitParams calldata params,
		bytes32 salt
	) external override returns (address distributor) {
		IScheduledDistributor.InitParams memory rule = params;
		rule.scheduler = msg.sender;
		rule.hats = HATS;

		distributor = LibClone.cloneDeterministic(
			IMPLEMENTATION,
			_getSalt(msg.sender, salt)
		);

		IScheduledDistributor(distributor).initialize(rule);

		emit ScheduledDistributorCreated(
			distributor,
			msg.sender,
			rule.splitsCreator,
			rule.tokens,
			rule.scheduledDate,
			salt
		);
	}

	function predictScheduledDistributorAddress(
		address scheduler,
		bytes32 salt
	) external view override returns (address) {
		return
			LibClone.predictDeterministicAddress(
				IMPLEMENTATION,
				_getSalt(scheduler, salt),
				address(this)
			);
	}

	function setImplementation(address _implementation) external onlyOwner {
		IMPLEMENTATION = _implementation;
	}

	function setHats(address _hatsAddress) external onlyOwner {
		HATS = _hatsAddress;
	}

	function _getSalt(
		address scheduler,
		bytes32 salt
	) internal pure returns (bytes32) {
		return keccak256(abi.encodePacked(scheduler, salt));
	}

	function _authorizeUpgrade(
		address newImplementation
	) internal override onlyOwner {}
}
