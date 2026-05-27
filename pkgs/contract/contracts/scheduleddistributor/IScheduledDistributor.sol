// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ISplitsCreator} from "../splitscreator/ISplitsCreator.sol";

interface IScheduledDistributor {
	struct InitParams {
		address hats;
		address splitsCreator;
		address scheduler;
		address[] tokens;
		address backupWallet;
		uint256 scheduledDate;
		ISplitsCreator.WeightsInfo weights;
		uint256[] hatIds;
		uint256[] multiplierTops;
		uint256[] multiplierBottoms;
		address[][] confirmedWearers;
	}

	event RuleCreated(
		address indexed scheduler,
		address splitsCreator,
		address[] tokens,
		address backupWallet,
		uint256 scheduledDate
	);

	event Deposited(
		address indexed from,
		address indexed token,
		uint256 amount
	);

	event Executed(
		address indexed caller,
		address indexed split,
		address indexed token,
		uint256 amount
	);

	event Reclaimed(
		address indexed to,
		address indexed token,
		uint256 amount
	);

	function initialize(InitParams calldata params) external;

	function deposit(address token, uint256 amount) external;

	function execute(address[][] calldata wearersByHat) external;

	function reclaim() external;
}
