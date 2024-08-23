// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract FractionToken is ERC1155, Ownable {
    uint256 public constant TOKEN_SUPPLY = 10000;

    mapping(uint256 => address[]) private tokenRecipients;

    constructor(string memory uri) ERC1155(uri) Ownable() {}

    function mint(string memory hatId, address account) public onlyOwner {
        // Combine HatId and Address to create a unique tokenId
        bytes32 tokenId = keccak256(abi.encodePacked(hatId, account));
        uint256 tokenIdUint = uint256(tokenId);

        _mint(account, tokenIdUint, TOKEN_SUPPLY, "");

        // Store the account in the list of recipients for this tokenId
        tokenRecipients[tokenIdUint].push(account);
    }

    function getTokenRecipients(uint256 tokenId) public view returns (address[] memory) {
        return tokenRecipients[tokenId];
    }
}
