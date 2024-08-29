// SPDX-License-Identifier: MIT

pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";

interface IFractionToken is IERC1155 {
    function mint(string memory hatId, address account) external;

    function getTokenRecipients(
        uint256 tokenId
    ) external view returns (address[] memory);

    function getAllTokenIds() external view returns (uint256[] memory);

    function getTokenId(
        uint256 hatId,
        address account
    ) external view returns (uint256);

    function balanceOf(
        address account,
        address warer,
        uint256 hatId
    ) external view returns (uint256);

    function balanceOfBatch(
        address[] memory accounts,
        address[] memory warers,
        uint256[] memory hatIds
    ) external view returns (uint256[] memory);
}
