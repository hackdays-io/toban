// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IScheduledDistributor} from "./IScheduledDistributor.sol";

interface IScheduledDistributorFactory {
	event ScheduledDistributorCreated(
		address indexed distributor,
		address indexed scheduler,
		address splitsCreator,
		address[] tokens,
		address backupWallet,
		uint256 scheduledDate,
		bytes32 salt
	);

	function createScheduledDistributor(
		IScheduledDistributor.InitParams calldata params,
		bytes32 salt
	) external returns (address distributor);

	/**
	 * @notice Off-chain helper that predicts the clone address for a given
	 *         (scheduler, salt) pair.
	 * @dev `scheduler` MUST be the exact address that will call
	 *      `createScheduledDistributor` (i.e. `msg.sender` of that call).
	 *      Under account abstraction this is typically the smart wallet, NOT
	 *      the user's EOA. If the predicted address is used for pre-funding,
	 *      passing the wrong scheduler will silently leak funds to a dead
	 *      address.
	 */
	function predictScheduledDistributorAddress(
		address scheduler,
		bytes32 salt
	) external view returns (address);
}
