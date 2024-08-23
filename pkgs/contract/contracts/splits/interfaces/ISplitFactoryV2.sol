// SPDX-License-Identifier: MIT

pragma solidity ^0.8.24;

import {SplitV2Lib} from "../libraries/SplitV2.sol";

interface ISplitFactoryV2 {
  function createSplitDeterministic(
    SplitV2Lib.Split calldata _splitParams,
    address _owner,
    address _creator,
    bytes32 _salt
  ) external returns (address split);

  function createSplit(
    SplitV2Lib.Split calldata _splitParams,
    address _owner,
    address _creator
  ) external returns (address split);
}
