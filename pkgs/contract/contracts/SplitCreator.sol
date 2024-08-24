// SPDX-License-Identifier: MIT

pragma solidity ^0.8.24;

import "./splits/interfaces/ISplitFactoryV2.sol";
import "./splits/libraries/SplitV2.sol";
import "./ens/wrapper/INameWrapper.sol";
import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";

contract SplitCreator {
  ISplitFactoryV2 splitFactoryV2;

  IERC1155 fractionToken;
  INameWrapper nameWrapper;

  // *.toban.ethのように発行するための設定
  bytes32 public parentNode = 0x8f16dcf0ba3c4c5b2bb9786c84c45925294ff9e18b65e97dda3521708b071a33;
  address public resolverAddress = 0x8FADE66B79cC9f707aB26799354482EB93a5B7dD;
  address public nameWrapperAddress = 0x0635513f179D50A207757E05759CbD106d7dFcE8;

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
  event AsignedENSSubDomain(
    bytes32 node,
    string label,
    address owner,
    address resolver,
    uint64 ttl,
    uint32 fuses,
    uint64 expiry
  );

  function create(SplitInfo[] memory _splitInfos, string memory _subDomain) external returns (address) {
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

    // Splitの作成と同時にENSサブドメインを紐づける
    _asignENSSubDomain(split, _subDomain);

    return split;
  }

  function _asignENSSubDomain(
    address _split,
    string memory _subDomain
  ) internal {
    // NameWrapperコントラクトを用意する。
    INameWrapper nameWrapper = INameWrapper(nameWrapperAddress);
    // subdomainを発行する。
    nameWrapper.setSubnodeRecord(parentNode, _subDomain, _split, resolverAddress, 0, 0, 0);
    emit AsignedENSSubDomain(parentNode, _subDomain, _split, resolverAddress, 0, 0, 0);
  }
}
