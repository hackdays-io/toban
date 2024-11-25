// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { IHatsTimeFrameModule } from "./IHatsTimeFrameModule.sol";
import { HatsModule } from "../hats/module/HatsModule.sol";
import { ERC2771Context } from "@openzeppelin/contracts/metatx/ERC2771Context.sol";

contract HatsTimeFrameModule is
	ERC2771Context,
	HatsModule,
	IHatsTimeFrameModule
{
	// hatId => wearer => wore timestamp
	mapping(uint256 => mapping(address => uint256)) public woreTime;

	// hatId => wearer => last deactivation timestamp
	mapping(uint256 => mapping(address => uint256)) public deactivatedTime;

	// hatId => wearer => total active time
	mapping(uint256 => mapping(address => uint256)) public totalActiveTime;

	// hatId => wearer => isActive
	mapping(uint256 => mapping(address => bool)) public isActive;

	/**
	 * @dev Constructor to initialize the trusted forwarder.
	 * @param _trustedForwarder Address of the trusted forwarder contract.
	 */
	constructor(
		address _trustedForwarder,
		string memory _version
	) ERC2771Context(_trustedForwarder) HatsModule(_version) {}

	function mintHat(uint256 hatId, address wearer) external {
		_setWoreTime(wearer, hatId);
		isActive[hatId][wearer] = true;
		HATS().mintHat(hatId, wearer);
	}

	/**
	 * @dev Deactivate the hat, pausing the contribution time.
	 * Calculate the contribution time up to deactivation.
	 * @param wearer The address of the person who received the hat.
	 * @param hatId The ID of the hat that was minted.
	 */
	function deactivate(uint256 hatId, address wearer) external {
		// msg.sender should be the owner of the hat or parent hat owner
		require(isActive[hatId][wearer], "Hat is already inactive");
		isActive[hatId][wearer] = false;
		deactivatedTime[hatId][wearer] = block.timestamp;
		totalActiveTime[hatId][wearer] +=
			block.timestamp -
			woreTime[hatId][wearer];
	}

	/**
	 * @dev Reactivate the hat, resuming the contribution time.
	 * Reset woreTime for new active period.
	 * @param wearer The address of the person who received the hat.
	 * @param hatId The ID of the hat that was minted.
	 */
	function reactivate(uint256 hatId, address wearer) external {
		require(!isActive[hatId][wearer], "Hat is already active");
		isActive[hatId][wearer] = true;
		woreTime[hatId][wearer] = block.timestamp;
	}

	/**
	 * @dev Sets the timestamp when a specific hat was minted for a specific address.
	 * Can only be called by the contract that handles the minting logic.
	 * @param hatId The ID of the hat that was minted.
	 */
	function _setWoreTime(address wearer, uint256 hatId) internal {
		require(woreTime[hatId][wearer] == 0, "Hat already minted");
		woreTime[hatId][wearer] = block.timestamp;
	}

	/**
	 * @dev Gets the timestamp when a specific hat was minted for a specific address.
	 * @param wearer The address of the person who received the hat.
	 * @param hatId The ID of the hat that was minted.
	 */
	function getWoreTime(
		address wearer,
		uint256 hatId
	) external view returns (uint256) {
		return woreTime[hatId][wearer];
	}

	/**
	 * @dev Gets the elapsed time in seconds since the specific hat was minted for a specific address.
	 * If the hat is active, calculate time from the last wear time to the current time.
	 * If the hat is inactive, calculate time up to the deactivation.
	 * @param wearer The address of the person who received the hat.
	 * @param hatId The ID of the hat that was minted.
	 * @return The elapsed time in seconds.
	 */
	function getWearingElapsedTime(
		address wearer,
		uint256 hatId
	) external view returns (uint256) {
		uint256 activeTime = totalActiveTime[hatId][wearer];

		if (isActive[hatId][wearer]) {
			// If active, calculate time from the last woreTime to the current time
			activeTime += block.timestamp - woreTime[hatId][wearer];
		}

		return activeTime;
	}

	/**
	 * @dev Override _msgSender to use the context from ERC2771Context.
	 * @return The message sender address.
	 */
	function _msgSender()
		internal
		view
		override(ERC2771Context)
		returns (address)
	{
		return ERC2771Context._msgSender();
	}

	/**
	 * @dev Override _msgData to use the context from ERC2771Context.
	 * @return The calldata of the message.
	 */
	function _msgData()
		internal
		view
		override(ERC2771Context)
		returns (bytes calldata)
	{
		return ERC2771Context._msgData();
	}
}
