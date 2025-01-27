// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IHatsTimeFrameModule {
    /**
     * @notice Grants hat creation authority to an address
     * @param authority The address to grant authority to
     */
    function grantOperationAuthority(address authority) external;

    /**
     * @notice Revokes hat creation authority from an address
     * @param authority The address to revoke authority from
     */
    function revokeOperationAuthority(address authority) external;

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
}
