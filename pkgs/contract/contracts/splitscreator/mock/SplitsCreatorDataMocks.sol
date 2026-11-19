// SPDX-License-Identifier: MIT

pragma solidity ^0.8.24;

/**
 * Test-only data sources for the SplitsCreator differential test
 * (test/SplitsCreator.Differential.ts). Each mock implements only the view
 * functions SplitsCreator reads, and returns whatever the test sets, so the
 * contract can be fed exactly the inputs of a Lean-model test vector.
 * Never deployed by the deploy scripts.
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

contract FractionTokenDataMock {
    mapping(uint256 => address[]) private recipients;
    mapping(uint256 => uint256) private supplies;
    // keccak(account, tokenId) => balance
    mapping(bytes32 => uint256) private balances;

    function getTokenId(
        uint256 _hatId,
        address _wearer
    ) public pure returns (uint256) {
        return uint256(keccak256(abi.encodePacked(_hatId, _wearer)));
    }

    function setWearer(
        uint256 _hatId,
        address _wearer,
        uint256 _supply,
        address[] calldata _recipients,
        address[] calldata _holders,
        uint256[] calldata _balances
    ) external {
        uint256 tokenId = getTokenId(_hatId, _wearer);
        recipients[tokenId] = _recipients;
        supplies[tokenId] = _supply;
        for (uint256 i = 0; i < _holders.length; i++) {
            balances[keccak256(abi.encode(_holders[i], tokenId))] = _balances[i];
        }
    }

    function getTokenRecipients(
        uint256 _tokenId
    ) external view returns (address[] memory) {
        return recipients[_tokenId];
    }

    function totalSupply(
        address _wearer,
        uint256 _hatId
    ) external view returns (uint256) {
        return supplies[getTokenId(_hatId, _wearer)];
    }

    function balanceOf(
        address _account,
        address _wearer,
        uint256 _hatId
    ) external view returns (uint256) {
        return
            balances[keccak256(abi.encode(_account, getTokenId(_hatId, _wearer)))];
    }
}

contract TimeFrameDataMock {
    mapping(bytes32 => uint256) private elapsed;

    function setElapsed(
        address _wearer,
        uint256 _hatId,
        uint256 _elapsed
    ) external {
        elapsed[keccak256(abi.encode(_wearer, _hatId))] = _elapsed;
    }

    function getWearingElapsedTime(
        address _wearer,
        uint256 _hatId
    ) external view returns (uint256) {
        return elapsed[keccak256(abi.encode(_wearer, _hatId))];
    }
}

contract QuestDataMock {
    mapping(bytes32 => uint256) private escrow;

    function setEscrow(
        address _holder,
        uint256 _hatId,
        address _wearer,
        uint256 _amount
    ) external {
        escrow[keccak256(abi.encode(_holder, _hatId, _wearer))] = _amount;
    }

    function getEscrowedBalance(
        address _holder,
        uint256 _hatId,
        address _wearer
    ) external view returns (uint256) {
        return escrow[keccak256(abi.encode(_holder, _hatId, _wearer))];
    }
}
