// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { IHats } from "../hats/src/Interfaces/IHats.sol";
import { HatsModule } from "../hats/module/HatsModule.sol";
import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title HatsHatCreatorModule
 * @notice Allows only addresses with `canCreateHat[account] == true` to create hats,
 *         and only the module's owner can grant/revoke that ability.
 */
contract HatsHatCreatorModule is HatsModule, Ownable {
    /// @dev Mapping of addresses allowed to call `createHat`
    mapping(address => bool) public canCreateHat;

    event GrantedCreateHat(address indexed account, address indexed grantedBy);
    event RevokedCreateHat(address indexed account, address indexed revokedBy);

    /**
     * @notice Constructor
     * @param _version The version of this module (stored in HatsModule).
     * @param _initialOwner The address set as the initial owner in Ownable.
     */
    constructor(string memory _version, address _initialOwner)
        HatsModule(_version)
        Ownable(_initialOwner)
    {}

    /**
     * @notice Grant `account` the ability to call `createHat`.
     */
    function grantCreateHat(address account) external onlyOwner {
        canCreateHat[account] = true;
        emit GrantedCreateHat(account, msg.sender);
    }

    /**
     * @notice Revoke `account`'s ability to call `createHat`.
     */
    function revokeCreateHat(address account) external onlyOwner {
        canCreateHat[account] = false;
        emit RevokedCreateHat(account, msg.sender);
    }

    /**
     * @notice Create a new Hat via Hats Protocol, restricted by our custom access control.
     */
    function createHat(
        uint256 _admin,
        string calldata _details,
        uint32 _maxSupply,
        address _eligibility,
        address _toggle,
        bool _mutable,
        string calldata _imageURI
    ) external returns (uint256 newHatId) {
        require(
            canCreateHat[msg.sender],
            "HatsHatCreatorModule: caller cannot create hat"
        );

        newHatId = HATS().createHat(
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
     * @notice Minimal proxy `_setUp` function to set the final owner.
     */
    function _setUp(bytes calldata _initData) internal override {
        (address finalOwner) = abi.decode(_initData, (address));
        _transferOwnership(finalOwner);
    }
}