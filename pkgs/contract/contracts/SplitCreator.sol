// SPDX-License-Identifier: MIT

pragma solidity ^0.8.24;

import "./splits/interfaces/ISplitFactoryV2.sol";
import "./splits/libraries/SplitV2.sol";

contract SplitCreator {
  ISplitFactoryV2 splitFactoryV2;

  constructor(address _splitFactoryV2) {
    splitFactoryV2 = ISplitFactoryV2(_splitFactoryV2);
  }

  struct SplitInfo {
    uint256 hatId;
    uint256 multiplierBottom;
    uint256 multiplierTop;
    address[] wearers;
  }

  function create(SplitInfo memory _splitInfo) external returns (address) {
    uint256[] memory _allocations = new uint256[](_splitInfo.wearers.length);
    for (uint i = 0; i < _splitInfo.wearers.length; i++) {
      _allocations[i] = 50;
    }

    SplitV2Lib.Split memory _splitParams = SplitV2Lib.Split({
      recipients: _splitInfo.wearers,
      allocations: _allocations,
      totalAllocation: 100,
      distributionIncentive: 0
    });

    address split = splitFactoryV2.createSplit(
      _splitParams,
      address(this),
      msg.sender
    );

    return split;
  }
}
