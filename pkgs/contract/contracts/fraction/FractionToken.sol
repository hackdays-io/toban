// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import {IHats} from "../hats/src/Interfaces/IHats.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import { ERC2771Context } from "@openzeppelin/contracts/metatx/ERC2771Context.sol";

contract FractionToken is ERC1155, ERC2771Context, Ownable {
    uint256 public constant TOKEN_SUPPLY = 10000;
    mapping(uint256 => address[]) private tokenRecipients;
    uint256[] private allTokenIds;
    IHats private hatsContract;

    constructor(string memory _uri, address _hatsAddress, address _trustedForwarder) ERC1155(_uri) ERC2771Context(_trustedForwarder) Ownable() {
        hatsContract = IHats(_hatsAddress); // Initialize the Hats contract
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
    ) private view returns (bool) {
        uint256 balance = hatsContract.balanceOf(wearer, hatId);
        return balance > 0;
    }

    // *** override ***
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

    function _msgSender()
        internal
        view
        override(ERC2771Context, Context)
        returns (address sender)
    {
        return ERC2771Context._msgSender();
    }

    function _msgData()
        internal
        view
        override(ERC2771Context, Context)
        returns (bytes calldata)
    {
        return ERC2771Context._msgData();
    }

    function _contextSuffixLength()
        internal
        view
        virtual
        override(Context, ERC2771Context)
        returns (uint256)
    {
        return ERC2771Context._contextSuffixLength();
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
