// SPDX-License-Identifier: MIT

pragma solidity ^0.8.24;

interface IHatsModuleFactory {
	function createHatsModule(
		address _implementation,
		uint256 _hatId,
		bytes calldata _otherImmutableArgs,
		bytes calldata _initData,
		uint256 _saltNonce
	) external returns (address);
}
