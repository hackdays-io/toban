// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {HatsModule} from "../../hats/module/HatsModule.sol";
import {ERC1155} from "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import {ERC1155Supply} from "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155Supply.sol";
import {IHatsFractionTokenModule} from "./IHatsFractionTokenModule.sol";

/**
 * @title HatsFractionTokenModule
 * @notice A module that creates fractionalized ERC1155 tokens for Hats Protocol
 * @dev This contract manages the ratio of roles through the amount of these tokens.
 *      The token amounts determine the proportional allocation of roles, and these ratios
 *      can also be used as coefficients for reward distribution calculations.
 *
 * Key features:
 * - Only works with top hats to ensure proper domain isolation
 * - Prevents complete token transfers to maintain hat association
 * - Supports batch operations for efficient multi-user management
 * - Integrates with Hats Protocol for permission validation
 */
contract HatsFractionTokenModule is
    HatsModule,
    ERC1155,
    ERC1155Supply,
    IHatsFractionTokenModule
{
    // ============ State Variables ============

    /// @notice The domain ID for this module, derived from the top hat
    uint32 private DOMAIN;

    /// @notice The default token supply amount for initial minting
    uint256 public DEFAULT_TOKEN_SUPPLY;

    /// @notice Maximum token supply per role user is 1 million
    uint256 public immutable MAX_SUPPLY_PER_ROLE_USER = 1_000_000;

    mapping(uint256 => address[]) private tokenRecipients;

    // ============ Constructor ============

    /**
     * @notice Initialize the contract with required parameters
     * @param _version The version of the contract for upgrade compatibility
     */
    constructor(string memory _version) HatsModule(_version) ERC1155("") {}

    // ============ Initialization ============

    /**
     * @notice Initializes the module with URI, and token supply configuration
     * @dev This function is called once during module deployment via the factory
     * @param _initData ABI-encoded data containing (string _uri, uint256 _defaultTokenSupply)
     *
     * Requirements:
     * - The hatId must be a top hat (ensures domain isolation)
     * - Only called once during initialization
     *
     * Effects:
     * - Sets the base URI for token metadata
     * - Sets the token supply for initial minting
     * - Extracts and stores the domain from the top hat
     */
    function _setUp(bytes calldata _initData) internal override {
        (string memory _uri, uint256 _defaultTokenSupply) = abi.decode(
            _initData,
            (string, uint256)
        );

        _setURI(_uri);

        DEFAULT_TOKEN_SUPPLY = _defaultTokenSupply;

        if (_defaultTokenSupply > MAX_SUPPLY_PER_ROLE_USER) {
            revert TokenSupplyExceedsMax();
        }

        // Ensure this module is only used with top hats for proper domain isolation
        if (!HATS().isTopHat(hatId())) {
            revert HatIdMustBeTopHat();
        }

        // Extract domain from the top hat for validation in future operations
        DOMAIN = HATS().getTopHatDomain(hatId());
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
     * - Caller must be an admin or wearer of the specified hat
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
        uint256 _initialAmount = _amount == 0 ? DEFAULT_TOKEN_SUPPLY : _amount;

        // Ensure this is the first time minting for this wearer-hat combination
        if (balanceOf(_wearer, _tokenId) > 0) {
            revert TokenAlreadyMinted();
        }

        _mint(_wearer, _tokenId, _initialAmount, "");

        tokenRecipients[_tokenId].push(_wearer);

        emit InitialMint(_hatId, _wearer, _tokenId, _initialAmount);
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
     * - Caller must be an admin or wearer of the specified hat
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

        emit AdditionalMint(_hatId, _wearer, _tokenId, _amount);
    }

    /**
     * @notice Burns tokens from a hat wearer's balance
     * @dev Reduces the token supply by burning tokens from the specified wearer
     * @param _hatId The ID of the hat for which tokens are being burned
     * @param _wearer The address of the hat wearer whose tokens are being burned
     * @param _target The target address for the burn operation
     * @param _amount The amount of tokens to burn
     *
     * Requirements:
     * - Hat must belong to this module's domain
     * - Caller must be an admin or wearer of the specified hat
     * - Wearer must currently hold the specified hat
     * - Wearer must have sufficient token balance to burn
     *
     * Effects:
     * - Decreases the token balance for the specified wearer
     * - Reduces total token supply
     */
    function burn(
        uint256 _hatId,
        address _wearer,
        address _target,
        uint256 _amount
    ) public {
        _checkValidAction(_hatId, _wearer);

        uint256 _tokenId = getTokenId(_hatId, _wearer);

        _burn(_target, _tokenId, _amount);

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

        if (!_containsRecipient(_id, _to)) {
            tokenRecipients[_id].push(_to);
        }
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
        super.safeBatchTransferFrom(_from, _to, _ids, _amounts, _data);

        for (uint256 i = 0; i < _ids.length; i++) {
            if (!_containsRecipient(_ids[i], _to)) {
                tokenRecipients[_ids[i]].push(_to);
            }
        }
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
     * @notice Returns the recipients associated with a specific token ID
     * @dev Used to retrieve all addresses that hold tokens for a given hat-wearer combination
     * @param tokenId The ID of the token to query
     * @return An array of addresses that are recipients of the specified token ID
     */
    function getTokenRecipients(
        uint256 tokenId
    ) public view returns (address[] memory) {
        return tokenRecipients[tokenId];
    }

    /**
     * @notice Returns the balance of tokens for a specific hat and wearer
     * @dev Returns the total token supply if the account has the hat role but is not a recipient
     * @param _account The address of the account to check balance for
     * @param _wearer The address of the hat wearer
     * @param _hatId The ID of the hat
     * @return The balance of tokens for this account, wearer, and hat combination
     *
     * If the account has the hat role but is not a recipient, returns TOKEN_SUPPLY.
     */
    function balanceOf(
        address _account,
        address _wearer,
        uint256 _hatId
    ) public view returns (uint256) {
        uint256 tokenId = getTokenId(_hatId, _wearer);

        if (
            HATS().isWearerOfHat(_account, _hatId) &&
            !_containsRecipient(tokenId, _account)
        ) {
            return DEFAULT_TOKEN_SUPPLY;
        }

        return super.balanceOf(_account, tokenId);
    }

    /**
     * @notice Returns the balances of multiple accounts for specific hats and wearers
     * @dev Efficiently retrieves balances for multiple combinations in a single call
     * @param _accounts Array of account addresses to check balances for
     * @param _wearers Array of wearer addresses corresponding to each account
     * @param _hatIds Array of hat IDs corresponding to each account and wearer
     * @return An array of balances for each account, wearer, and hat combination
     */
    function balanceOfBatch(
        address[] memory _accounts,
        address[] memory _wearers,
        uint256[] memory _hatIds
    ) public view returns (uint256[] memory) {
        uint256[] memory balances = new uint256[](_accounts.length);

        for (uint256 i = 0; i < _accounts.length; i++) {
            balances[i] = balanceOf(_accounts[i], _wearers[i], _hatIds[i]);
        }

        return balances;
    }

    /**
     * @notice Total supply of tokens for a specific hat and wearer
     * @dev Returns the total supply of tokens for a given hat-wearer combination
     * @param _hatId The ID of the hat
     * @param _wearer The address of the hat wearer
     * @return The total supply of tokens for this hat-wearer combination
     *
     * If no tokens have been minted for this combination, returns the default TOKEN_SUPPLY
     */
    function totalSupply(
        address _wearer,
        uint256 _hatId
    ) public view returns (uint256) {
        uint256 tokenId = getTokenId(_hatId, _wearer);

        if (tokenRecipients[tokenId].length == 0) {
            return DEFAULT_TOKEN_SUPPLY;
        }

        return super.totalSupply(tokenId);
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
     * - Caller must be an admin or wearer of the specified hat
     * - Wearer must currently hold the specified hat
     *
     * Reverts:
     * - InvalidHatIdForDomain: if hat doesn't belong to module's domain
     * - CallerNotHatAdminOrWearer: if caller is neither admin nor wearer of the hat
     * - WearerDoesNotHaveHat: if wearer doesn't currently hold the hat
     */
    function _checkValidAction(uint256 _hatId, address _wearer) internal view {
        // Ensure the hat belongs to this module's domain
        if (HATS().getTopHatDomain(_hatId) != DOMAIN) {
            revert InvalidHatIdForDomain();
        }

        // Ensure the caller has admin permissions or is a wearer of this hat
        if (
            !HATS().isAdminOfHat(msg.sender, _hatId) &&
            !HATS().isWearerOfHat(msg.sender, _hatId)
        ) {
            revert CallerNotHatAdminOrWearer();
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

    /**
     * @notice Checks if a recipient is already associated with a token
     * @dev Used to prevent duplicate recipients for a given token ID
     * @param _tokenId The ID of the token to check
     * @param _recipient The address of the recipient to check
     * @return True if the recipient is already associated with the token, false otherwise
     */
    function _containsRecipient(
        uint256 _tokenId,
        address _recipient
    ) private view returns (bool) {
        address[] memory recipients = tokenRecipients[_tokenId];
        for (uint256 i = 0; i < recipients.length; i++) {
            if (recipients[i] == _recipient) {
                return true;
            }
        }
        return false;
    }

    function _update(
        address from,
        address to,
        uint256[] memory ids,
        uint256[] memory values
    ) internal override(ERC1155Supply, ERC1155) {
        super._update(from, to, ids, values);
    }
}
