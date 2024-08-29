// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

// import { console2 } from "forge-std/Test.sol"; // remove before deploy
import { HatsModule } from "./HatsModule.sol";
import { LibClone } from "solady/src/utils/LibClone.sol";
import { IHats } from "../src/Interfaces/IHats.sol";

import "hardhat/console.sol";

contract HatsModuleFactory {
	/*//////////////////////////////////////////////////////////////
                            CUSTOM ERRORS
  //////////////////////////////////////////////////////////////*/

	/**
	 * @notice Emitted if attempting to deploy a clone of `implementation` for a given `hatId`, `otherImmutableArgs`, and
	 * `saltNonce` that already has a HatsModule deployment
	 */
	error HatsModuleFactory_ModuleAlreadyDeployed(
		address implementation,
		uint256 hatId,
		bytes otherImmutableArgs,
		uint256 saltNonce
	);

	/// @notice Emitted when array arguments to a batch function have mismatching lengths
	error BatchArrayLengthMismatch();

	/*//////////////////////////////////////////////////////////////
                              EVENTS
  //////////////////////////////////////////////////////////////*/

	/// @notice Emitted when a HatsModule for `hatId`, `otherImmutableArgs`, and `saltNonce` is deployed to address
	/// `instance`
	event HatsModuleFactory_ModuleDeployed(
		address implementation,
		address instance,
		uint256 hatId,
		bytes otherImmutableArgs,
		bytes initData,
		uint256 saltNonce
	);

	/*//////////////////////////////////////////////////////////////
                            CONSTANTS
  //////////////////////////////////////////////////////////////*/

	/// @notice The address of the Hats Protocol
	IHats public immutable HATS;
	/// @notice The version of this HatsModuleFactory
	string public version;

	/*//////////////////////////////////////////////////////////////
                             CONSTRUCTOR
  //////////////////////////////////////////////////////////////*/

	/**
	 * @param _hats The address of Hats Protocol
	 * @param _version The label for this version of HatsModule
	 */
	constructor(IHats _hats, string memory _version) {
		HATS = _hats;
		version = _version;
	}

	/*//////////////////////////////////////////////////////////////
                            PUBLIC FUNCTIONS
  //////////////////////////////////////////////////////////////*/

	/**
	 * @notice Deploys a new HatsModule instance for a given `_hatId` to a deterministic address, if not
	 * already deployed, and sets up the new instance with initial operational values.
	 * @dev Will revert *after* the instance is deployed if their initial values are invalid.
	 * @param _implementation The address of the implementation contract of which to deploy a clone
	 * @param _hatId The hat for which to deploy a HatsModule.
	 * @param _otherImmutableArgs Other immutable args to pass to the clone as immutable storage.
	 * @param _initData The encoded data to pass to the `setUp` function of the new HatsModule instance. Leave empty if no
	 * {setUp} is required.
	 * @param _saltNonce The nonce to use when calculating the salt
	 * @return _instance The address of the deployed HatsModule instance
	 */
	function createHatsModule(
		address _implementation,
		uint256 _hatId,
		bytes calldata _otherImmutableArgs,
		bytes calldata _initData,
		uint256 _saltNonce
	) public returns (address _instance) {
		// calculate unique params that will be used to check for existing deployments and deploy the clone if none exists
		bytes memory args = _encodeArgs(
			_implementation,
			_hatId,
			_otherImmutableArgs
		);
		bytes32 _salt = _calculateSalt(args, _saltNonce);

		// check if a HatsModule has already been deployed for these parameters
		if (
			_getHatsModuleAddress(_implementation, args, _salt).code.length > 0
		) {
			revert HatsModuleFactory_ModuleAlreadyDeployed(
				_implementation,
				_hatId,
				_otherImmutableArgs,
				_saltNonce
			);
		}

		// deploy the clone to a deterministic address
		_instance = LibClone.cloneDeterministic(_implementation, args, _salt);

		// set up and initialize the module instance; empty _initData is allowed
		HatsModule(_instance).setUp(_initData);

		// log the deployment
		emit HatsModuleFactory_ModuleDeployed(
			_implementation,
			address(_instance),
			_hatId,
			_otherImmutableArgs,
			_initData,
			_saltNonce
		);
	}

	/**
	 * @notice Deploys new HatsModule instances in batch.
	 * Every module is created for a given `_hatId` to a deterministic address, if not already deployed.
	 * Sets up each new instance with initial operational values.
	 * @dev Will revert *after* an instance is deployed if its initial values are invalid.
	 * @param _implementations The addresses of the implementation contracts of which to deploy a clone
	 * @param _hatIds The hats for which to deploy a HatsModule.
	 * @param _otherImmutableArgsArray Other immutable args to pass to the clones as immutable storage.
	 * @param _initDataArray The encoded data to pass to the `setUp` functions of the new HatsModule instances. Leave
	 * empty if no {setUp} is required.
	 * @param _saltNonces The nonces to use when calculating the salts
	 * @return success True if all modules were successfully created
	 */
	function batchCreateHatsModule(
		address[] calldata _implementations,
		uint256[] calldata _hatIds,
		bytes[] calldata _otherImmutableArgsArray,
		bytes[] calldata _initDataArray,
		uint256[] calldata _saltNonces
	) public returns (bool success) {
		uint256 length = _implementations.length;

		{
			bool sameLengths = (length == _hatIds.length &&
				length == _otherImmutableArgsArray.length &&
				length == _initDataArray.length);
			if (!sameLengths) revert BatchArrayLengthMismatch();
		}

		for (uint256 i = 0; i < length; ) {
			createHatsModule(
				_implementations[i],
				_hatIds[i],
				_otherImmutableArgsArray[i],
				_initDataArray[i],
				_saltNonces[i]
			);

			unchecked {
				++i;
			}
		}

		success = true;
	}

	/**
	 * @notice Predicts the address of a HatsModule instance for a given hat
	 * @param _hatId The hat for which to predict the HatsModule instance address
	 * @param _otherImmutableArgs Other immutable args to pass to the clone as immutable storage.
	 * @param _saltNonce The nonce to use when calculating the salt
	 * @return The predicted address of the deployed instance
	 */
	function getHatsModuleAddress(
		address _implementation,
		uint256 _hatId,
		bytes calldata _otherImmutableArgs,
		uint256 _saltNonce
	) public view returns (address) {
		// prepare the unique inputs
		bytes memory args = _encodeArgs(
			_implementation,
			_hatId,
			_otherImmutableArgs
		);
		bytes32 _salt = _calculateSalt(args, _saltNonce);
		// predict the address
		return _getHatsModuleAddress(_implementation, args, _salt);
	}

	/**
	 * @notice Checks if a HatsModule instance has already been deployed for a given hat
	 * @param _hatId The hat for which to check for an existing instance
	 * @param _otherImmutableArgs Other immutable args to pass to the clone as immutable storage.
	 * @param _saltNonce The nonce to use when calculating the salt
	 * @return True if an instance has already been deployed for the given hat
	 */
	function deployed(
		address _implementation,
		uint256 _hatId,
		bytes calldata _otherImmutableArgs,
		uint256 _saltNonce
	) public view returns (bool) {
		// check for contract code at the predicted address
		return
			getHatsModuleAddress(
				_implementation,
				_hatId,
				_otherImmutableArgs,
				_saltNonce
			).code.length > 0;
	}

	/*//////////////////////////////////////////////////////////////
                            INTERNAL FUNCTIONS
  //////////////////////////////////////////////////////////////*/

	/**
	 * @notice Predicts the address of a HatsModule contract given the encoded arguments and salt
	 * @param _args The encoded arguments to pass to the clone as immutable storage
	 * @param _salt The salt to use when deploying the clone
	 * @return The predicted address of the deployed HatsModule
	 */
	function _getHatsModuleAddress(
		address _implementation,
		bytes memory _args,
		bytes32 _salt
	) internal view returns (address) {
		return
			LibClone.predictDeterministicAddress(
				_implementation,
				_args,
				_salt,
				address(this)
			);
	}

	/**
	 * @notice Encodes the arguments to pass to the clone as immutable storage. The arguments are:
	 *  - The address of the implementation
	 *  - The address of the Hats Protocol
	 *  - The`_hatId`
	 *  - Any `_otherImmutableArgs`
	 * @return The encoded arguments
	 */
	function _encodeArgs(
		address _implementation,
		uint256 _hatId,
		bytes calldata _otherImmutableArgs
	) internal view returns (bytes memory) {
		return
			abi.encodePacked(
				_implementation,
				HATS,
				_hatId,
				_otherImmutableArgs
			);
	}

	/**
	 * @notice Calculates the salt to use when deploying the clone. The (packed) inputs are:
	 *  - The address of the this contract, `FACTORY` (passed as part of `_args`)
	 *  - The address of the Hats Protocol, `HATS` (passed as part of `_args`)
	 *  - The `_hatId` (passed as part of `_args`)
	 *  - Any `_otherImmutableArgs` (passed as part of `_args`)
	 *  - The chain ID of the current network, to avoid confusion across networks since the same hat trees
	 *    on different networks may have different wearers/admins
	 * @param _args The encoded arguments to pass to the clone as immutable storage
	 * @param _saltNonce The nonce to use when calculating the salt
	 * @return The salt to use when deploying the clone
	 */
	function _calculateSalt(
		bytes memory _args,
		uint256 _saltNonce
	) internal view returns (bytes32) {
		return keccak256(abi.encodePacked(_args, block.chainid, _saltNonce));
	}
}
