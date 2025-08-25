// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IHatsTimeFrameModule} from "./IHatsTimeFrameModule.sol";
import {HatsModule} from "../../hats/module/HatsModule.sol";

contract HatsTimeFrameModule is HatsModule, IHatsTimeFrameModule {
    // hatId => wearer => wore timestamp
    mapping(uint256 => mapping(address => uint256)) public woreTime;

    // hatId => wearer => last deactivation timestamp
    mapping(uint256 => mapping(address => uint256)) public deactivatedTime;

    // hatId => wearer => total active time
    mapping(uint256 => mapping(address => uint256)) public totalActiveTime;

    // hatId => wearer => isActive
    mapping(uint256 => mapping(address => bool)) public isActive;

    uint256 private minterHatId;

    /**
     * @dev Constructor to initialize the trusted forwarder.
     * @param _version The version of the contract.
     */
    constructor(string memory _version) HatsModule(_version) {}

    /**
     * @dev Initializes the contract, setting up TimeFrame toban ID.
     * @param _initData The initialization data (encoded TimeFrame Toban ID).
     */
    function _setUp(bytes calldata _initData) internal override {
        uint256 _minterHatId = abi.decode(_initData, (uint256));
        minterHatId = _minterHatId;
    }

    /**
     * @notice Checks if an address is authorized to create hats
     * @param authority The address to check
     * @return bool Whether the address is authorized
     */
    function _authorized(address authority) internal view returns (bool) {
        return
            HATS().isAdminOfHat(authority, minterHatId) ||
            HATS().isWearerOfHat(authority, minterHatId);
    }

    /**
     * @notice Checks if an address has mint hat authority
     * @param authority The address to check
     * @return bool Whether the address has authority
     */
    function hasAuthority(address authority) public view returns (bool) {
        return _authorized(authority);
    }

    /**
     * @dev Mint a hat for a specific address.
     * @param hatId The ID of the hat that was minted.
     * @param wearer The address of the person who received the hat.
     * @param time The specific timestamp when the hat was minted.
     */
    function mintHat(uint256 hatId, address wearer, uint256 time) external {
        require(hasAuthority(msg.sender), "Not authorized");

        _setWoreTime(wearer, hatId, time);
        isActive[hatId][wearer] = true;
        HATS().mintHat(hatId, wearer);

        emit HatMinted(hatId, wearer, time == 0 ? block.timestamp : time);
    }

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
    ) external {
        // 権限チェック
        require(hasAuthority(msg.sender), "Not authorized");

        // 入力検証
        require(wearers.length > 0, "Empty wearers array");
        require(wearers.length == times.length, "Array length mismatch");
        require(wearers.length <= 100, "Batch size too large");

        // 事前検証（全てのwearerが有効かチェック）
        for (uint256 i = 0; i < wearers.length; i++) {
            require(wearers[i] != address(0), "Invalid wearer address");
            require(woreTime[hatId][wearers[i]] == 0, "Hat already minted");
        }

        // 一括ミント実行
        for (uint256 i = 0; i < wearers.length; i++) {
            address wearer = wearers[i];
            uint256 time = times[i];

            _setWoreTime(wearer, hatId, time);
            isActive[hatId][wearer] = true;
            HATS().mintHat(hatId, wearer);

            emit HatMinted(hatId, wearer, time == 0 ? block.timestamp : time);
        }

        emit BatchMintCompleted(hatId, wearers.length);
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
            hasAuthority(msg.sender) || msg.sender == wearer,
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
            hasAuthority(msg.sender) || msg.sender == wearer,
            "Not authorized"
        );
        isActive[hatId][wearer] = true;
        woreTime[hatId][wearer] = block.timestamp;

        emit HatReactivated(hatId, wearer);
    }

    function renounce(uint256 hatId, address wearer) external {
        require(
            hasAuthority(msg.sender) || msg.sender == wearer,
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
