// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import {IHats} from "../hats/src/Interfaces/IHats.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "hardhat/console.sol";

contract FractionToken is ERC1155, Ownable {
    uint256 public constant TOKEN_SUPPLY = 10000;
    mapping(uint256 => address[]) private tokenRecipients;
    uint256[] private allTokenIds;
    IHats private hatsContract;

    constructor(string memory uri, address hatsAddress) ERC1155(uri) Ownable() {
        hatsContract = IHats(hatsAddress); // Initialize the Hats contract
    }

    function mint(uint256 hatId, address account) public onlyOwner {
        uint256 tokenId = getTokenId(hatId, account);
        _mint(account, tokenId, TOKEN_SUPPLY, "");

        if (!_containsTokenId(tokenId)) {
            allTokenIds.push(tokenId);
        }
    }

    function safeTransferFrom(
        address from,
        address to,
        uint256 tokenId,
        uint256 amount,
        bytes memory data
    ) public override {
        super.safeTransferFrom(from, to, tokenId, amount, data);

        if (!_containsRecipient(tokenId, to)) {
            tokenRecipients[tokenId].push(to);
        }
    }

    function safeBatchTransferFrom(
        address from,
        address to,
        uint256[] memory tokenIds,
        uint256[] memory amounts,
        bytes memory data
    ) public override {
        super.safeBatchTransferFrom(from, to, tokenIds, amounts, data);

        for (uint256 i = 0; i < tokenIds.length; i++) {
            if (!_containsRecipient(tokenIds[i], to)) {
                tokenRecipients[tokenIds[i]].push(to);
            }
        }
    }

    function getTokenRecipients(
        uint256 tokenId
    ) public view returns (address[] memory) {
        return tokenRecipients[tokenId];
    }

    function getAllTokenIds() public view returns (uint256[] memory) {
        return allTokenIds;
    }

    function getTokenId(
        uint256 hatId,
        address account
    ) public pure returns (uint256) {
        return uint256(keccak256(abi.encodePacked(hatId, account)));
    }

    function _containsRecipient(
        uint256 tokenId,
        address recipient
    ) private view returns (bool) {
        address[] memory recipients = tokenRecipients[tokenId];
        for (uint256 i = 0; i < recipients.length; i++) {
            if (recipients[i] == recipient) {
                return true;
            }
        }
        return false;
    }

    function _containsTokenId(uint256 tokenId) private view returns (bool) {
        for (uint256 i = 0; i < allTokenIds.length; i++) {
            if (allTokenIds[i] == tokenId) {
                return true;
            }
        }
        return false;
    }

    function _hasHatRole(
        address wearer,
        uint256 hatId
    ) private view returns (bool) {
        uint256 balance = hatsContract.balanceOf(wearer, hatId);
        return balance > 0;
    }

    function balanceOf(
        address account,
        address wearer,
        uint256 hatId
    ) public view returns (uint256) {
        bool hasRole = _hasHatRole(account, hatId);

        uint256 tokenId = getTokenId(hatId, wearer);
        uint256 erc1155Balance = super.balanceOf(account, tokenId);

        if (hasRole && erc1155Balance == 0) {
            return TOKEN_SUPPLY;
        }

        if (hasRole && erc1155Balance > 0) {
            return erc1155Balance;
        }

        return erc1155Balance;
    }

    function balanceOfBatch(
        address[] memory accounts,
        address[] memory wearers,
        uint256[] memory hatIds
    ) public view returns (uint256[] memory) {
        uint256[] memory balances = new uint256[](accounts.length);

        for (uint256 i = 0; i < accounts.length; i++) {
            balances[i] = balanceOf(accounts[i], wearers[i], hatIds[i]);
        }

        return balances;
    }

    // // test because retunrn 0
    // // https://sepolia.etherscan.io/address/0x89ba4d26d9cf02d8edf9d7b46d1376e40a422b60#readContract
    // // 0x6a8432D321273E2be8A30AeF083915CFDB7F1B85
    // // 1234567890
    // function erc1155BalanceOf(
    //     address account,
    //     uint256 tokenId
    // ) public view returns (uint256) {
    //     uint256 erc1155Balance = super.balanceOf(account, tokenId);
    //     return erc1155Balance;
    // }
}
