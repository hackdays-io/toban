// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IHatsHatCreatorModule {
    /**
     * @notice Grants hat creation authority to an address
     * @param authority The address to grant authority to
     */
    function grantCreateHatAuthority(address authority) external;

    /**
     * @notice Revokes hat creation authority from an address
     * @param authority The address to revoke authority from
     */
    function revokeCreateHatAuthority(address authority) external;

    /**
     * @notice Creates a new hat
     * @param _admin The ID of the admin (parent) hat
     * @param _details The details of the hat
     * @param _maxSupply The maximum supply of the hat
     * @param _eligibility The address of the eligibility module
     * @param _toggle The address of the toggle module
     * @param _mutable Whether the hat's properties are changeable after creation
     * @param _imageURI The image uri for this hat
     * @return hatId The ID of the created hat
     */
    function createHat(
        uint256 _admin,
        string calldata _details,
        uint32 _maxSupply,
        address _eligibility,
        address _toggle,
        bool _mutable,
        string calldata _imageURI
    ) external returns (uint256 hatId);

    /**
     * @notice Checks if an address has hat creation authority
     * @param authority The address to check
     * @return bool Whether the address has authority
     */
    function hasCreateHatAuthority(address authority) external view returns (bool);

    /**
     * @notice Emitted when hat creation authority is granted
     */
    event CreateHatAuthorityGranted(address indexed authority);

    /**
     * @notice Emitted when hat creation authority is revoked
     */
    event CreateHatAuthorityRevoked(address indexed authority);

    /// @notice Emitted when edit hat authority is granted to an address
    /// @param authority The address that was granted edit authority
    event EditHatAuthorityGranted(address indexed authority);

    /// @notice Emitted when edit hat authority is revoked from an address
    /// @param authority The address that was revoked edit authority
    event EditHatAuthorityRevoked(address indexed authority);
}
