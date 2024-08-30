// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IBigBang {
    /**
     * @dev 
     * @param _details A description of the Hat. Should not be larger than 7000 bytes (enforced in changeHatDetails)
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
    ) external returns (uint256);
}
