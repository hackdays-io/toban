// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IThanksToken} from "./IThanksToken.sol";
import {IHats} from "../hats/src/Interfaces/IHats.sol";
import {IHatsFractionTokenModule} from "../hatsmodules/fractiontoken/IHatsFractionTokenModule.sol";
import {IHatsTimeFrameModule} from "../hatsmodules/timeframe/IHatsTimeFrameModule.sol";
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {Clone} from "solady/src/utils/Clone.sol";
import "hardhat/console.sol";

contract ThanksToken is Clone, ERC20("", ""), IThanksToken {
    mapping(address => uint256) private _mintedAmount;
    mapping(address => uint256) private _addressCoefficient;
    address[] private _participants;
    mapping(address => bool) private _isParticipant;

    uint256 private constant SECONDS_PER_HOUR = 3600;

    uint256 private constant DEFAULT_COEFFICIENT = 1e18;

    // Clone data accessors
    // The data is encoded using abi.encode in the following order:
    // workspaceOwner, name, symbol, hatsAddress, fractionTokenAddress,
    // hatsTimeFrameModuleAddress, defaultCoefficient

    // With abi.encode:
    // - offset 0: workspaceOwner (address) - 32 bytes
    // - offset 32: offset to name data - 32 bytes
    // - offset 64: offset to symbol data - 32 bytes
    // - offset 96: hatsAddress (address) - 32 bytes
    // - offset 128: fractionTokenAddress (address) - 32 bytes
    // - offset 160: hatsTimeFrameModuleAddress (address) - 32 bytes
    // - offset 192: defaultCoefficient (uint256) - 32 bytes
    // - offset 224+: actual string data

    function WORKSPACE_OWNER() public pure returns (address) {
        return _getArgAddress(12); // 12 is the Clone offset
    }

    function HATS() public pure returns (IHats) {
        return IHats(_getArgAddress(108)); // 12 + 96
    }

    function FRACTION_TOKEN() public pure returns (IHatsFractionTokenModule) {
        return IHatsFractionTokenModule(_getArgAddress(140)); // 12 + 128
    }

    function HATS_TIME_FRAME_MODULE()
        public
        pure
        returns (IHatsTimeFrameModule)
    {
        return IHatsTimeFrameModule(_getArgAddress(172)); // 12 + 160
    }

    function NAME() public pure returns (string memory) {
        return _getArgString(0);
    }

    function SYMBOL() public pure returns (string memory) {
        return _getArgString(1);
    }

    // Helper function to read dynamic strings from clone args
    function _getArgString(
        uint256 argIndex
    ) internal pure returns (string memory) {
        // Calculate offset to the string offset pointer
        // Name is at offset 32 (after workspaceOwner), Symbol at offset 64
        uint256 stringPointerOffset = 32 + (argIndex * 32);

        // Read the offset to actual string data
        uint256 stringDataOffset = _getArgUint256(stringPointerOffset);

        // Read string length and data
        uint256 stringLength = _getArgUint256(stringDataOffset);

        bytes memory data = new bytes(stringLength);
        for (uint256 i = 0; i < stringLength; i++) {
            data[i] = bytes1(uint8(_getArgUint8(stringDataOffset + 32 + i)));
        }

        return string(data);
    }

    // Override ERC20 functions to use Clone data
    function name() public pure override returns (string memory) {
        return NAME();
    }

    function symbol() public pure override returns (string memory) {
        return SYMBOL();
    }

    // Constructor is not called in Clone pattern, so we don't need to call ERC20 constructor

    // Owner modifier
    modifier onlyOwner() {
        require(
            msg.sender == WORKSPACE_OWNER(),
            "Ownable: caller is not the owner"
        );
        _;
    }

    // ThanksToken specific functions
    function mint(
        address to,
        uint256 amount,
        RelatedRole[] memory relatedRoles
    ) public override returns (bool) {
        require(to != msg.sender, "Cannot mint to yourself");
        require(amount > 0, "Amount must be greater than 0");

        uint256 maxAmount = mintableAmount(msg.sender, relatedRoles);
        require(amount <= maxAmount, "Amount exceeds mintable amount");

        // Update minted amount
        _mintedAmount[msg.sender] += amount;

        // Mint tokens using ERC20's _mint
        _mint(to, amount);

        if (!_isParticipant[msg.sender]) {
            _participants.push(msg.sender);
            _isParticipant[msg.sender] = true;
        }
        if (!_isParticipant[to]) {
            _participants.push(to);
            _isParticipant[to] = true;
        }

        emit TokenMinted(msg.sender, to, amount);

        return true;
    }

    function mintableAmount(
        address owner,
        RelatedRole[] memory relatedRoles
    ) public view override returns (uint256) {
        uint256 totalMintable = 0;

        // Calculate based on role tenure and share ownership
        for (uint256 i = 0; i < relatedRoles.length; i++) {
            RelatedRole memory role = relatedRoles[i];

            uint256 shareBalance = FRACTION_TOKEN().balanceOf(
                owner,
                role.wearer,
                role.hatId
            );

            uint256 shareTotalSupply = FRACTION_TOKEN().totalSupply(
                role.wearer,
                role.hatId
            );

            // Skip if user has no shares for this role or total supply is zero
            if (shareBalance == 0 || shareTotalSupply == 0) {
                continue;
            }

            uint256 wearingTimeSeconds = HATS_TIME_FRAME_MODULE()
                .getWearingElapsedTime(role.wearer, role.hatId);
            uint256 wearingTime10Minutes = wearingTimeSeconds / 10 minutes;

            // Calculate mintable amount based on role tenure (hours) and share ownership
            uint256 roleBasedAmount = (wearingTime10Minutes * shareBalance) /
                shareTotalSupply;

            totalMintable += roleBasedAmount;
        }

        // Add 10% of received ThanksTokens
        totalMintable += balanceOf(owner) / 10;

        // Apply address coefficient
        uint256 coefficient = _addressCoefficient[owner] > 0
            ? _addressCoefficient[owner]
            : DEFAULT_COEFFICIENT;

        totalMintable = ((totalMintable * coefficient) / 1e18) * 1 ether;

        // Subtract already minted amount
        if (totalMintable > _mintedAmount[owner]) {
            return totalMintable - _mintedAmount[owner];
        }

        return 0;
    }

    function mintedAmount(
        address owner
    ) public view override returns (uint256) {
        return _mintedAmount[owner];
    }

    function getParticipants() public view returns (address[] memory) {
        return _participants;
    }

    function addressCoefficient(
        address owner
    ) public view override returns (uint256) {
        return _addressCoefficient[owner];
    }

    function defaultCoefficient() public pure override returns (uint256) {
        return DEFAULT_COEFFICIENT;
    }

    function setAddressCoefficient(
        address userAddress,
        uint256 coefficient
    ) public onlyOwner {
        _addressCoefficient[userAddress] = coefficient;
    }

    /**
     * @notice Sets coefficients for multiple addresses at once
     * @param userAddresses Array of addresses to set coefficients for
     * @param coefficients Array of coefficient values
     */
    function setAddressCoefficients(
        address[] memory userAddresses,
        uint256[] memory coefficients
    ) public onlyOwner {
        require(
            userAddresses.length == coefficients.length,
            "Arrays length mismatch"
        );

        for (uint256 i = 0; i < userAddresses.length; i++) {
            _addressCoefficient[userAddresses[i]] = coefficients[i];
        }
    }

    // Note: setDefaultCoefficient is not available in Clone pattern
    // as DEFAULT_COEFFICIENT is immutable from the clone data
}
