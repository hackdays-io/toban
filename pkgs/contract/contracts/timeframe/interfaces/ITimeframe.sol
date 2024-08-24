// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface ITimeframe {
    /**
     * @dev Sets the timestamp when a specific hat was minted for a specific address.
     * Can only be called by the contract that handles the minting logic.
     * @param wearer The address of the person who received the hat.
     * @param hatId The ID of the hat that was minted.
     */
    function setWoreTime(address wearer, uint256 hatId) external;

    /**
     * @dev Gets the timestamp when a specific hat was minted for a specific address.
     * @param wearer The address of the person who received the hat.
     * @param hatId The ID of the hat that was minted.
     * @return The timestamp when the hat was minted.
     */
    function getWoreTime(address wearer, uint256 hatId) external view returns (uint256);

    /**
     * @dev Gets the elapsed time in seconds since the specific hat was minted for a specific address.
     * @param wearer The address of the person who received the hat.
     * @param hatId The ID of the hat that was minted.
     * @return The elapsed time in seconds.
     */
    function getWearingElapsedTime(address wearer, uint256 hatId) external view returns (uint256);
}
