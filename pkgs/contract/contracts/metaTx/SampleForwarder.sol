// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import '@openzeppelin/contracts/metatx/MinimalForwarder.sol';

contract SampleForwarder is MinimalForwarder {
  constructor() MinimalForwarder() {} 
}