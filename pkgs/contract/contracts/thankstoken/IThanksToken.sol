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
     * @return success Whether the operation was successful
     */
    function mint(
        address to,
        uint256 amount,
        RelatedRole[] memory relatedRoles
    ) external returns (bool);

    /**
     * @notice Mints new tokens to multiple recipients
     * @param to Array of addresses to mint tokens to
     * @param amounts Array of amounts of tokens to mint
     * @param relatedRoles Array of roles related to the sender
     * @return success Whether the operation was successful
     */
    function batchMint(
        address[] memory to,
        uint256[] memory amounts,
        RelatedRole[] memory relatedRoles
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

    /**
     * @notice Emitted when tokens are minted
     * @param to The recipient of the minted tokens
     * @param amount The amount of tokens minted
     */
    event TokenMinted(address indexed from, address indexed to, uint256 amount);
}
