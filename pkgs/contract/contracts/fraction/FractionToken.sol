// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import {IHats} from "../hats/src/Interfaces/IHats.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract FractionToken is ERC1155, Ownable {
    uint256 public constant TOKEN_SUPPLY = 10000;
    mapping(uint256 => address[]) private tokenRecipients;
    uint256[] private allTokenIds;
    IHats private hatsContract;

    constructor(string memory uri, address hatsAddress) ERC1155(uri) Ownable() {
        hatsContract = IHats(hatsAddress); // Initialize the Hats contract
    }

    function mint(string memory hatId, address account) public onlyOwner {
        uint256 tokenId = uint256(keccak256(abi.encodePacked(hatId, account)));

        _mint(account, tokenId, TOKEN_SUPPLY, "");

        tokenRecipients[tokenId].push(account);

        if (!_containsTokenId(tokenId)) {
            allTokenIds.push(tokenId);
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
    ) public view returns (bool) {
        uint256 balance = hatsContract.balanceOf(wearer, hatId);
        return balance > 0;
    }

    function balanceOf(
        address account,
        uint256 hatId
    ) public view override returns (uint256) {
        bool hasRole = _hasHatRole(account, hatId);

        uint256 tokenId = uint256(keccak256(abi.encodePacked(hatId, account)));
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
        uint256[] memory ids
    ) public view override(ERC1155) returns (uint256[] memory) {
        uint256[] memory balances = new uint256[](accounts.length);

        for (uint256 i = 0; i < accounts.length; i++) {
            balances[i] = balanceOf(accounts[i], ids[i]);
        }

        return balances;
    }

    function uri(
        uint256 tokenId
    ) public view override(ERC1155) returns (string memory) {
        return super.uri(tokenId);
    }
}
