// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IHatsHatCreatorModule} from "./IHatsHatCreatorModule.sol";
import {HatsModule} from "../../hats/module/HatsModule.sol";

contract HatsHatCreatorModule is HatsModule, IHatsHatCreatorModule {
    uint256 private creatorHatId;

    /**
     * @dev Constructor to initialize the contract
     * @param _version The version of the contract
     */
    constructor(string memory _version) HatsModule(_version) {}

    /**
     * @dev Initializes the contract, hold creator toban ID
     * @param _initData The initialization data (encoded creator toban ID)
     */
    function _setUp(bytes calldata _initData) internal override {
        uint256 _creatorHatId = abi.decode(_initData, (uint256));
        creatorHatId = _creatorHatId;
    }

    /**
     * @notice Checks if an address is authorized to create hats
     * @param authority The address to check
     * @return bool Whether the address is authorized
     */
    function _authorized(address authority) internal view returns (bool) {
        return
            HATS().isAdminOfHat(authority, creatorHatId) ||
            HATS().isWearerOfHat(authority, creatorHatId);
    }

    /**
     * @notice Checks if an address has hat creation authority
     * @param authority The address to check
     * @return bool Whether the address has authority
     */
    function hasAuthority(address authority) public view returns (bool) {
        return _authorized(authority);
    }

    /**
     * @notice Creates a new hat
     * @param _admin The ID of the admin (parent) hat
     * @param _details The details of the hat
     * @param _maxSupply The maximum supply of the hat
     * @param _eligibility The address of the eligibility module
     * @param _toggle The address of the toggle module
     * @param _mutable Whether the hat's properties are changeable after creation
     * @param _imageURI The image uri for this hat
     * @return uint256 The ID of the created hat
     */
    function createHat(
        uint256 _admin,
        string calldata _details,
        uint32 _maxSupply,
        address _eligibility,
        address _toggle,
        bool _mutable,
        string calldata _imageURI
    ) external returns (uint256) {
        require(hasAuthority(msg.sender), "Not authorized");

        return
            HATS().createHat(
                _admin,
                _details,
                _maxSupply,
                _eligibility,
                _toggle,
                _mutable,
                _imageURI
            );
    }

    /**
     * @notice Change the details string of an existing hat
     * @param hatId The ID of the hat to change
     * @param newDetails The new details string for the hat
     * @dev Only callable by addresses with hat creation authority
     */
    function changeHatDetails(
        uint256 hatId,
        string calldata newDetails
    ) external override {
        require(hasAuthority(msg.sender), "Not authorized");
        HATS().changeHatDetails(hatId, newDetails);
        emit HatDetailsChanged(hatId, newDetails);
    }

    /**
     * @notice Change the image URI of an existing hat
     * @param hatId The ID of the hat to change
     * @param newImageURI The new image URI for the hat
     * @dev Only callable by addresses with hat creation authority
     */
    function changeHatImageURI(
        uint256 hatId,
        string calldata newImageURI
    ) external override {
        require(hasAuthority(msg.sender), "Not authorized");
        HATS().changeHatImageURI(hatId, newImageURI);
        emit HatImageURIChanged(hatId, newImageURI);
    }

    /**
     * @notice Change the max supply of an existing hat
     * @param hatId The ID of the hat to change
     * @param newMaxSupply The new maximum supply for the hat
     * @dev Only callable by addresses with hat creation authority
     */
    function changeHatMaxSupply(
        uint256 hatId,
        uint32 newMaxSupply
    ) external override {
        require(hasAuthority(msg.sender), "Not authorized");
        HATS().changeHatMaxSupply(hatId, newMaxSupply);
        emit HatMaxSupplyChanged(hatId, newMaxSupply);
    }
}
