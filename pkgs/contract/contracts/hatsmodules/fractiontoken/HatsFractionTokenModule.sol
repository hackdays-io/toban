// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {HatsModule} from "../../hats/module/HatsModule.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ERC1155} from "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import {IHatsFractionTokenModule} from "./IHatsFractionTokenModule.sol";

/**
 * @title HatsFractionTokenModule
 * @notice A module that creates fractionalized ERC1155 tokens for Hats Protocol
 * @dev This contract allows minting fractional tokens representing ownership or participation
 *      in a specific hat. Each hat wearer can receive a configurable amount of tokens,
 *      enabling fractional governance, rewards distribution, or other use cases.
 *
 * Key features:
 * - Only works with top hats to ensure proper domain isolation
 * - Prevents complete token transfers to maintain hat association
 * - Supports batch operations for efficient multi-user management
 * - Integrates with Hats Protocol for permission validation
 */
contract HatsFractionTokenModule is
    HatsModule,
    Ownable,
    ERC1155,
    IHatsFractionTokenModule
{
    // ============ State Variables ============

    /// @notice The domain ID for this module, derived from the top hat
    uint32 private DOMAIN;

    /// @notice The default token supply amount for initial minting
    uint256 private TOKEN_SUPPLY;

    // ============ Constructor ============

    /**
     * @notice Initialize the contract with required parameters
     * @param _version The version of the contract for upgrade compatibility
     * @param _tmpOwner The temporary owner of the contract (will be transferred during setup)
     * @param _uri The base URI for token metadata
     */
    constructor(
        string memory _version,
        address _tmpOwner,
        string memory _uri
    ) HatsModule(_version) Ownable(_tmpOwner) ERC1155(_uri) {}

    // ============ Initialization ============

    /**
     * @notice Initializes the module with owner and token supply configuration
     * @dev This function is called once during module deployment via the factory
     * @param _initData ABI-encoded data containing (address _owner, uint256 _tokenSupply)
     *
     * Requirements:
     * - The hatId must be a top hat (ensures domain isolation)
     * - Only called once during initialization
     *
     * Effects:
     * - Sets the token supply for initial minting
     * - Extracts and stores the domain from the top hat
     * - Transfers ownership to the specified address
     */
    function _setUp(bytes calldata _initData) internal override {
        (address _owner, uint256 _tokenSupply) = abi.decode(
            _initData,
            (address, uint256)
        );

        TOKEN_SUPPLY = _tokenSupply;

        // Ensure this module is only used with top hats for proper domain isolation
        if (!HATS().isTopHat(hatId())) {
            revert HatIdMustBeTopHat();
        }

        // Extract domain from the top hat for validation in future operations
        DOMAIN = HATS().getTopHatDomain(hatId());

        // Transfer ownership to the specified address
        _transferOwnership(_owner);
    }

    // ============ Minting Functions ============

    /**
     * @notice Mints the initial token supply for a hat wearer
     * @dev This function can only be called once per wearer per hat
     * @param _hatId The ID of the hat for which tokens are being minted
     * @param _wearer The address of the hat wearer receiving tokens
     * @param _amount The amount of tokens to mint (0 uses default TOKEN_SUPPLY)
     *
     * Requirements:
     * - Hat must belong to this module's domain
     * - Caller must be an admin of the specified hat
     * - Wearer must currently hold the specified hat
     * - No tokens have been previously minted for this wearer-hat combination
     *
     * Effects:
     * - Mints tokens to the wearer's address
     * - Creates a unique token ID based on hatId and wearer address
     */
    function mintInitialSupply(
        uint256 _hatId,
        address _wearer,
        uint256 _amount
    ) public {
        _checkValidAction(_hatId, _wearer);

        uint256 _tokenId = getTokenId(_hatId, _wearer);
        uint256 _initialAmount = _amount == 0 ? TOKEN_SUPPLY : _amount;

        // Ensure this is the first time minting for this wearer-hat combination
        if (balanceOf(_wearer, _tokenId) > 0) {
            revert TokenAlreadyMinted();
        }

        _mint(_wearer, _tokenId, _initialAmount, "");

        emit InitialTokensMinted(_hatId, _wearer, _tokenId, _initialAmount);
    }

    /**
     * @notice Batch mints initial token supply for multiple hat wearers
     * @dev Efficiently processes multiple initial minting operations in a single transaction
     * @param _hatIds Array of hat IDs for which tokens are being minted
     * @param _wearers Array of hat wearer addresses receiving tokens
     * @param _amounts Array of token amounts to mint (0 uses default TOKEN_SUPPLY)
     *
     * Requirements:
     * - All arrays must have the same length
     * - Each hat-wearer combination must meet individual minting requirements
     *
     * Effects:
     * - Calls mintInitialSupply for each provided combination
     * - Reverts entirely if any individual operation fails
     */
    function batchMintInitialSupply(
        uint256[] memory _hatIds,
        address[] memory _wearers,
        uint256[] memory _amounts
    ) public {
        // Ensure all input arrays have matching lengths
        if (
            _hatIds.length != _wearers.length ||
            _hatIds.length != _amounts.length
        ) {
            revert ArrayLengthMismatch();
        }

        // Validate all operations before executing any mints
        _checkValidBatchAction(_hatIds, _wearers);

        // Execute all minting operations
        for (uint256 i = 0; i < _hatIds.length; i++) {
            mintInitialSupply(_hatIds[i], _wearers[i], _amounts[i]);
        }
    }

    /**
     * @notice Mints additional tokens for an existing token holder
     * @dev Can only be called after initial supply has been minted for the wearer
     * @param _hatId The ID of the hat for which additional tokens are being minted
     * @param _wearer The address of the hat wearer receiving additional tokens
     * @param _amount The amount of additional tokens to mint
     *
     * Requirements:
     * - Hat must belong to this module's domain
     * - Caller must be an admin of the specified hat
     * - Wearer must currently hold the specified hat
     * - Initial supply must have been previously minted for this wearer-hat combination
     *
     * Effects:
     * - Increases the token balance for the specified wearer
     */
    function mint(uint256 _hatId, address _wearer, uint256 _amount) public {
        _checkValidAction(_hatId, _wearer);

        uint256 _tokenId = getTokenId(_hatId, _wearer);

        // Ensure initial supply has been minted before allowing additional minting
        if (balanceOf(_wearer, _tokenId) == 0) {
            revert InitialSupplyNotMinted();
        }

        _mint(_wearer, _tokenId, _amount, "");

        emit AdditionalTokensMinted(_hatId, _wearer, _tokenId, _amount);
    }

    /**
     * @notice Burns tokens from a hat wearer's balance
     * @dev Reduces the token supply by burning tokens from the specified wearer
     * @param _hatId The ID of the hat for which tokens are being burned
     * @param _wearer The address of the hat wearer whose tokens are being burned
     * @param _amount The amount of tokens to burn
     *
     * Requirements:
     * - Hat must belong to this module's domain
     * - Caller must be an admin of the specified hat
     * - Wearer must currently hold the specified hat
     * - Wearer must have sufficient token balance to burn
     *
     * Effects:
     * - Decreases the token balance for the specified wearer
     * - Reduces total token supply
     */
    function burn(uint256 _hatId, address _wearer, uint256 _amount) public {
        _checkValidAction(_hatId, _wearer);

        uint256 _tokenId = getTokenId(_hatId, _wearer);

        _burn(_wearer, _tokenId, _amount);

        emit TokensBurned(_hatId, _wearer, _tokenId, _amount);
    }

    // ============ Transfer Functions ============

    /**
     * @notice Safely transfers tokens between addresses with restrictions
     * @dev Overrides ERC1155 transfer to prevent complete token transfers
     * @param _from The address to transfer tokens from
     * @param _to The address to transfer tokens to
     * @param _id The token ID to transfer
     * @param _amount The amount of tokens to transfer
     * @param _data Additional data to pass to the receiver
     *
     * Requirements:
     * - Standard ERC1155 transfer requirements
     * - Cannot transfer all tokens owned by the sender (must retain at least 1)
     *
     * Effects:
     * - Transfers the specified amount of tokens
     * - Maintains hat association by preventing complete token transfers
     */
    function safeTransferFrom(
        address _from,
        address _to,
        uint256 _id,
        uint256 _amount,
        bytes memory _data
    ) public override {
        // Prevent complete token transfers to maintain hat association
        if (balanceOf(_from, _id) == _amount) {
            revert CannotTransferAllTokens();
        }

        super.safeTransferFrom(_from, _to, _id, _amount, _data);
    }

    /**
     * @notice Safely batch transfers tokens between addresses with restrictions
     * @dev Overrides ERC1155 batch transfer to prevent complete token transfers
     * @param _from The address to transfer tokens from
     * @param _to The address to transfer tokens to
     * @param _ids Array of token IDs to transfer
     * @param _amounts Array of token amounts to transfer
     * @param _data Additional data to pass to the receiver
     *
     * Requirements:
     * - Standard ERC1155 batch transfer requirements
     * - Cannot transfer all tokens for any token ID (must retain at least 1 of each)
     *
     * Effects:
     * - Transfers the specified amounts of tokens for each ID
     * - Maintains hat association by preventing complete token transfers
     */
    function safeBatchTransferFrom(
        address _from,
        address _to,
        uint256[] memory _ids,
        uint256[] memory _amounts,
        bytes memory _data
    ) public override {
        // Check each token ID to prevent complete transfers
        for (uint256 i = 0; i < _ids.length; i++) {
            if (balanceOf(_from, _ids[i]) == _amounts[i]) {
                revert CannotTransferAllTokens();
            }
        }

        super.safeBatchTransferFrom(_from, _to, _ids, _amounts, _data);
    }

    // ============ Administrative Functions ============

    /**
     * @notice Updates the default token supply for future initial minting
     * @dev Only the contract owner can modify the token supply
     * @param _newSupply The new default token supply amount
     *
     * Requirements:
     * - Caller must be the contract owner
     *
     * Effects:
     * - Updates TOKEN_SUPPLY for future mintInitialSupply calls with amount = 0
     * - Does not affect existing token balances
     */
    function setTokenSupply(uint256 _newSupply) public onlyOwner {
        uint256 _oldSupply = TOKEN_SUPPLY;
        TOKEN_SUPPLY = _newSupply;

        emit TokenSupplyUpdated(_oldSupply, _newSupply);
    }

    // ============ View Functions ============

    /**
     * @notice Generates a unique token ID for a hat-wearer combination
     * @dev Uses keccak256 hash of hatId and wearer address for uniqueness
     * @param _hatId The ID of the hat
     * @param _wearer The address of the hat wearer
     * @return The unique token ID for this hat-wearer combination
     */
    function getTokenId(
        uint256 _hatId,
        address _wearer
    ) public pure returns (uint256) {
        return uint256(keccak256(abi.encodePacked(_hatId, _wearer)));
    }

    /**
     * @notice Returns the domain ID for this module
     * @dev The domain is derived from the top hat during initialization
     * @return The domain ID that this module operates within
     */
    function getDomain() public view returns (uint32) {
        return DOMAIN;
    }

    /**
     * @notice Returns the current default token supply
     * @dev This is the amount used when mintInitialSupply is called with amount = 0
     * @return The current default token supply amount
     */
    function getTokenSupply() public view returns (uint256) {
        return TOKEN_SUPPLY;
    }

    // ============ Internal Validation Functions ============

    /**
     * @notice Validates that an action can be performed for a specific hat and wearer
     * @dev Performs comprehensive validation of domain, permissions, and hat ownership
     * @param _hatId The ID of the hat being validated
     * @param _wearer The address of the proposed hat wearer
     *
     * Requirements:
     * - Hat must belong to this module's domain
     * - Caller must be an admin of the specified hat
     * - Wearer must currently hold the specified hat
     *
     * Reverts:
     * - InvalidHatIdForDomain: if hat doesn't belong to module's domain
     * - CallerNotHatAdmin: if caller lacks admin permissions for the hat
     * - WearerDoesNotHaveHat: if wearer doesn't currently hold the hat
     */
    function _checkValidAction(uint256 _hatId, address _wearer) internal view {
        // Ensure the hat belongs to this module's domain
        if (HATS().getTopHatDomain(_hatId) != DOMAIN) {
            revert InvalidHatIdForDomain();
        }

        // Ensure the caller has admin permissions for this hat
        if (!HATS().isAdminOfHat(msg.sender, _hatId)) {
            revert CallerNotHatAdmin();
        }

        // Ensure the wearer currently holds the specified hat
        if (!HATS().isWearerOfHat(_wearer, _hatId)) {
            revert WearerDoesNotHaveHat();
        }
    }

    /**
     * @notice Validates multiple hat-wearer combinations for batch operations
     * @dev Efficiently validates all combinations before executing batch operations
     * @param _hatIds Array of hat IDs to validate
     * @param _wearers Array of wearer addresses to validate
     *
     * Requirements:
     * - Each hat-wearer combination must pass individual validation
     *
     * Effects:
     * - Calls _checkValidAction for each combination
     * - Reverts on first validation failure
     */
    function _checkValidBatchAction(
        uint256[] memory _hatIds,
        address[] memory _wearers
    ) internal view {
        for (uint256 i = 0; i < _hatIds.length; i++) {
            _checkValidAction(_hatIds[i], _wearers[i]);
        }
    }
}
