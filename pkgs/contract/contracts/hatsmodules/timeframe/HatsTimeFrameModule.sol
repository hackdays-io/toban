// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IHatsTimeFrameModule} from "./IHatsTimeFrameModule.sol";
import {HatsModule} from "../../hats/module/HatsModule.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract HatsTimeFrameModule is HatsModule, Ownable, IHatsTimeFrameModule {
    /// @dev Mapping to track addresses with operation authority
    mapping(address => bool) public operationAuthorities;

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
     * @param _version The version of the contract.
     */
    constructor(
        string memory _version,
        address _tmpOwner
    ) HatsModule(_version) Ownable(_tmpOwner) {}

    /**
     * @dev Initializes the contract, setting up the owner
     * @param _initData The initialization data (encoded owner address)
     */
    function _setUp(bytes calldata _initData) internal override {
        address _owner = abi.decode(_initData, (address));
        _transferOwnership(_owner);
        operationAuthorities[_owner] = true;
    }

    /**
     * @notice Checks if an address has hat creation authority
     * @param authority The address to check
     * @return bool Whether the address has authority
     */
    function hasOperationAuthority(
        address authority
    ) public view returns (bool) {
        return operationAuthorities[authority];
    }

    /**
     * @notice Grants hat creation authority to an address
     * @param authority The address to grant authority to
     */
    function grantOperationAuthority(address authority) external onlyOwner {
        require(authority != address(0), "Invalid address");
        require(!hasOperationAuthority(authority), "Already granted");

        operationAuthorities[authority] = true;
        emit OperationAuthorityGranted(authority);
    }

    /**
     * @notice Revokes hat creation authority from an address
     * @param authority The address to revoke authority from
     */
    function revokeOperationAuthority(address authority) external onlyOwner {
        require(hasOperationAuthority(authority), "Not granted");

        operationAuthorities[authority] = false;
        emit OperationAuthorityRevoked(authority);
    }

    /**
     * @dev Mint a hat for a specific address.
     * @param hatId The ID of the hat that was minted.
     * @param wearer The address of the person who received the hat.
     * @param time The specific timestamp when the hat was minted.
     */
    function mintHat(uint256 hatId, address wearer, uint256 time) external {
        require(hasOperationAuthority(msg.sender), "Not authorized");

        _setWoreTime(wearer, hatId, time);
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
        require(
            hasOperationAuthority(msg.sender) || msg.sender == wearer,
            "Not authorized"
        );
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
        require(
            hasOperationAuthority(msg.sender) || msg.sender == wearer,
            "Not authorized"
        );
        isActive[hatId][wearer] = true;
        woreTime[hatId][wearer] = block.timestamp;
    }

    function renounce(uint256 hatId, address wearer) external {
        require(
            hasOperationAuthority(msg.sender) || msg.sender == wearer,
            "Not authorized"
        );

        HATS().transferHat(hatId, wearer, address(this));
        HATS().renounceHat(hatId);
        woreTime[hatId][wearer] = 0;
        isActive[hatId][wearer] = false;
        deactivatedTime[hatId][wearer] = 0;
        totalActiveTime[hatId][wearer] = 0;
    }

    /**
     * @dev Sets the timestamp when a specific hat was minted for a specific address.
     * Can only be called by the contract that handles the minting logic.
     * @param hatId The ID of the hat that was minted.
     */
    function _setWoreTime(
        address wearer,
        uint256 hatId,
        uint256 time
    ) internal {
        require(woreTime[hatId][wearer] == 0, "Hat already minted");
        woreTime[hatId][wearer] = time == 0 ? block.timestamp : time;
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
        require(
            block.timestamp >= woreTime[hatId][wearer],
            "Invalid wore time"
        );

        uint256 activeTime = totalActiveTime[hatId][wearer];

        if (isActive[hatId][wearer]) {
            // If active, calculate time from the last woreTime to the current time
            activeTime += block.timestamp - woreTime[hatId][wearer];
        }

        return activeTime;
    }
}
