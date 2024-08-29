// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { ERC1155 } from "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import { IHats } from "../hats/src/Interfaces/IHats.sol";
import { ERC2771Context, Context } from "@openzeppelin/contracts/metatx/ERC2771Context.sol";

contract FractionToken is ERC1155, ERC2771Context {
	uint256 public immutable TOKEN_SUPPLY;

	mapping(uint256 => address[]) private tokenRecipients;

	uint256[] private allTokenIds;

	IHats private hatsContract;

	constructor(
		string memory _uri,
		uint256 _tokenSupply,
		address _hatsAddress,
		address _trustedForwarderAddress
	) ERC1155(_uri) ERC2771Context(_trustedForwarderAddress) {
		hatsContract = IHats(_hatsAddress);
		TOKEN_SUPPLY = _tokenSupply;
	}

	function mint(uint256 hatId, address account) public {
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
		override(ERC2771Context, Context)
		returns (uint256)
	{
		return ERC2771Context._contextSuffixLength();
	}
}
