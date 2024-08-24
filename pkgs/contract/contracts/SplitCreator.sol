// SPDX-License-Identifier: MIT

pragma solidity ^0.8.24;

import "./splits/interfaces/ISplitFactoryV2.sol";
import "./splits/libraries/SplitV2.sol";
import "./fraction/IFractionToken.sol";
import "hardhat/console.sol";

contract SplitCreator {
    ISplitFactoryV2 splitFactoryV2;

    IFractionToken fractionToken;

    constructor(address _splitFactoryV2, address _fractionToken) {
        splitFactoryV2 = ISplitFactoryV2(_splitFactoryV2);
        fractionToken = IFractionToken(_fractionToken);
    }

    struct SplitInfo {
        uint256 hatId;
        uint256 multiplierBottom;
        uint256 multiplierTop;
        address[] wearers;
    }

    event SplitCreated(address split);

    function create(SplitInfo[] memory _splitInfos) external returns (address) {
        uint256 numOfShareHolders = 0;
        for (uint i = 0; i < _splitInfos.length; i++) {
            SplitInfo memory _splitInfo = _splitInfos[i];
            for (uint si = 0; si < _splitInfo.wearers.length; si++) {
                uint256 tokenId = fractionToken.getTokenId(
                    _splitInfo.hatId,
                    _splitInfo.wearers[si]
                );
                address[] memory recepients = fractionToken.getTokenRecipients(
                    tokenId
                );
                numOfShareHolders += recepients.length + 1;
            }
        }

        address[] memory shareHolders = new address[](numOfShareHolders);
        address[] memory warers = new address[](numOfShareHolders);
        uint256[] memory hatIdsOfShareHolders = new uint256[](
            numOfShareHolders
        );
        uint256[] memory multipliersOfShareHolders = new uint256[](
            numOfShareHolders
        );

        uint256 shareHolderIndex = 0;

        for (uint i = 0; i < _splitInfos.length; i++) {
            SplitInfo memory _splitInfo = _splitInfos[i];
            for (uint si = 0; si < _splitInfo.wearers.length; si++) {
                uint256 tokenId = fractionToken.getTokenId(
                    _splitInfo.hatId,
                    _splitInfo.wearers[si]
                );
                uint256 multiplier = _splitInfo.multiplierTop /
                    _splitInfo.multiplierBottom;

                shareHolders[shareHolderIndex] = _splitInfo.wearers[si];
                warers[shareHolderIndex] = _splitInfo.wearers[si];
                hatIdsOfShareHolders[shareHolderIndex] = _splitInfo.hatId;
                multipliersOfShareHolders[shareHolderIndex] = multiplier;
                shareHolderIndex++;

                address[] memory recipients = fractionToken.getTokenRecipients(
                    tokenId
                );
                for (uint j = 0; j < recipients.length; j++) {
                    shareHolders[shareHolderIndex] = recipients[j];
                    warers[shareHolderIndex] = _splitInfo.wearers[si];
                    hatIdsOfShareHolders[shareHolderIndex] = _splitInfo.hatId;
                    multipliersOfShareHolders[shareHolderIndex] = multiplier;
                    shareHolderIndex++;
                }
            }
        }

        uint256[] memory balanceOfShareHolders = fractionToken.balanceOfBatch(
            shareHolders,
            warers,
            hatIdsOfShareHolders
        );

        uint256 totalAllocation = 0;
        uint256[] memory allocations = new uint256[](shareHolderIndex);
        for (uint i = 0; i < shareHolderIndex; i++) {
            uint256 share = balanceOfShareHolders[i] *
                multipliersOfShareHolders[i];
            totalAllocation += share;
            allocations[i] = share;
        }

        SplitV2Lib.Split memory _splitParams = SplitV2Lib.Split({
            recipients: shareHolders,
            allocations: allocations,
            totalAllocation: totalAllocation,
            distributionIncentive: 0
        });

        address split = splitFactoryV2.createSplit(
            _splitParams,
            address(this),
            msg.sender
        );

        emit SplitCreated(split);

        return split;
    }

    function _asignENSSubDomain(
        address _split,
        string memory _subDomain
    ) internal {
        // ENSにサブドメインを登録する
    }
}
