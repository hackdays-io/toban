// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IScheduledDistributor} from "./IScheduledDistributor.sol";

interface IScheduledDistributorFactory {
	event ScheduledDistributorCreated(
		address indexed distributor,
		address indexed scheduler,
		address splitsCreator,
		address[] tokens,
		uint256 scheduledDate,
		bytes32 salt
	);

	function createScheduledDistributor(
		IScheduledDistributor.InitParams calldata params,
		bytes32 salt
	) external returns (address distributor);

	function predictScheduledDistributorAddress(
		address scheduler,
		bytes32 salt
	) external view returns (address);
}
