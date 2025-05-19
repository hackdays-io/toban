// contracts/hatsmodules/hatcreator/IHatsHatCreatorModule.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IHatsHatCreatorModule {
    // Grant/revoke authority
    function grantCreateHatAuthority(address authority) external;
    function revokeCreateHatAuthority(address authority) external;

    // Check authority (single declaration)
    function hasCreateHatAuthority(address authority) external view returns (bool);

    // Create a new hat
    function createHat(
        uint256 _admin,
        string calldata _details,
        uint32 _maxSupply,
        address _eligibility,
        address _toggle,
        bool _mutable,
        string calldata _imageURI
    ) external returns (uint256 hatId);

    // Events for create-authority changes
    event CreateHatAuthorityGranted(address indexed authority);
    event CreateHatAuthorityRevoked(address indexed authority);

    // Added edit-functions
    function changeHatDetails(
        uint256 hatId,
        string calldata newDetails
    ) external;

    function changeHatImageURI(
        uint256 hatId,
        string calldata newImageURI
    ) external;

    function changeHatMaxSupply(
        uint256 hatId,
        uint32 newMaxSupply
    ) external;

    // Added edit-events
    event HatDetailsChanged(uint256 indexed hatId, string newDetails);
    event HatImageURIChanged(uint256 indexed hatId, string newImageURI);
    event HatMaxSupplyChanged(uint256 indexed hatId, uint32 newMaxSupply);
}
