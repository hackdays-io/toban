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

// function createHatsModule(
//     address _implementation,        // 実際のモジュール（例：HatsHatCreatorModule）の実装アドレス
//     uint256 _hatId,                 // このモジュールが紐づくHat（たとえばTopHat）
//     bytes calldata _otherImmutableArgs, // immutable引数（今回は空）
//     bytes calldata _initData,       // 初期化に使うパラメータ（今回は owner アドレスを渡してる）
//     uint256 _saltNonce              // デプロイ時のsalt（アドレスを一意にするため）
// ) external returns (address);
