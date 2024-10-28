// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ContextUpgradeable} from "@openzeppelin/contracts-upgradeable/utils/ContextUpgradeable.sol";
import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "hardhat/console.sol";
/**
 * @dev Context variant with ERC2771 support.
 */
abstract contract ERC2771ContextUpgradeable is Initializable, ContextUpgradeable {
    /// @custom:oz-upgrades-unsafe-allow state-variable-immutable
    address private _trustedForwarder;

    function __ERC2771Context_init(address trustedForwarder)
        internal
        onlyInitializing
    {
        console.log("__ERC2771Context_init start");
        console.log("trustedForwarder", trustedForwarder);
        console.log("_msgSender 1", _msgSender());
        console.log("msg.sender 1", msg.sender);
        __Context_init_unchained();
        console.log("_msgSender 2", _msgSender());
        console.log("msg.sender 2", msg.sender);
        _trustedForwarder = trustedForwarder;
        console.log("_msgSender 3", _msgSender());
        console.log("msg.sender 3", msg.sender);
        console.log("_trustedForwarder", _trustedForwarder);
        console.log("__ERC2771Context_init end");
    }

    function trustedForwarder() public view virtual returns (address) {
        return _trustedForwarder;
    }

    function isTrustedForwarder(address forwarder) public view virtual returns (bool) {
        return forwarder == trustedForwarder();
    }


    function _msgSender() internal view virtual override returns (address) {
        console.log("=== _msgSender() start ===");
        uint256 calldataLength = msg.data.length;
        uint256 contextSuffixLength = _contextSuffixLength();
        console.log("isTrustedForwarder", isTrustedForwarder(msg.sender));
        console.log("calldataLength", calldataLength);
        console.log("contextSuffixLength", contextSuffixLength);
        console.log("msg.data", address(bytes20(msg.data[calldataLength - contextSuffixLength:])));
        if (isTrustedForwarder(msg.sender) && calldataLength >= contextSuffixLength) {
            console.log("=== _msgSender() end 1 ===");
            return address(bytes20(msg.data[calldataLength - contextSuffixLength:]));
        } else {
            console.log("=== _msgSender() end 2 ===");
            return super._msgSender();
        }
    }

    function _msgData() internal view virtual override returns (bytes calldata) {
        uint256 calldataLength = msg.data.length;
        uint256 contextSuffixLength = _contextSuffixLength();
        if (isTrustedForwarder(msg.sender) && calldataLength >= contextSuffixLength) {
            return msg.data[:calldataLength - contextSuffixLength];
        } else {
            return super._msgData();
        }
    }

    function _contextSuffixLength() internal view virtual override returns (uint256) {
        return 20;
    }
}