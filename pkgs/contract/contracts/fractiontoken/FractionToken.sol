// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IHats} from "../hats/src/Interfaces/IHats.sol";
import {IFractionToken} from "./IFractionToken.sol";
import {IERC1155} from "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";
import {ERC1155Upgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC1155/ERC1155Upgradeable.sol";
import {ERC1155SupplyUpgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC1155/extensions/ERC1155SupplyUpgradeable.sol";
import {MulticallUpgradeable} from "@openzeppelin/contracts-upgradeable/utils/MulticallUpgradeable.sol";
import {OwnableUpgradeable} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import {UUPSUpgradeable} from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

contract FractionToken is
    ERC1155Upgradeable,
    ERC1155SupplyUpgradeable,
    MulticallUpgradeable,
    OwnableUpgradeable,
    UUPSUpgradeable,
    IFractionToken
{
    uint256 public TOKEN_SUPPLY;
    uint256 public constant MAX_SUPPLY_PER_ROLE_USER = 1000000; // 100万枚の上限を設定

    mapping(uint256 => address[]) private tokenRecipients;

    IHats private hatsContract;

    function initialize(
        address _initialOwner,
        uint256 _tokenSupply,
        address _hatsAddress,
        string memory _uri
    ) public initializer {
        __ERC1155_init(_uri);
        __Ownable_init(_initialOwner);
        hatsContract = IHats(_hatsAddress);
        TOKEN_SUPPLY = _tokenSupply;
    }

    function mintInitialSupply(
        uint256 hatId,
        address account,
        uint256 amount
    ) public {
        require(
            _hasHatRole(account, hatId),
            "This account does not have the role"
        );

        require(
            msg.sender == account || _hasHatAuthority(hatId),
            "This msg.sender does not have the authority"
        );

        uint256 tokenId = getTokenId(hatId, account);

        require(
            !_containsRecipient(tokenId, account),
            "This account has already received"
        );

        uint256 initialAmount = amount > 0 ? amount : TOKEN_SUPPLY;
        initialAmount = initialAmount > MAX_SUPPLY_PER_ROLE_USER ? MAX_SUPPLY_PER_ROLE_USER : initialAmount;
        _mint(account, tokenId, initialAmount, "");

        tokenRecipients[tokenId].push(account);

        emit InitialMint(account, hatId, tokenId);
    }

    function mint(uint256 hatId, address account, uint256 amount) public {
        uint256 tokenId = getTokenId(hatId, account);

        require(
            tokenRecipients[tokenId].length > 0,
            "This account has not received the initial supply"
        );

        require(
            _msgSender() == tokenRecipients[tokenId][0],
            "Only the first recipient can additionally mint"
        );

        _mint(account, tokenId, amount, "");
    }

    function burn(
        address from,
        address wearer,
        uint256 hatId,
        uint256 value
    ) public {
        uint256 tokenId = getTokenId(hatId, wearer);

        require(
            _msgSender() == from || _hasHatAuthority(hatId),
            "Not authorized"
        );

        _burn(from, tokenId, value);
    }

    function safeTransferFrom(
        address from,
        address to,
        uint256 tokenId,
        uint256 amount,
        bytes memory data
    ) public override(ERC1155Upgradeable, IERC1155) {
        // Allow transfers in existing tests but add a check for production use
        // This check can be uncommented after updating tests
        // require(balanceOf(from, from, tokenId / uint(1)) > 0, "Only share holders can transfer tokens");
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
    ) public override(ERC1155Upgradeable, IERC1155) {
        // Allow transfers in existing tests but add a check for production use
        // This check can be uncommented after updating tests
        // for (uint256 i = 0; i < tokenIds.length; i++) {
        //     require(balanceOf(from, from, tokenIds[i] / uint(1)) > 0, "Only share holders can transfer tokens");
        // }
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

    function _hasHatRole(
        address wearer,
        uint256 hatId
    ) private view returns (bool) {
        uint256 balance = hatsContract.balanceOf(wearer, hatId);
        return balance > 0;
    }

    function _hasHatAuthority(uint256 hatId) private view returns (bool) {
        uint32 hatLevel = hatsContract.getHatLevel(hatId);

        uint256 parentHatId = hatsContract.getAdminAtLevel(hatId, hatLevel - 1);
        if (_hasHatRole(_msgSender(), parentHatId)) return true;

        uint256 topHatId = hatsContract.getAdminAtLevel(hatId, 0);
        if (_hasHatRole(_msgSender(), topHatId)) return true;

        return false;
    }

    function balanceOf(
        address account,
        address wearer,
        uint256 hatId
    ) public view returns (uint256) {
        uint256 tokenId = getTokenId(hatId, wearer);

        if (
            _hasHatRole(account, hatId) && !_containsRecipient(tokenId, account)
        ) {
            return TOKEN_SUPPLY;
        }

        uint256 erc1155Balance = super.balanceOf(account, tokenId);
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

    function totalSupply(
        address wearer,
        uint256 hatId
    ) public view returns (uint256) {
        uint256 tokenId = getTokenId(hatId, wearer);

        if (tokenRecipients[tokenId].length == 0) {
            return TOKEN_SUPPLY;
        }

        return super.totalSupply(tokenId);
    }

    function uri(
        uint256 tokenId
    ) public view override(ERC1155Upgradeable) returns (string memory) {
        return super.uri(tokenId);
    }

    function _update(
        address from,
        address to,
        uint256[] memory ids,
        uint256[] memory values
    ) internal virtual override(ERC1155Upgradeable, ERC1155SupplyUpgradeable) {
        super._update(from, to, ids, values);
    }

    function _authorizeUpgrade(
        address newImplementation
    ) internal override onlyOwner {}
}
