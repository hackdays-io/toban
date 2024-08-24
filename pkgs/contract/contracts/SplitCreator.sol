// SPDX-License-Identifier: MIT

pragma solidity ^0.8.24;

import "./splits/interfaces/ISplitFactoryV2.sol";
import "./splits/libraries/SplitV2.sol";
import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";

contract SplitCreator {
  ISplitFactoryV2 splitFactoryV2;

  IERC1155 fractionToken;

  constructor(address _splitFactoryV2, address _fractionToken) {
    splitFactoryV2 = ISplitFactoryV2(_splitFactoryV2);
    fractionToken = IERC1155(_fractionToken);
  }

  struct SplitInfo {
    uint256 hatId;
    uint256 multiplierBottom;
    uint256 multiplierTop;
    address[] wearers;
  }

  event SplitCreated(address split);

  function create(SplitInfo[] memory _splitInfos) external returns (address) {
    address[] memory shareHolders;
    uint256[] memory tokenIdsOfShareHolders;
    uint256[] memory multipliersOfShareHolders;

    uint256 shareHolderIndex = 0;

    for (uint i = 0; i < _splitInfos.length; i++) {
      SplitInfo memory _splitInfo = _splitInfos[i];
      for (uint si = 0; si < _splitInfo.wearers.length; si++) {
        uint256 tokenId = uint256(
          keccak256(abi.encodePacked(_splitInfo.hatId, _splitInfo.wearers[si]))
        );
        address wearer = _splitInfo.wearers[si];
        // ここにrecepientsが入る
        shareHolders[shareHolderIndex] = wearer;
        tokenIdsOfShareHolders[shareHolderIndex] = tokenId;
        multipliersOfShareHolders[shareHolderIndex] =
          _splitInfo.multiplierTop /
          _splitInfo.multiplierBottom;
        shareHolderIndex++;
      }
    }

    uint256[] memory balanceOfShareHolders = fractionToken.balanceOfBatch(
      shareHolders,
      tokenIdsOfShareHolders
    );

    uint256 shareBottom = 0;
    uint256[] memory allocations = new uint256[](shareHolderIndex);
    for (uint i = 0; i < shareHolderIndex; i++) {
      uint256 share = balanceOfShareHolders[i] * multipliersOfShareHolders[i];
      shareBottom += share;
      allocations[i] = share;
    }

    SplitV2Lib.Split memory _splitParams = SplitV2Lib.Split({
      recipients: shareHolders,
      allocations: allocations,
      totalAllocation: shareBottom,
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
