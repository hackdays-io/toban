// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IHats} from "../hats/src/Interfaces/IHats.sol";
import {IFractionToken} from "../fraction/FractionToken.sol";
import {ITimeframe} from "../timeframe/interfaces/ITimeframe.sol";
import "@openzeppelin/contracts/metatx/ERC2771Context.sol";

contract MultiClaimsFractionHatter is ERC2771Context {
    IHats public hatsContract;
    IFractionToken public fractionTokenContract;
    ITimeframe public timeframeContract;

    // Constructor to initialize the contracts and trusted forwarder
    constructor(
        address _hatsAddress,
        address _fractionTokenAddress,
        address _timeframeAddress,
        address _trustedForwarder
    ) ERC2771Context(_trustedForwarder) {
        hatsContract = IHats(_hatsAddress);
        fractionTokenContract = IFractionToken(_fractionTokenAddress);
        timeframeContract = ITimeframe(_timeframeAddress);
    }

    // Override _msgSender to use the context from ERC2771Context.
    function _msgSender() internal view override(ERC2771Context) returns (address) {
        return ERC2771Context._msgSender();
    }

    // Override _msgData to use the context from ERC2771Context.
    function _msgData() internal view override(ERC2771Context) returns (bytes calldata) {
        return ERC2771Context._msgData();
    }

    // Function to create a hat, mint a fraction token, and set the wore time
    function bigbang(
        uint256 _admin,
        string calldata _details,
        uint32 _maxSupply,
        address _eligibility,
        address _toggle,
        bool _mutable,
        string calldata _imageURI,
        address _wearer
    ) external {
        // Step 1: Create the hat
        uint256 newHatId = hatsContract.createHat(
            _admin,
            _details,
            _maxSupply,
            _eligibility,
            _toggle,
            _mutable,
            _imageURI
        );

        // Step 2: Mint the fraction token
        fractionTokenContract.mint(
            string(abi.encodePacked(newHatId)),
            _wearer
        );

        // Step 3: Set the wore time
        timeframeContract.setWoreTime(_wearer, newHatId);
    }
}
