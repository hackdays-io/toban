// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IHats} from "../hats/src/Interfaces/IHats.sol";
import "@openzeppelin/contracts/metatx/ERC2771Context.sol";

contract BigBang is ERC2771Context {
    IHats public Hats;
    address public wearer;

    /**
     * @dev Constructor to initialize the trusted forwarder.
     * @param _trustedForwarder Address of the trusted forwarder contract.
     * @param _hatsAddress Address of the hats protocol V1 contract.
     * @param _timeframeHatModuleAddress Address of the timeframeHatModule contract.
     */
    constructor(
        address _trustedForwarder,
        address _hatsAddress,
        address _timeframeHatModuleAddress
    ) ERC2771Context(_trustedForwarder) {
        Hats = IHats(_hatsAddress);
        wearer = _timeframeHatModuleAddress;
    }

    /**
     * @dev 
     * @param _details  A description of the Hat. Should not be larger than 7000 bytes (enforced in changeHatDetails)
     * @param _maxSupply The total instances of the Hat that can be worn at once
     * @param _eligibility The address that can report on the Hat wearer's status
     * @param _toggle The address that can deactivate the Hat
     * @param _mutable Whether the hat's properties are changeable after creation
     * @param _imageURI The image uri for this hat and the fallback for its downstream hats [optional]. Should not be larger than 7000 bytes (enforced in changeHatImageURI)
     * @return topHatId The ID used for navigating to the ProjectTop page after project creation.
     */
    function bigbang(
        string calldata _details,
        uint32 _maxSupply,
        address _eligibility,
        address _toggle,
        bool _mutable,
        string calldata _imageURI
    ) external returns (uint256) {
        uint256 topHatId = Hats.mintTopHat(
          address(this),    // target: Tophat's wearer address. topHatのみがHatterHatを作成できるためTophatを指定する
          _details,         
          _imageURI        
        );

        uint256 hatterHatId = Hats.createHat(
            topHatId,       // _admin: The id of the Hat that will control who wears the newly created hat
            _details,      
            _maxSupply,    
            _eligibility,  
            _toggle,        
            _mutable,        
            _imageURI       
        );

        Hats.mintHat(
          hatterHatId,      // _timeframeHatModuleAddressが以降のハットを作成できるようにHatterHat権限を付与する
          wearer            // wearerは_timeframeHatModuleAddress
        );

        return topHatId;
    }

    // Override _msgSender to use the context from ERC2771Context.
    function _msgSender()
        internal
        view
        override(ERC2771Context)
        returns (address)
    {
        return ERC2771Context._msgSender();
    }

    // Override _msgData to use the context from ERC2771Context.
    function _msgData()
        internal
        view
        override(ERC2771Context)
        returns (bytes calldata)
    {
        return ERC2771Context._msgData();
    }
}
