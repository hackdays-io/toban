// SPDX-License-Identifier: MIT

pragma solidity ^0.8.24;

/**
 * Test-only data source for the differential tests (test/*.Differential.ts):
 * the ThanksToken views SplitsCreator reads (getParticipants, balanceOf,
 * mintedAmount), returning whatever the test sets. Never deployed by the
 * deploy scripts.
 */

contract ThanksTokenDataMock {
    address[] private participants;
    mapping(address => uint256) public balanceOf;
    mapping(address => uint256) public mintedAmount;

    function setParticipants(
        address[] calldata _accounts,
        uint256[] calldata _balances,
        uint256[] calldata _minted
    ) external {
        participants = _accounts;
        for (uint256 i = 0; i < _accounts.length; i++) {
            balanceOf[_accounts[i]] = _balances[i];
            mintedAmount[_accounts[i]] = _minted[i];
        }
    }

    function getParticipants() external view returns (address[] memory) {
        return participants;
    }
}
