// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { ITimeFrameHatModule } from "./interfaces/ITimeFrameHatModule.sol";
import { IHats } from "../hats/src/Interfaces/IHats.sol";
import { HatsModule } from "../hats/module/HatsModule.sol";
import "@openzeppelin/contracts/metatx/ERC2771Context.sol";

contract TimeFrameHatModule is ERC2771Context, HatsModule, ITimeFrameHatModule {
	IHats Hats;

	mapping(address => mapping(uint256 => uint256)) private woreTime;

	/**
	 * @dev Constructor to initialize the trusted forwarder.
	 * @param _trustedForwarder Address of the trusted forwarder contract.
	 */
	constructor(
		address _hatsAddress,
		address _trustedForwarder
	) ERC2771Context(_trustedForwarder) HatsModule("0.0.0") {
		Hats = IHats(_hatsAddress);
	}

	function mintHat(uint256 hatId, address wearer) external {
		Hats.mintHat(hatId, wearer);
		_setWoreTime(wearer, hatId);
	}

	/**
	 * @dev Sets the timestamp when a specific hat was minted for a specific address.
	 * Can only be called by the contract that handles the minting logic.
	 * @param hatId The ID of the hat that was minted.
	 */
	function _setWoreTime(address wearer, uint256 hatId) internal {
		require(woreTime[wearer][hatId] == 0, "Hat already minted");
		woreTime[wearer][hatId] = block.timestamp;
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
		return woreTime[wearer][hatId];
	}

	/**
	 * @dev Gets the elapsed time in seconds since the specific hat was minted for a specific address.
	 * @param wearer The address of the person who received the hat.
	 * @param hatId The ID of the hat that was minted.
	 * @return The elapsed time in seconds.
	 */
	function getWearingElapsedTime(
		address wearer,
		uint256 hatId
	) external view returns (uint256) {
		uint256 mintTime = woreTime[wearer][hatId];
		require(
			mintTime != 0,
			"Hat has not been minted for this wearer and hatId"
		);
		return block.timestamp - mintTime;
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
