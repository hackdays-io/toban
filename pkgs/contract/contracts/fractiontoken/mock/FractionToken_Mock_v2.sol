// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./../FractionToken.sol";

contract FractionToken_Mock_v2 is FractionToken {

	function initialize2(
		string memory _uri,
		uint256 _tokenSupply,
		address _hatsAddress,
		address _trustedForwarderAddress
	) initializer public {
		__ERC1155_init(_uri);
		__ERC2771Context_init(address(_trustedForwarderAddress));
		hatsContract = IHats(_hatsAddress);
		TOKEN_SUPPLY = _tokenSupply;
	}

	/**
   * 検証用に追加した関数
   */
  function testUpgradeFunction() external pure returns (string memory) {
    return "testUpgradeFunction";
  }
}
