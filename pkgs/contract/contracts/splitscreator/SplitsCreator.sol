// solhint-disable
// SPDX-License-Identifier: MIT

pragma solidity ^0.8.24;

import {IHats} from "../hats/src/Interfaces/IHats.sol";
import {ISplitsCreator} from "./ISplitsCreator.sol";
import {ISplitFactoryV2} from "../splits/interfaces/ISplitFactoryV2.sol";
import {SplitV2Lib} from "../splits/libraries/SplitV2.sol";
import {IThanksToken} from "../thankstoken/IThanksToken.sol";
import {IHatsFractionTokenModule} from "../hatsmodules/fractiontoken/IHatsFractionTokenModule.sol";
import {IHatsTimeFrameModule} from "../hatsmodules/timeframe/IHatsTimeFrameModule.sol";
import {Clone} from "solady/src/utils/Clone.sol";

contract SplitsCreator is ISplitsCreator, Clone {
    uint256 private constant PRECISION = 1e5;

    function HATS() public pure returns (IHats) {
        return IHats(_getArgAddress(12));
    }

    function SPLIT_FACTORY_V2() public pure returns (ISplitFactoryV2) {
        return ISplitFactoryV2(_getArgAddress(44));
    }

    function HATS_TIME_FRAME_MODULE()
        public
        pure
        returns (IHatsTimeFrameModule)
    {
        return IHatsTimeFrameModule(_getArgAddress(76));
    }

    function FRACTION_TOKEN() public pure returns (IHatsFractionTokenModule) {
        return IHatsFractionTokenModule(_getArgAddress(108));
    }

    function THANKS_TOKEN() public pure returns (IThanksToken) {
        return IThanksToken(_getArgAddress(140));
    }

    /**
     * @notice Creates a new split contract based on the provided splits information.
     * @param _splitsInfo An array of SplitsInfo structs containing details about roles, wearers, and multipliers.
     * @return The address of the newly created split contract.
     */
    function create(
        SplitsInfo[] memory _splitsInfo,
        WeightsInfo memory _weightsInfo
    ) external returns (address) {
        (
            address[] memory shareHolders,
            uint256[] memory allocations,
            uint256 totalAllocation
        ) = _calculateAllocations(_splitsInfo, _weightsInfo);

        require(
            shareHolders.length > 1,
            "SplitsCreator: ShareHolders should be more than 1"
        );

        SplitV2Lib.Split memory _splitParams = SplitV2Lib.Split({
            recipients: shareHolders,
            allocations: allocations,
            totalAllocation: totalAllocation,
            distributionIncentive: 0
        });

        address split = SPLIT_FACTORY_V2().createSplitDeterministic(
            _splitParams,
            address(this),
            msg.sender,
            _generateSalt(_splitsInfo)
        );

        emit SplitsCreated(split, shareHolders, allocations, totalAllocation);

        return split;
    }

    /**
     * @notice Previews the allocations without creating a split contract.
     * @param _splitsInfo An array of SplitsInfo structs containing details about roles, wearers, and multipliers.
     * @return shareHolders An array of shareholder addresses.
     * @return allocations Corresponding allocations for each shareholder.
     * @return totalAllocation Sum of all allocations.
     */
    function preview(
        SplitsInfo[] memory _splitsInfo,
        WeightsInfo memory _weightsInfo
    )
        external
        view
        returns (
            address[] memory shareHolders,
            uint256[] memory allocations,
            uint256 totalAllocation
        )
    {
        (shareHolders, allocations, totalAllocation) = _calculateAllocations(
            _splitsInfo,
            _weightsInfo
        );
    }

    /**
     * @dev Internal function to calculate allocations for shareHolders.
     *      It calculates role-based and thanks-based allocations separately,
     *      normalizes them, applies weights, and then combines them.
     * @param _splitsInfo An array of SplitsInfo structs containing details about roles, wearers, and multipliers.
     * @param _weightsInfo Struct containing weights for different allocation types.
     * @return shareHolders An array of shareholder addresses.
     * @return allocations Corresponding allocations for each shareholder.
     * @return totalAllocation Sum of all allocations.
     */
    function _calculateAllocations(
        SplitsInfo[] memory _splitsInfo,
        WeightsInfo memory _weightsInfo
    )
        internal
        view
        returns (
            address[] memory shareHolders,
            uint256[] memory allocations,
            uint256 totalAllocation
        )
    {
        address[] memory thanksShareHolders;
        uint256[] memory thanksAllocations;
        uint256 thanksTotalAllocation;
        (thanksShareHolders, thanksAllocations, thanksTotalAllocation) = _calculateThanksAllocations(
            _weightsInfo.thanksTokenReceivedWeight,
            _weightsInfo.thanksTokenSentWeight
        );

        address[] memory roleShareHolders;
        uint256[] memory roleAllocations;
        uint256 roleTotalAllocation;
        (roleShareHolders, roleAllocations, roleTotalAllocation) = _calculateRoleAllocations(_splitsInfo);

        uint256 numOfThanksShareHolders = 0;
        if (_weightsInfo.thanksTokenWeight > 0) {
            numOfThanksShareHolders = thanksShareHolders.length;
        }

        uint256 numOfRoleShareHolders = 0;
        if (_weightsInfo.roleWeight > 0) {
            numOfRoleShareHolders = roleShareHolders.length;
        }

        uint256 numOfShareHolders = numOfThanksShareHolders + numOfRoleShareHolders;

        shareHolders = new address[](numOfShareHolders);
        allocations = new uint256[](numOfShareHolders);

        uint256 weightSum = _weightsInfo.thanksTokenWeight + _weightsInfo.roleWeight;

        totalAllocation = 0;

        for (uint256 i = 0; i < numOfThanksShareHolders; i++) {
            shareHolders[i] = thanksShareHolders[i];
            uint256 thanksAllocation = allocations[i] = thanksAllocations[i] * _weightsInfo.thanksTokenWeight * PRECISION / thanksTotalAllocation / weightSum;
            allocations[i] = thanksAllocation;
            totalAllocation += thanksAllocation;
        }

        for (uint256 i = 0; i < numOfRoleShareHolders; i++) {
            shareHolders[numOfThanksShareHolders + i] = roleShareHolders[i];
            uint256 roleAllocation = roleAllocations[i] * _weightsInfo.roleWeight * PRECISION / roleTotalAllocation / weightSum;
            allocations[numOfThanksShareHolders + i] = roleAllocation;
            totalAllocation += roleAllocation;
        }

        return (shareHolders, allocations, totalAllocation);
    }

    function _calculateThanksAllocations(
		uint256 thanksTokenReceivedWeight,
		uint256 thanksTokenSentWeight
	)
        internal
        view
        returns (
            address[] memory shareHolders,
            uint256[] memory allocations,
            uint256 totalAllocation
        )
    {
        address[] memory thanksParticipants = THANKS_TOKEN().getParticipants();
        uint256 thanksParticipantsCount = thanksParticipants.length;
        uint256 totalThanksBalance = 0;
        uint256 totalThanksMinted = 0;

        for (uint256 i = 0; i < thanksParticipantsCount; i++) {
            uint256 thanksBalance = THANKS_TOKEN().balanceOf(thanksParticipants[i]);
            uint256 thanksMinted = THANKS_TOKEN().mintedAmount(thanksParticipants[i]);

            totalThanksBalance += thanksBalance;
            totalThanksMinted += thanksMinted;
        }

        shareHolders = new address[](thanksParticipantsCount);
        allocations = new uint256[](thanksParticipantsCount);
        uint256 shareHolderIndex = 0;

        uint256 thanksTokenWeightSum = thanksTokenReceivedWeight + thanksTokenSentWeight;

        if (totalThanksBalance > 0 && totalThanksMinted > 0) {
            for (uint256 i = 0; i < thanksParticipantsCount; i++) {
                uint256 thanksBalance = THANKS_TOKEN().balanceOf(thanksParticipants[i]);
                uint256 thanksMinted = THANKS_TOKEN().mintedAmount(thanksParticipants[i]);

                uint256 thanksScore =
                    (
                        (thanksTokenReceivedWeight * thanksBalance * PRECISION / totalThanksBalance) +
                        (thanksTokenSentWeight * thanksMinted * PRECISION / totalThanksMinted)
                    ) / thanksTokenWeightSum;

                shareHolders[shareHolderIndex] = thanksParticipants[i];
                allocations[shareHolderIndex] = thanksScore;
                totalAllocation += thanksScore;
                shareHolderIndex++;
            }
        }

        totalAllocation = 0;
        for (uint256 i = 0; i < allocations.length; i++) {
            totalAllocation += allocations[i];
        }

        return (shareHolders, allocations, totalAllocation);
    }

    function _calculateRoleAllocations(
        SplitsInfo[] memory _splitsInfo
    )
        internal
        view
        returns (
            address[] memory shareHolders,
            uint256[] memory allocations,
            uint256 totalAllocation
        )
    {
        uint256 numOfShareHolders = 0;
        for (uint256 i = 0; i < _splitsInfo.length; i++) {
            SplitsInfo memory _splitInfo = _splitsInfo[i];
            for (uint256 si = 0; si < _splitInfo.wearers.length; si++) {
                address[] memory recipients = FRACTION_TOKEN()
                    .getTokenRecipients(
                        FRACTION_TOKEN().getTokenId(
                            _splitInfo.hatId,
                            _splitInfo.wearers[si]
                        )
                    );
                if (recipients.length == 0) {
                    numOfShareHolders++;
                } else {
                    numOfShareHolders += recipients.length;
                }
            }
        }

        shareHolders = new address[](numOfShareHolders);
        allocations = new uint256[](numOfShareHolders);
        uint256 shareHolderIndex = 0;

        for (uint256 i = 0; i < _splitsInfo.length; i++) {
            SplitsInfo memory _splitInfo = _splitsInfo[i];

            uint256 roleMultiplier = _splitInfo.multiplierTop /
                _splitInfo.multiplierBottom;

            uint256 fractionTokenSupply = 0;
            uint256 currentShareHolderIndex = shareHolderIndex;
            for (uint256 j = 0; j < _splitInfo.wearers.length; j++) {
                uint256 hatsTimeFrameMultiplier = _getHatsTimeFrameMultiplier(
                    _splitInfo.wearers[j],
                    _splitInfo.hatId
                );

                fractionTokenSupply += FRACTION_TOKEN().totalSupply(
                    _splitInfo.wearers[j],
                    _splitInfo.hatId
                );

                uint256 wearerBalance = FRACTION_TOKEN().balanceOf(
                    _splitInfo.wearers[j],
                    _splitInfo.wearers[j],
                    _splitInfo.hatId
                );

                uint256 wearerScore = wearerBalance *
                    roleMultiplier *
                    hatsTimeFrameMultiplier;

                shareHolders[shareHolderIndex] = _splitInfo.wearers[j];
                allocations[shareHolderIndex] = wearerScore;

                shareHolderIndex++;

                address[] memory recipients = FRACTION_TOKEN()
                    .getTokenRecipients(
                        FRACTION_TOKEN().getTokenId(
                            _splitInfo.hatId,
                            _splitInfo.wearers[j]
                        )
                    );

                for (uint256 k = 0; k < recipients.length; k++) {
                    if (recipients[k] == _splitInfo.wearers[j]) continue;

                    uint256 recipientBalance = FRACTION_TOKEN().balanceOf(
                        recipients[k],
                        _splitInfo.wearers[j],
                        _splitInfo.hatId
                    );

                    uint256 recipientScore = recipientBalance *
                        roleMultiplier *
                        hatsTimeFrameMultiplier;

                    shareHolders[shareHolderIndex] = recipients[k];
                    allocations[shareHolderIndex] = recipientScore;
                    shareHolderIndex++;
                }
            }

            for (uint256 l = 0; l < allocations.length; l++) {
                if (l >= currentShareHolderIndex && l < shareHolderIndex) {
                    allocations[l] =
                        (allocations[l] * 10e5) /
                        fractionTokenSupply;
                }
            }
        }

        totalAllocation = 0;
        for (uint256 i = 0; i < allocations.length; i++) {
            totalAllocation += allocations[i];
        }

        return (shareHolders, allocations, totalAllocation);
    }

    function _getHatsTimeFrameMultiplier(
        address _wearer,
        uint256 _hatId
    ) internal view returns (uint256) {
        if (address(HATS_TIME_FRAME_MODULE()) == address(0)) return 1;
        return
            _sqrt(
                HATS_TIME_FRAME_MODULE().getWearingElapsedTime(_wearer, _hatId)
            );
    }

    function _sqrt(uint256 y) internal pure returns (uint256 z) {
        if (y > 3) {
            z = y;
            uint256 x = y / 2 + 1;
            while (x < z) {
                z = x;
                x = (y / x + x) / 2;
            }
        } else if (y != 0) {
            z = 1;
        }
        // else z = 0 (default value)
    }

    function _generateSalt(
        SplitsInfo[] memory splitsInfo
    ) internal pure returns (bytes32) {
        return keccak256(abi.encode(splitsInfo));
    }
}
