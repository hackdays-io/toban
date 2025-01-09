// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * If your Hats version has a specific interface file, import it:
 *   import { IHatsEligibility } from "../hats/src/Interfaces/IHatsEligibility.sol";
 *
 * Or if you don't have that handy, here's a minimal interface for reference:
 */
interface IHatsEligibility {
    /**
     * @notice Return whether `_wearer` is eligible and in good standing for `_hatId`.
     *         Some versions expect (bool,bool). Others accept (uint256,uint256).
     */
    function getWearerStatus(
        address _wearer,
        uint256 _hatId
    ) external view returns (uint256 eligible, uint256 standing);

    /**
     * @notice If your Hats version requires a setUp call after deployment, define it here.
     */
    function setUp(bytes calldata _initData) external;

    /**
     * @notice (Optional) Some Hats versions check a version string.
     */
    function version() external view returns (string memory);
}

/**
 * @title AlwaysTrueEligibility
 * @notice A trivial eligibility contract that always returns (1, 1),
 *         indicating "eligible" and "good standing" for every wearer, hatId.
 *         Implements minimal functions required by IHatsEligibility so
 *         the Hats Protocol won’t revert with `NotHatsEligibility()`.
 */
contract AlwaysTrueEligibility is IHatsEligibility {
    /**
     * @dev Return (1, 1) => "eligible" and "good standing."
     *      If your Hats version needs (bool, bool), change to `returns (true, true)`.
     */
    function getWearerStatus(
        address, /* _wearer */
        uint256  /* _hatId */
    )
        external
        pure
        override
        returns (uint256 eligible, uint256 standing)
    {
        return (1, 1);
    }

    /**
     * @dev Some Hats versions require a setup function. We'll keep it empty.
     */
    function setUp(bytes calldata /* _initData */) external override {
        // no-op
    }

    /**
     * @dev Optionally returns a version string if your Hats version checks it.
     */
    function version() external pure override returns (string memory) {
        return "v1.0.0";
    }
}