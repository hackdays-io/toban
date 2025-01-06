// SPDX-License-Identifier: MIT

pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";

interface IFractionToken is IERC1155 {
	event InitialMint(
		address indexed wearer,
		uint256 indexed hatId,
		uint256 indexed tokenId
	);

	function mintInitialSupply(
		uint256 hatId,
		address account,
		uint256 amount
	) external;

	function mint(uint256 hatId, address account, uint256 amount) external;

	function burn(
		address from,
		address wearer,
		uint256 hatId,
		uint256 value
	) external;

	function getTokenRecipients(
		uint256 tokenId
	) external view returns (address[] memory);

	function getTokenId(
		uint256 hatId,
		address account
	) external view returns (uint256);

	function balanceOf(
		address account,
		address warer,
		uint256 hatId
	) external view returns (uint256);

	function balanceOfBatch(
		address[] memory accounts,
		address[] memory warers,
		uint256[] memory hatIds
	) external view returns (uint256[] memory);

	function totalSupply(
		address wearer,
		uint256 hatId
	) external view returns (uint256);
}
