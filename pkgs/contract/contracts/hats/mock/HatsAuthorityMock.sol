// SPDX-License-Identifier: MIT

pragma solidity ^0.8.24;

/**
 * Test-only stand-in for Hats Protocol in the HatsTimeFrameModule differential
 * test (test/HatsTimeFrameModule.Differential.ts). It implements only what
 * HatsTimeFrameModule calls: the two authority checks return whatever the test
 * sets, and the hat transfers always succeed and change nothing, so the
 * module's own logic can be compared with the Lean model on any call
 * sequence. Never deployed by the deploy scripts.
 */
contract HatsAuthorityMock {
    mapping(uint256 => mapping(address => bool)) private admins;
    mapping(uint256 => mapping(address => bool)) private wearers;

    function setAuthority(
        uint256 hatId,
        address[] calldata _admins,
        address[] calldata _wearers
    ) external {
        for (uint256 i = 0; i < _admins.length; i++) {
            admins[hatId][_admins[i]] = true;
        }
        for (uint256 i = 0; i < _wearers.length; i++) {
            wearers[hatId][_wearers[i]] = true;
        }
    }

    function isAdminOfHat(
        address user,
        uint256 hatId
    ) external view returns (bool) {
        return admins[hatId][user];
    }

    function isWearerOfHat(
        address user,
        uint256 hatId
    ) external view returns (bool) {
        return wearers[hatId][user];
    }

    function mintHat(uint256, address) external pure returns (bool) {
        return true;
    }

    function transferHat(uint256, address, address) external pure {}

    function renounceHat(uint256) external pure {}
}
