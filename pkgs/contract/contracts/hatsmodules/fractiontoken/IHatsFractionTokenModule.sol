// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title IHatsFractionTokenModule
 * @notice Interface for the HatsFractionTokenModule contract
 * @dev Defines custom errors and events for the fraction token module
 */
interface IHatsFractionTokenModule {
    // ============ Custom Errors ============

    /**
     * @notice Thrown when the provided hatId is not a top hat
     * @dev Only top hats can be used to initialize the module
     */
    error HatIdMustBeTopHat();

    /**
     * @notice Thrown when a token has already been minted for a specific wearer
     * @dev Initial supply can only be minted once per wearer per hat
     */
    error TokenAlreadyMinted();

    /**
     * @notice Thrown when array parameters have mismatched lengths
     * @dev All arrays in batch operations must have the same length
     */
    error ArrayLengthMismatch();

    /**
     * @notice Thrown when trying to mint additional tokens before initial minting
     * @dev Initial supply must be minted before any additional minting
     */
    error InitialSupplyNotMinted();

    /**
     * @notice Thrown when trying to transfer all tokens owned by sender
     * @dev At least one token must remain with the original owner to maintain hat association
     */
    error CannotTransferAllTokens();

    /**
     * @notice Thrown when the hatId doesn't belong to the module's domain
     * @dev Only hats from the same domain as the module can be used
     */
    error InvalidHatIdForDomain();

    /**
     * @notice Thrown when the caller is neither an admin nor a wearer of the specified hat
     * @dev Only hat admins or hat wearers can perform minting and burning operations
     */
    error CallerNotHatAdminOrWearer();

    /**
     * @notice Thrown when the wearer doesn't have the specified hat
     * @dev Only current hat wearers can have tokens minted for them
     */
    error WearerDoesNotHaveHat();

    /**
     * @notice Thrown when the token supply exceeds the maximum allowed limit
     * @dev The module has a predefined maximum token supply that cannot be exceeded
     */
    error TokenSupplyExceedsMax();

    // ============ Events ============

    /**
     * @notice Emitted when the default token supply is updated
     * @param oldSupply The previous token supply amount
     * @param newSupply The new token supply amount
     */
    event TokenSupplyUpdated(uint256 oldSupply, uint256 newSupply);

    /**
     * @notice Emitted when initial tokens are minted for a hat wearer
     * @param hatId The ID of the hat for which tokens were minted
     * @param wearer The address of the hat wearer who received tokens
     * @param tokenId The unique token ID generated for this hat-wearer combination
     * @param amount The amount of tokens minted
     */
    event InitialMint(
        uint256 indexed hatId,
        address indexed wearer,
        uint256 indexed tokenId,
        uint256 amount
    );

    /**
     * @notice Emitted when additional tokens are minted for an existing token holder
     * @param hatId The ID of the hat for which additional tokens were minted
     * @param wearer The address of the hat wearer who received additional tokens
     * @param tokenId The token ID for this hat-wearer combination
     * @param amount The amount of additional tokens minted
     */
    event AdditionalMint(
        uint256 indexed hatId,
        address indexed wearer,
        uint256 indexed tokenId,
        uint256 amount
    );

    /**
     * @notice Emitted when tokens are burned from a hat wearer's balance
     * @param hatId The ID of the hat for which tokens were burned
     * @param wearer The address of the hat wearer whose tokens were burned
     * @param tokenId The token ID for this hat-wearer combination
     * @param amount The amount of tokens burned
     */
    event TokensBurned(
        uint256 indexed hatId,
        address indexed wearer,
        uint256 indexed tokenId,
        uint256 amount
    );

    // ============ Minting Functions ============

    /**
     * @notice Mints the initial token supply for a hat wearer
     * @param _hatId The ID of the hat for which tokens are being minted
     * @param _wearer The address of the hat wearer receiving tokens
     * @param _amount The amount of tokens to mint (0 uses default TOKEN_SUPPLY)
     */
    function mintInitialSupply(
        uint256 _hatId,
        address _wearer,
        uint256 _amount
    ) external;

    /**
     * @notice Batch mints initial token supply for multiple hat wearers
     * @param _hatIds Array of hat IDs for which tokens are being minted
     * @param _wearers Array of hat wearer addresses receiving tokens
     * @param _amounts Array of token amounts to mint (0 uses default TOKEN_SUPPLY)
     */
    function batchMintInitialSupply(
        uint256[] memory _hatIds,
        address[] memory _wearers,
        uint256[] memory _amounts
    ) external;

    /**
     * @notice Mints additional tokens for an existing token holder
     * @param _hatId The ID of the hat for which additional tokens are being minted
     * @param _wearer The address of the hat wearer receiving additional tokens
     * @param _amount The amount of additional tokens to mint
     */
    function mint(uint256 _hatId, address _wearer, uint256 _amount) external;

    /**
     * @notice Burns tokens from a hat wearer's balance
     * @param _hatId The ID of the hat for which tokens are being burned
     * @param _wearer The address of the hat wearer whose tokens are being burned
     * @param _target The target address for the burn operation
     * @param _amount The amount of tokens to burn
     */
    function burn(
        uint256 _hatId,
        address _wearer,
        address _target,
        uint256 _amount
    ) external;

    // ============ View Functions ============

    /**
     * @notice Generates a unique token ID for a hat-wearer combination
     * @param _hatId The ID of the hat
     * @param _wearer The address of the hat wearer
     * @return The unique token ID for this hat-wearer combination
     */
    function getTokenId(
        uint256 _hatId,
        address _wearer
    ) external pure returns (uint256);

    /**
     * @notice Returns the domain ID for this module
     * @return The domain ID that this module operates within
     */
    function getDomain() external view returns (uint32);

    /**
     * @notice Returns an array of token recipients for a given token ID
     * @return An array of addresses that are recipients of the specified token
     */
    function getTokenRecipients(
        uint256 _tokenId
    ) external view returns (address[] memory);

    /**
     * @notice Returns the balance of tokens for a specific hat and wearer
     * @param _account The address of the account querying the balance
     * @param _wearer The address of the hat wearer
     * @param _hatId The ID of the hat for which the balance is being queried
     * @return The balance of tokens for this hat-wearer combination
     */
    function balanceOf(
        address _account,
        address _wearer,
        uint256 _hatId
    ) external view returns (uint256);

    /**
     * @notice Returns the balance of tokens for multiple hat-wearers
     * @param _accounts An array of account addresses querying their balances
     * @param _wearers An array of hat wearer addresses
     * @param _hatIds An array of hat IDs corresponding to each wearer
     * @return An array of balances corresponding to each hat-wearer combination
     */
    function balanceOfBatch(
        address[] memory _accounts,
        address[] memory _wearers,
        uint256[] memory _hatIds
    ) external view returns (uint256[] memory);

    /**
     * @notice Returns the total supply of tokens for a specific hat and wearer
     * @param _wearer The address of the hat wearer
     * @param _hatId The ID of the hat
     * @return The total supply of tokens for this hat-wearer combination
     */
    function totalSupply(
        address _wearer,
        uint256 _hatId
    ) external view returns (uint256);
}
