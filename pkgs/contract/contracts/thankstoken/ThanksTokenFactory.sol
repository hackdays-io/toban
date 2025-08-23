// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IThanksTokenFactory} from "./IThanksTokenFactory.sol";
import {ThanksToken} from "./ThanksToken.sol";
import {OwnableUpgradeable} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import {UUPSUpgradeable} from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import {LibClone} from "solady/src/utils/LibClone.sol";

contract ThanksTokenFactory is
    OwnableUpgradeable,
    UUPSUpgradeable,
    IThanksTokenFactory
{
    address public IMPLEMENTATION;
    address public hatsAddress;
    address public fractionTokenAddress;
    address public hatsTimeFrameModuleAddress;
    address public BIG_BANG;

    event ThanksTokenCreated(
        address indexed tokenAddress,
        string name,
        string symbol,
        address workspaceOwner
    );

    function initialize(
        address _initialOwner,
        address _implementation,
        address _hatsAddress,
        address _fractionTokenAddress,
        address _hatsTimeFrameModuleAddress
    ) public initializer {
        __Ownable_init(_initialOwner);
        __UUPSUpgradeable_init();
        IMPLEMENTATION = _implementation;
        hatsAddress = _hatsAddress;
        fractionTokenAddress = _fractionTokenAddress;
        hatsTimeFrameModuleAddress = _hatsTimeFrameModuleAddress;
    }

    function createThanksToken(
        string memory name,
        string memory symbol,
        address workspaceOwner,
        uint256 defaultCoefficient,
        bytes32 salt
    ) public override returns (address) {
        if (_msgSender() != BIG_BANG) {
            revert("ThanksTokenFactory: Only BigBang can call this function");
        }

        // ここのFracionToken、HatsTimeFrameModuleはワークスペースごとに変わるのでFactoryにセットされているものではなく、外部から引数で渡す必要がある。
        bytes memory initData = abi.encode(
            workspaceOwner,
            name,
            symbol,
            hatsAddress,
            fractionTokenAddress,
            hatsTimeFrameModuleAddress,
            defaultCoefficient
        );

        address proxy = LibClone.clone(IMPLEMENTATION, initData);

        emit ThanksTokenCreated(proxy, name, symbol, workspaceOwner);

        return proxy;
    }

    function createThanksTokenDeterministic(
        string memory name,
        string memory symbol,
        address workspaceOwner,
        uint256 defaultCoefficient,
        bytes32 salt
    ) public override returns (address) {
        if (_msgSender() != BIG_BANG) {
            revert("ThanksTokenFactory: Only BigBang can call this function");
        }

        bytes memory initData = abi.encode(
            workspaceOwner,
            name,
            symbol,
            hatsAddress,
            fractionTokenAddress,
            hatsTimeFrameModuleAddress,
            defaultCoefficient
        );

        bytes32 saltHash = _getSalt(
            name,
            symbol,
            workspaceOwner,
            defaultCoefficient,
            salt
        );

        address addr = LibClone.cloneDeterministic(
            IMPLEMENTATION,
            initData,
            saltHash
        );

        emit ThanksTokenCreated(addr, name, symbol, workspaceOwner);

        return addr;
    }

    function predictThanksTokenAddress(
        string memory name,
        string memory symbol,
        address workspaceOwner,
        uint256 defaultCoefficient,
        bytes32 salt
    ) public view override returns (address) {
        bytes memory initData = abi.encode(
            workspaceOwner,
            name,
            symbol,
            hatsAddress,
            fractionTokenAddress,
            hatsTimeFrameModuleAddress,
            defaultCoefficient
        );

        bytes32 saltHash = _getSalt(
            name,
            symbol,
            workspaceOwner,
            defaultCoefficient,
            salt
        );

        return
            LibClone.predictDeterministicAddress(
                IMPLEMENTATION,
                initData,
                saltHash,
                address(this)
            );
    }

    function _getSalt(
        string memory name,
        string memory symbol,
        address workspaceOwner,
        uint256 defaultCoefficient,
        bytes32 salt
    ) internal pure returns (bytes32) {
        return
            keccak256(
                abi.encodePacked(
                    name,
                    symbol,
                    workspaceOwner,
                    defaultCoefficient,
                    salt
                )
            );
    }

    function setImplementation(address _implementation) public onlyOwner {
        IMPLEMENTATION = _implementation;
    }

    function setHatsAddress(address _hatsAddress) public onlyOwner {
        hatsAddress = _hatsAddress;
    }

    function setFractionTokenAddress(
        address _fractionTokenAddress
    ) public onlyOwner {
        fractionTokenAddress = _fractionTokenAddress;
    }

    function setHatsTimeFrameModuleAddress(
        address _hatsTimeFrameModuleAddress
    ) public onlyOwner {
        hatsTimeFrameModuleAddress = _hatsTimeFrameModuleAddress;
    }

    function setBigBang(address _bigBang) public onlyOwner {
        BIG_BANG = _bigBang;
    }

    function _authorizeUpgrade(
        address newImplementation
    ) internal override onlyOwner {}
}
