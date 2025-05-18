// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IThanksToken} from "./IThanksToken.sol";
import {IHats} from "../hats/src/Interfaces/IHats.sol";
import {IFractionToken} from "../fractiontoken/IFractionToken.sol";
import {IHatsTimeFrameModule} from "../hatsmodules/timeframe/IHatsTimeFrameModule.sol";
import {ERC20Upgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import {OwnableUpgradeable} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import {UUPSUpgradeable} from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

contract ThanksToken is
    ERC20Upgradeable,
    OwnableUpgradeable,
    UUPSUpgradeable,
    IThanksToken
{
    IHats private hatsContract;
    IFractionToken private fractionToken;
    IHatsTimeFrameModule private hatsTimeFrameModule;

    mapping(address => uint256) private _mintedAmount;
    mapping(address => uint256) private _addressCoefficient;

    uint256 private _defaultCoefficient;
    uint256 private constant SECONDS_PER_HOUR = 3600;

    function initialize(
        address _initialOwner,
        string memory _name,
        string memory _symbol,
        address _hatsAddress,
        address _fractionTokenAddress,
        address _hatsTimeFrameModuleAddress,
        uint256 defaultCoefficient
    ) public initializer {
        __ERC20_init(_name, _symbol);
        __Ownable_init(_initialOwner);
        __UUPSUpgradeable_init();
        hatsContract = IHats(_hatsAddress);
        fractionToken = IFractionToken(_fractionTokenAddress);
        hatsTimeFrameModule = IHatsTimeFrameModule(_hatsTimeFrameModuleAddress);
        _defaultCoefficient = defaultCoefficient > 0 ? defaultCoefficient : 1e18;
    }

    function mint(address to, uint256 amount, RelatedRole[] memory relatedRoles) public override returns (bool) {
        require(to != msg.sender, "Cannot mint to yourself");
        require(amount > 0, "Amount must be greater than 0");
        
        uint256 maxAmount = mintableAmount(msg.sender, relatedRoles);
        require(amount <= maxAmount, "Amount exceeds mintable amount");
        
        // Update minted amount
        _mintedAmount[msg.sender] += amount;
        
        // Mint tokens
        _mint(to, amount);
        
        emit TokensMinted(to, amount);
        
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

            uint256 shareBalance = fractionToken.balanceOf(
                owner,
                role.wearer,
                role.hatId
            );
            
            uint256 shareTotalSupply = fractionToken.totalSupply(
                role.wearer,
                role.hatId
            );
            
            // Skip if user has no shares for this role or total supply is zero
            if (shareBalance == 0 || shareTotalSupply == 0) {
                continue;
            }

            uint256 wearingTimeSeconds = hatsTimeFrameModule
                .getWearingElapsedTime(role.wearer, role.hatId);
            uint256 wearingTimeHours = wearingTimeSeconds / 1 hours;

            // Calculate mintable amount based on role tenure (hours) and share ownership
            uint256 roleBasedAmount = (wearingTimeHours * shareBalance) /
                shareTotalSupply;
            
            // Add a minimum amount based on share ownership percentage
            // This ensures users with shares but no hat or short tenure still get tokens
            if (roleBasedAmount == 0 && shareBalance > 0) {
                uint256 sharePercentage = (shareBalance * 1e18) / shareTotalSupply;
                roleBasedAmount = (sharePercentage / 1e16) + 1; // Minimum of 1 token for any share ownership
            }
            
            totalMintable += roleBasedAmount;
        }

        // Add 10% of received ThanksTokens
        totalMintable += balanceOf(owner) / 10;

        // Apply address coefficient
        uint256 coefficient = _addressCoefficient[owner] > 0
            ? _addressCoefficient[owner]
            : _defaultCoefficient;
        totalMintable = (totalMintable * coefficient) / 1e18;

        // Subtract already minted amount
        if (totalMintable > _mintedAmount[owner]) {
            return totalMintable - _mintedAmount[owner];
        }

        return 0;
    }
    
    function mintedAmount(address owner) public view override returns (uint256) {
        return _mintedAmount[owner];
    }
    
    function addressCoefficient(address owner) public view override returns (uint256) {
        return _addressCoefficient[owner];
    }
    
    function defaultCoefficient() public view override returns (uint256) {
        return _defaultCoefficient;
    }
    
    function setAddressCoefficient(address userAddress, uint256 coefficient) public onlyOwner {
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
        require(userAddresses.length == coefficients.length, "Arrays length mismatch");
        
        for (uint256 i = 0; i < userAddresses.length; i++) {
            _addressCoefficient[userAddresses[i]] = coefficients[i];
        }
    }
    
    function setDefaultCoefficient(uint256 coefficient) public onlyOwner {
        require(coefficient > 0, "Coefficient must be greater than 0");
        _defaultCoefficient = coefficient;
    }
    
    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}
}
