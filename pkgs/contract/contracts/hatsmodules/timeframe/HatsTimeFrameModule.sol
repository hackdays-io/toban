// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IHatsTimeFrameModule} from "./IHatsTimeFrameModule.sol";
import {HatsModule} from "../../hats/module/HatsModule.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract HatsTimeFrameModule is HatsModule, Ownable, IHatsTimeFrameModule {
    // hatId => wearer => wore timestamp
    mapping(uint256 => mapping(address => uint256)) public woreTime;

    // hatId => wearer => last deactivation timestamp
    mapping(uint256 => mapping(address => uint256)) public deactivatedTime;

    // hatId => wearer => total active time
    mapping(uint256 => mapping(address => uint256)) public totalActiveTime;

    // hatId => wearer => isActive
    mapping(uint256 => mapping(address => bool)) public isActive;

    uint256 private timeFrameTobanId;

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
        (address _owner, uint256 _timeFrameTobanId) = abi.decode(
            _initData,
            (address, uint256)
        );
        timeFrameTobanId = _timeFrameTobanId;
        _transferOwnership(_owner);
    }

    /**
     * @notice Checks if an address is authorized to create hats
     * @param authority The address to check
     * @return bool Whether the address is authorized
     */
    function _authorizedToOperate(
        address authority
    ) internal view returns (bool) {
        return
            HATS().isAdminOfHat(authority, timeFrameTobanId) ||
            HATS().isWearerOfHat(authority, timeFrameTobanId);
    }

    /**
     * @notice Checks if an address has hat creation authority
     * @param authority The address to check
     * @return bool Whether the address has authority
     */
    function hasOperationAuthority(
        address authority
    ) public view returns (bool) {
        return _authorizedToOperate(authority);
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

        emit HatMinted(hatId, wearer, time == 0 ? block.timestamp : time);
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

        emit HatDeactivated(hatId, wearer);
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

        emit HatReactivated(hatId, wearer);
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

        emit HatRenounced(hatId, wearer);
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
