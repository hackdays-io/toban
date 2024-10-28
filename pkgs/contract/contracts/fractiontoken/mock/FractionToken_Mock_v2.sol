// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts-upgradeable/token/ERC1155/ERC1155Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/ContextUpgradeable.sol";
import { IHats } from "../../hats/src/Interfaces/IHats.sol";
import "./../../ERC2771ContextUpgradeable.sol";


contract FractionToken_Mock_v2 is ERC1155Upgradeable, ERC2771ContextUpgradeable {
uint256 public TOKEN_SUPPLY;

	mapping(uint256 => address[]) private tokenRecipients;

	IHats public hatsContract;

	function initialize(
		string memory _uri,
		uint256 _tokenSupply,
		address _hatsAddress,
		address _trustedForwarderAddress
	) initializer public {
		__ERC1155_init(_uri);
		__ERC2771Context_init(address(_trustedForwarderAddress));
		hatsContract = IHats(_hatsAddress);
		TOKEN_SUPPLY = _tokenSupply;
	}

	function mint(uint256 hatId, address account) public {
		require(_hasHatRole(account, hatId), "not authorized");

		uint256 tokenId = getTokenId(hatId, account);

		require(!_containsRecipient(tokenId, account), "already received");

		_mint(account, tokenId, TOKEN_SUPPLY, "");

		if (!_containsRecipient(tokenId, account)) {
			tokenRecipients[tokenId].push(account);
		}
	}

	function burn(
		address from,
		address wearer,
		uint256 hatId,
		uint256 value
	) public {
		uint256 tokenId = getTokenId(hatId, wearer);

		require(_msgSender() == from || _containsRecipient(tokenId, _msgSender()), "not authorized");

		_burn(from, tokenId, value);
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

	function balanceOf(
		address account,
		address wearer,
		uint256 hatId
	) public view returns (uint256) {
		uint256 tokenId = getTokenId(hatId, wearer);

		if (_hasHatRole(account, hatId) && !_containsRecipient(tokenId, account)) {
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

	function uri(
		uint256 tokenId
	) public view override(ERC1155Upgradeable) returns (string memory) {
		return super.uri(tokenId);
	}

	function _msgSender()
		internal
		view
		override(ERC2771ContextUpgradeable, ContextUpgradeable)
		returns (address sender)
	{
		return super._msgSender();
	}

	function _msgData()
		internal
		view
		override(ERC2771ContextUpgradeable, ContextUpgradeable)
		returns (bytes calldata)
	{
		return super._msgData();
	}

	function _contextSuffixLength()
		internal
		view
		virtual
		override(ContextUpgradeable)
		returns (uint256)
	{
		return super._contextSuffixLength();
	}

	/**
   * 検証用に追加した関数
   */
  function testUpgradeFunction() external pure returns (string memory) {
    return "testUpgradeFunction";
  }
}
