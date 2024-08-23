// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import {Hats} from "../hats/src/Hats.sol";
import {IHats} from "../hats/src/Interfaces/IHats.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract FractionToken is ERC1155, Hats, Ownable {
    uint256 public constant TOKEN_SUPPLY = 10000;
    mapping(uint256 => address[]) private tokenRecipients;
    uint256[] private allTokenIds;
    IHats private hatsContract;

    constructor(string memory uri, address hatsAddress) ERC1155(uri) Ownable() {
        hatsContract = IHats(hatsAddress);  // Initialize the Hats contract
    }

    function mint(string memory hatId, address account) public onlyOwner {
        bytes32 tokenId = keccak256(abi.encodePacked(hatId, account));
        uint256 tokenIdUint = uint256(tokenId);

        _mint(account, tokenIdUint, TOKEN_SUPPLY, "");

        tokenRecipients[tokenIdUint].push(account);

        if (!_containsTokenId(tokenIdUint)) {
            allTokenIds.push(tokenIdUint);
        }
    }

    function getTokenRecipients(uint256 tokenId) public view returns (address[] memory) {
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

    function _hasHatRole(address wearer, uint256 hatId) public view returns (bool) {
        uint256 balance = hatsContract.balanceOf(wearer, hatId);
        return balance > 0;
    }

    function balanceOf(address account, uint256 hatId) public view override returns (uint256) {
        bool hasRole = _hasHatRole(account, hatId);

        uint256 tokenId = keccak256(abi.encodePacked(hatId, account));
        uint256 erc1155Balance = super.balanceOf(account, tokenId);

        if (hasRole && erc1155Balance == 0) {
            return TOKEN_SUPPLY;
        }

        if (hasRole && erc1155Balance > 0) {
            return erc1155Balance;
        }

        return erc1155Balance;
    }
}
