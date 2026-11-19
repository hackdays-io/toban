// SPDX-License-Identifier: MIT
// Further information: https://eips.ethereum.org/EIPS/eip-1014
// slither: Always compiled with the pinned 0.8.24 (hardhat.config.ts); vendored file keeps its upstream pragma.
// slither-disable-next-line solc-version
pragma solidity ^0.8.9;

import {Create2} from "@openzeppelin/contracts/utils/Create2.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title CREATE2 Deployer Smart Contract
 * @author Pascal Marco Caversaccio, pascal.caversaccio@hotmail.ch
 * @dev Helper smart contract to make easier and safer usage of the
 * `CREATE2` EVM opcode. `CREATE2` can be used to compute in advance
 * the address where a smart contract will be deployed, which allows
 * for interesting new mechanisms known as 'counterfactual interactions'.
 */
contract Create2Deployer is Ownable, Pausable {
    // slither: Harmless explicit call to Pausable's empty constructor (vendored code, kept as upstream).
    // slither-disable-next-line void-cst
    constructor() Ownable(msg.sender) Pausable() {}

    /**
     * @dev Deploys a contract using `CREATE2`. The address where the
     * contract will be deployed can be known in advance via {computeAddress}.
     *
     * The bytecode for a contract can be obtained from Solidity with
     * `type(contractName).creationCode`.
     *
     * Requirements:
     * - `bytecode` must not be empty.
     * - `salt` must have not been used for `bytecode` already.
     * - the factory must have a balance of at least `value`.
     * - if `value` is non-zero, `bytecode` must have a `payable` constructor.
     */
    function deploy(
        uint256 value,
        bytes32 salt,
        bytes memory code
    ) public whenNotPaused {
        // slither: Callers precompute the address with computeAddress(); Create2.deploy reverts on failure.
        // slither-disable-next-line unused-return
        Create2.deploy(value, salt, code);
    }

    /**
     * @dev Returns the address where a contract will be stored if deployed via {deploy}.
     * Any change in the `bytecodeHash` or `salt` will result in a new destination address.
     */
    function computeAddress(
        bytes32 salt,
        bytes32 codeHash
    ) public view returns (address) {
        return Create2.computeAddress(salt, codeHash);
    }

    /**
     * @dev Returns the address where a contract will be stored if deployed via {deploy} from a
     * contract located at `deployer`. If `deployer` is this contract's address, returns the
     * same value as {computeAddress}.
     */
    function computeAddressWithDeployer(
        bytes32 salt,
        bytes32 codeHash,
        address deployer
    ) public pure returns (address) {
        return Create2.computeAddress(salt, codeHash, deployer);
    }

    /**
     * @dev The contract can receive ether to enable `payable` constructor calls if needed.
     */
    // slither: ETH held here funds payable constructors via deploy(value, ...).
    // slither-disable-next-line locked-ether
    receive() external payable {}

    /**
     * @dev Triggers stopped state.
     * Requirements: The contract must not be paused.
     */
    function pause() public onlyOwner {
        _pause();
    }

    /**
     * @dev Returns to normal state.
     * Requirements: The contract must be paused.
     */
    function unpause() public onlyOwner {
        _unpause();
    }
}
