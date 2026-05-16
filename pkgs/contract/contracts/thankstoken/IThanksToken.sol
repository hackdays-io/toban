// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title IThanksToken
 * @dev Interface for the ThanksToken contract
 */
interface IThanksToken is IERC20 {
    struct RelatedRole {
        uint256 hatId;
        address wearer;
    }

    /**
     * @notice Mints new tokens to a recipient
     * @param to The address to mint tokens to
     * @param amount The amount of tokens to mint
     * @param relatedRoles Array of roles related to the sender
     * @param data Additional data with no specified format
     * @return success Whether the operation was successful
     */
    function mint(
        address to,
        uint256 amount,
        RelatedRole[] memory relatedRoles,
        bytes memory data
    ) external returns (bool);

    /**
     * @notice Mints new tokens to multiple recipients
     * @param to Array of addresses to mint tokens to
     * @param amounts Array of amounts of tokens to mint
     * @param relatedRoles Array of roles related to the sender
     * @param data Additional data with no specified format
     * @return success Whether the operation was successful
     */
    function batchMint(
        address[] memory to,
        uint256[] memory amounts,
        RelatedRole[] memory relatedRoles,
        bytes memory data
    ) external returns (bool);

    /**
     * @notice Calculates the total amount that can be minted by an address
     * @param owner The address to check mintable amount for
     * @param relatedRoles Array of roles related to the owner
     * @return amount The mintable amount
     */
    function mintableAmount(
        address owner,
        RelatedRole[] memory relatedRoles
    ) external view returns (uint256);

    /**
     * @notice Returns the total amount an address has minted
     * @param owner The address to check minted amount for
     * @return amount The minted amount
     */
    function mintedAmount(address owner) external view returns (uint256);

    /**
     * @notice Returns the coefficient for an address
     * @param owner The address to get coefficient for
     * @return coefficient The address coefficient
     */
    function addressCoefficient(address owner) external view returns (uint256);

    /**
     * @notice Returns the default coefficient
     * @return coefficient The default coefficient
     */
    function defaultCoefficient() external view returns (uint256);

    /**
     * @notice Returns the list of all participants (minters and recipients)
     * @return The array of participant addresses
     */
    function getParticipants() external view returns (address[] memory);

    // -----------------------------------------------------------------------
    // Mint allowance (ERC-20-symmetric primitives for delegated mint)
    // -----------------------------------------------------------------------

    /**
     * @notice Approves `spender` to mint up to `value` ThanksTokens on behalf of `msg.sender`.
     * @dev ERC-20 `approve`-symmetric primitive for mint. Mirrors the allowance semantics so that
     *      `approveMint(spender, 0)` revokes a previous approval.
     * @param spender The address allowed to call `mintFrom` on behalf of the caller.
     * @param value The maximum cumulative amount `spender` may mint.
     * @return success Whether the operation was successful.
     */
    function approveMint(
        address spender,
        uint256 value
    ) external returns (bool);

    /**
     * @notice Sets mint allowance via EIP-712 signature (gasless approval).
     * @dev EIP-712 `permit`-symmetric primitive for mint. The struct hash is:
     *      PermitMint(address owner,address spender,uint256 value,uint256 nonce,uint256 deadline)
     * @param owner The address whose mint allowance is being set.
     * @param spender The address being approved.
     * @param value The mint allowance value to set.
     * @param deadline The signature expiration timestamp.
     * @param v signature `v` component.
     * @param r signature `r` component.
     * @param s signature `s` component.
     */
    function permitMint(
        address owner,
        address spender,
        uint256 value,
        uint256 deadline,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) external;

    /**
     * @notice Mints ThanksTokens on behalf of `from`, consuming `from`'s mint allowance to `msg.sender`.
     * @dev ERC-20 `transferFrom`-symmetric primitive for mint. Allowance is decremented before mint,
     *      and the existing `mintableAmount(from, relatedRoles)` formula check is preserved as a
     *      second defensive boundary (bot key leakage cannot exceed the role-derived cap).
     * @param from The owner of the mint allowance and the address whose `mintedAmount` is incremented.
     * @param to The recipient of the minted tokens.
     * @param value The amount of tokens to mint.
     * @param relatedRoles Roles related to `from` used to compute mintableAmount.
     * @param data Additional data with no specified format (mirrors `mint`).
     * @return success Whether the operation was successful.
     */
    function mintFrom(
        address from,
        address to,
        uint256 value,
        RelatedRole[] memory relatedRoles,
        bytes memory data
    ) external returns (bool);

    /**
     * @notice Returns the remaining mint allowance for `(owner, spender)`.
     * @param owner The mint allowance owner.
     * @param spender The approved spender.
     * @return The remaining mint allowance.
     */
    function mintAllowance(
        address owner,
        address spender
    ) external view returns (uint256);

    /**
     * @notice Returns the current PermitMint nonce for `owner`.
     * @param owner The address to query.
     * @return The current nonce (incremented on each successful permitMint).
     */
    function mintNonces(address owner) external view returns (uint256);

    /**
     * @notice Returns the EIP-712 domain separator for this token instance.
     * @return The domain separator (rebuilt for each clone so it is clone-safe).
     */
    function DOMAIN_SEPARATOR() external view returns (bytes32);

    /**
     * @notice Emitted when tokens are minted
     * @param to The recipient of the minted tokens
     * @param amount The amount of tokens minted
     */
    event TokenMinted(
        address indexed from,
        address indexed to,
        uint256 amount,
        bytes data
    );

    /**
     * @notice Emitted when a mint allowance is set or updated.
     * @param owner The owner of the mint allowance.
     * @param spender The address approved to mint on behalf of owner.
     * @param value The new mint allowance.
     */
    event ApproveMint(
        address indexed owner,
        address indexed spender,
        uint256 value
    );

    /**
     * @notice Emitted when `spender` mints on behalf of `from`.
     * @param from The owner of the mint allowance.
     * @param to The recipient of the minted tokens.
     * @param spender The caller (delegated minter).
     * @param value The minted amount.
     */
    event MintFrom(
        address indexed from,
        address indexed to,
        address indexed spender,
        uint256 value
    );
}
