// SPDX-License-Identifier: MIT

pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";

interface IThanksToken is IERC1155 {
	event ThanksGiven(
		address indexed sender,
		address indexed recipient,
		string message,
		uint256 amount,
		uint256 timestamp
	);

	function giveThanks(
		address recipient,
		uint256 amount,
		string calldata message
	) external;

	function getThanksByRecipient(
		address recipient
	) external view returns (uint256);

	function getThanksBySender(
		address sender
	) external view returns (uint256);

	function getThanksHistory(
		address account
	) external view returns (ThanksHistory[] memory);

	function getMessageById(
		uint256 thanksId
	) external view returns (string memory);

	struct ThanksHistory {
		uint256 id;
		address sender;
		address recipient;
		string message;
		uint256 amount;
		uint256 timestamp;
	}
}