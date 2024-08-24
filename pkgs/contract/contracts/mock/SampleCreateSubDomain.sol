// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

import "./../ens/wrapper/INameWrapper.sol";
import "./../ens/reverseRegistrar/ReverseClaimer.sol";

/**
 * コントラクトからサブドメインが作成できるか確認するためのモックコントラクト
 */
contract SampleCreateSubDomain is ReverseClaimer {

  INameWrapper nameWrapper;

  // *.contract.toban.ethのように発行するための設定
  bytes32 public parentNode = 0x97CD6F9AE139C32C43A0343366F02ACAF191AF1D32FF86DA66B9A672D120944C;
  address public resolverAddress = 0x8FADE66B79cC9f707aB26799354482EB93a5B7dD;
  address public nameWrapperAddress = 0x0635513f179D50A207757E05759CbD106d7dFcE8;
 
  constructor(ENS ens) payable ReverseClaimer(ens, msg.sender) {}

  function createSubDomain(string memory _subDomain) public {
    // NameWrapperコントラクトを用意する。
    INameWrapper nameWrapper = INameWrapper(nameWrapperAddress);
    // subdomainを発行する。
    nameWrapper.setSubnodeRecord(parentNode, _subDomain, address(this), resolverAddress, 0, 0, 0);
  }
}
