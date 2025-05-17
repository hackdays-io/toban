// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IThanksTokenFactory {
    function createThanksToken(
        string memory name,
        string memory symbol,
        address workspaceOwner,
        uint256 defaultCoefficient,
        bytes32 salt
    ) external returns (address);
    
    function createThanksTokenDeterministic(
        string memory name,
        string memory symbol,
        address workspaceOwner,
        uint256 defaultCoefficient,
        bytes32 salt
    ) external returns (address);
    
    function predictThanksTokenAddress(
        string memory name,
        string memory symbol,
        address workspaceOwner,
        uint256 defaultCoefficient,
        bytes32 salt
    ) external view returns (address);
}
