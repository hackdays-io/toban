// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

// import { console2 } from "forge-std/Test.sol"; // remove before deploy
import {IHats} from "../hats/src/Interfaces/IHats.sol";
import {IHatsModule} from "./interfaces/IHatsModule.sol";
import {Clone} from "solady/src/utils/Clone.sol";
import {Initializable} from "@openzeppelin/contracts/proxy/utils/Initializable.sol";

contract HatsModule is IHatsModule, Clone, Initializable {
    /*//////////////////////////////////////////////////////////////
                          PUBLIC CONSTANTS
  //////////////////////////////////////////////////////////////*/

    /**
     * This contract is a clone with immutable args, which means that it is deployed with a set of
     * immutable storage variables (ie constants). Accessing these constants is cheaper than accessing
     * regular storage variables (such as those set on initialization of a typical EIP-1167 clone),
     * but requires a slightly different approach since they are read from calldata instead of storage.
     *
     * Below is a table of constants and their location.
     *
     * For more, see here: https://github.com/Saw-mon-and-Natalie/clones-with-immutable-args
     *
     * --------------------------------------------------------------------+
     * CLONE IMMUTABLE "STORAGE"                                           |
     * --------------------------------------------------------------------|
     * Offset  | Constant        | Type    | Length  |                     |
     * --------------------------------------------------------------------|
     * 0       | IMPLEMENTATION  | address | 20      |                     |
     * 20      | HATS            | address | 20      |                     |
     * 40      | hatId           | uint256 | 32      |                     |
     * 72+     | [other args]    | [type]  | [len]   |                     |
     * --------------------------------------------------------------------+
     */

    /// @inheritdoc IHatsModule
    function IMPLEMENTATION() public pure returns (address) {
        return _getArgAddress(0);
    }

    /// @inheritdoc IHatsModule
    function HATS() public pure returns (IHats) {
        return IHats(_getArgAddress(20));
    }

    /// @inheritdoc IHatsModule
    function hatId() public pure returns (uint256) {
        return _getArgUint256(40);
    }

    /// @inheritdoc IHatsModule
    string public version_;

    /// @inheritdoc IHatsModule
    function version() public view returns (string memory) {
        return HatsModule(IMPLEMENTATION()).version_();
    }

    /*//////////////////////////////////////////////////////////////
                            INITIALIZER
  //////////////////////////////////////////////////////////////*/

    /// @inheritdoc IHatsModule
    function setUp(bytes calldata _initData) public initializer {
        _setUp(_initData);
    }

    /// @dev Override this function to set initial operational values for module instances
    function _setUp(bytes calldata _initData) internal virtual {}

    /*//////////////////////////////////////////////////////////////
                            CONSTRUCTOR
  //////////////////////////////////////////////////////////////*/

    /// @notice Deploy the implementation contract and set its version
    /// @dev This is only used to deploy the implementation contract, and should not be used to deploy clones
    constructor(string memory _version) {
        version_ = _version;
        // prevent the implementation contract from being initialized
        _disableInitializers();
    }
}
