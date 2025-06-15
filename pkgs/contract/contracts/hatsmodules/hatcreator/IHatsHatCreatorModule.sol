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
     * @notice Checks if an address has hat creation authority
     * @param authority The address to check
     * @return bool Whether the address has authority
     */
    function hasCreateHatAuthority(
        address authority
    ) external view returns (bool);

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
     * @notice Emitted when hat creation authority is granted
     */
    event CreateHatAuthorityGranted(address indexed authority);

    /**
     * @notice Emitted when hat creation authority is revoked
     */
    event CreateHatAuthorityRevoked(address indexed authority);

    /**
     * @notice Change the details string of an existing hat
     * @param hatId The ID of the hat to update
     * @param newDetails The new details string
     */
    function changeHatDetails(
        uint256 hatId,
        string calldata newDetails
    ) external;

    /**
     * @notice Change the image URI of an existing hat
     * @param hatId The ID of the hat to update
     * @param newImageURI The new image URI
     */
    function changeHatImageURI(
        uint256 hatId,
        string calldata newImageURI
    ) external;

    /**
     * @notice Change the max supply of an existing hat
     * @param hatId The ID of the hat to update
     * @param newMaxSupply The new max supply value
     */
    function changeHatMaxSupply(uint256 hatId, uint32 newMaxSupply) external;

    /**
     * @notice Emitted when hat details are updated
     */
    event HatDetailsChanged(uint256 indexed hatId, string newDetails);

    /**
     * @notice Emitted when hat imageURI is updated
     */
    event HatImageURIChanged(uint256 indexed hatId, string newImageURI);

    /**
     * @notice Emitted when hat maxSupply is updated
     */
    event HatMaxSupplyChanged(uint256 indexed hatId, uint32 newMaxSupply);
}
