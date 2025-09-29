// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IHatsTimeFrameModule {
    /**
     * @notice Checks if an address has mit hat authority
     * @param authority The address to check
     * @return bool Whether the address has authority
     */
    function hasAuthority(address authority) external view returns (bool);

    /**
     * @dev Gets the timestamp when a specific hat was minted for a specific address.
     * @param wearer The address of the person who received the hat.
     * @param hatId The ID of the hat that was minted.
     * @return The timestamp when the hat was minted.
     */
    function getWoreTime(
        address wearer,
        uint256 hatId
    ) external view returns (uint256);

    /**
     * @dev Gets the elapsed time in seconds since the specific hat was minted for a specific address.
     * @param wearer The address of the person who received the hat.
     * @param hatId The ID of the hat that was minted.
     * @return The elapsed time in seconds.
     */
    function getWearingElapsedTime(
        address wearer,
        uint256 hatId
    ) external view returns (uint256);

    /**
     * @dev Batch mint hats for multiple addresses with the same hat ID.
     * @param hatId The ID of the hat to be minted for all wearers.
     * @param wearers Array of addresses to receive the hat.
     * @param times Array of specific timestamps when each hat was minted (0 for current time).
     */
    function batchMintHat(
        uint256 hatId,
        address[] calldata wearers,
        uint256[] calldata times
    ) external;

    function woreTime(
        uint256 hatId,
        address wearer
    ) external view returns (uint256);

    function deactivatedTime(
        uint256 hatId,
        address wearer
    ) external view returns (uint256);

    function totalActiveTime(
        uint256 hatId,
        address wearer
    ) external view returns (uint256);

    function isActive(
        uint256 hatId,
        address wearer
    ) external view returns (bool);

    /**
     * @notice Emitted when hat creation authority is granted
     */
    event OperationAuthorityGranted(address indexed authority);

    /**
     * @notice Emitted when hat creation authority is revoked
     */
    event OperationAuthorityRevoked(address indexed authority);

    /**
     * @notice Emitted when a hat is minted
     */
    event HatMinted(
        uint256 indexed hatId,
        address indexed wearer,
        uint256 timestamp
    );

    /**
     * @notice Emitted when a hat is deactivated
     */
    event HatDeactivated(uint256 indexed hatId, address indexed wearer);

    /**
     * @notice Emitted when a hat is Reactivated
     */
    event HatReactivated(uint256 indexed hatId, address indexed wearer);

    /**
     * @notice Emitted when a hat is renounced
     */
    event HatRenounced(uint256 indexed hatId, address indexed wearer);

    /**
     * @notice Emitted when batch mint is completed
     */
    event BatchMintCompleted(uint256 indexed hatId, uint256 count);
}
