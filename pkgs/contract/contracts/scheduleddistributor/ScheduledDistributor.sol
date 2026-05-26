// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {IHats} from "../hats/src/Interfaces/IHats.sol";
import {ISplitsCreator} from "../splitscreator/ISplitsCreator.sol";
import {SplitV2Lib} from "../splits/libraries/SplitV2.sol";
import {IScheduledDistributor} from "./IScheduledDistributor.sol";

interface IPullSplitDistribute {
	function distribute(
		SplitV2Lib.Split calldata _split,
		address _token,
		address _distributor
	) external;
}

/**
 * @title ScheduledDistributor
 * @notice Immutable, one-shot reward distribution scheduled for a future date.
 *         Deployed as a solady clone via ScheduledDistributorFactory; one
 *         clone = one reservation. After initialize, the rule cannot change.
 *         A single rule may schedule the distribution of multiple ERC20 tokens
 *         (e.g. USDC + JPYC). One Split is created at execute() time and used
 *         to distribute every configured token.
 *         At/after the scheduled date anyone can call execute() with the
 *         current wearer set; the confirmed wearer list is the guaranteed
 *         floor (no honest keeper may drop a current wearer who was confirmed
 *         at rule creation time). If execute does not run within 72h of the
 *         scheduled date the scheduler or backup wallet may reclaim the funds.
 */
contract ScheduledDistributor is IScheduledDistributor {
	using SafeERC20 for IERC20;

	uint256 public constant RECLAIM_DELAY = 72 hours;

	bool public initialized;
	bool public executed;
	bool public reclaimed;

	address public hats;
	address public splitsCreator;
	address public scheduler;
	address public depositor;
	address public backupWallet;
	uint256 public scheduledDate;

	ISplitsCreator.WeightsInfo public weights;

	address[] private _tokens;
	mapping(address => bool) private _isToken;

	uint256[] private _hatIds;
	uint256[] private _multiplierTops;
	uint256[] private _multiplierBottoms;
	address[][] private _confirmedWearers;

	address public split;

	function initialize(InitParams calldata params) external override {
		require(!initialized, "ScheduledDistributor: already initialized");
		require(params.hats != address(0), "ScheduledDistributor: hats required");
		require(
			params.splitsCreator != address(0),
			"ScheduledDistributor: splitsCreator required"
		);
		require(
			params.scheduler != address(0),
			"ScheduledDistributor: scheduler required"
		);
		require(
			params.backupWallet != address(0),
			"ScheduledDistributor: backupWallet required"
		);
		require(
			params.scheduledDate > block.timestamp,
			"ScheduledDistributor: scheduledDate must be future"
		);

		uint256 tokensLen = params.tokens.length;
		require(tokensLen > 0, "ScheduledDistributor: empty tokens");
		for (uint256 i = 0; i < tokensLen; i++) {
			address t = params.tokens[i];
			require(t != address(0), "ScheduledDistributor: token required");
			require(!_isToken[t], "ScheduledDistributor: duplicate token");
			_isToken[t] = true;
			_tokens.push(t);
		}

		uint256 hatsLen = params.hatIds.length;
		require(hatsLen > 0, "ScheduledDistributor: empty hatIds");
		require(
			hatsLen == params.multiplierTops.length &&
				hatsLen == params.multiplierBottoms.length &&
				hatsLen == params.confirmedWearers.length,
			"ScheduledDistributor: length mismatch"
		);

		uint256 totalConfirmed;
		for (uint256 i = 0; i < hatsLen; i++) {
			require(
				params.multiplierBottoms[i] > 0,
				"ScheduledDistributor: multiplierBottom must be > 0"
			);
			totalConfirmed += params.confirmedWearers[i].length;
		}
		require(
			totalConfirmed >= 2,
			"ScheduledDistributor: need >= 2 confirmed wearers"
		);

		initialized = true;
		hats = params.hats;
		splitsCreator = params.splitsCreator;
		scheduler = params.scheduler;
		depositor = params.depositor;
		backupWallet = params.backupWallet;
		scheduledDate = params.scheduledDate;
		weights = params.weights;

		for (uint256 i = 0; i < hatsLen; i++) {
			_hatIds.push(params.hatIds[i]);
			_multiplierTops.push(params.multiplierTops[i]);
			_multiplierBottoms.push(params.multiplierBottoms[i]);
			_confirmedWearers.push(params.confirmedWearers[i]);
		}

		emit RuleCreated(
			params.scheduler,
			params.splitsCreator,
			params.tokens,
			params.depositor,
			params.backupWallet,
			params.scheduledDate
		);
	}

	function deposit(address token, uint256 amount) external override {
		require(initialized, "ScheduledDistributor: not initialized");
		require(!executed, "ScheduledDistributor: already executed");
		require(!reclaimed, "ScheduledDistributor: reclaimed");
		require(amount > 0, "ScheduledDistributor: amount must be > 0");
		require(_isToken[token], "ScheduledDistributor: token not allowed");
		IERC20(token).safeTransferFrom(msg.sender, address(this), amount);
		emit Deposited(msg.sender, token, amount);
	}

	function execute(address[][] calldata wearersByHat) external override {
		require(initialized, "ScheduledDistributor: not initialized");
		require(!executed, "ScheduledDistributor: already executed");
		require(!reclaimed, "ScheduledDistributor: reclaimed");
		require(
			block.timestamp >= scheduledDate,
			"ScheduledDistributor: before scheduled date"
		);
		require(
			wearersByHat.length == _hatIds.length,
			"ScheduledDistributor: wearers length mismatch"
		);

		_validateWearers(wearersByHat);

		ISplitsCreator.SplitsInfo[] memory splitsInfo = _buildSplitsInfo(
			wearersByHat
		);

		(
			address[] memory recipients,
			uint256[] memory allocations,
			uint256 totalAllocation
		) = ISplitsCreator(splitsCreator).preview(splitsInfo, weights);

		bytes32 salt = keccak256(abi.encode(address(this), scheduledDate));
		address splitAddr = ISplitsCreator(splitsCreator).createWithSalt(
			splitsInfo,
			weights,
			salt
		);

		executed = true;
		split = splitAddr;

		SplitV2Lib.Split memory splitParams = SplitV2Lib.Split({
			recipients: recipients,
			allocations: allocations,
			totalAllocation: totalAllocation,
			distributionIncentive: 0
		});

		uint256 tokensLen = _tokens.length;
		for (uint256 i = 0; i < tokensLen; i++) {
			address t = _tokens[i];
			uint256 balance = IERC20(t).balanceOf(address(this));
			if (balance == 0) {
				// Still emit Executed so off-chain consumers can show the
				// per-token outcome (zero distributed) without ambiguity.
				emit Executed(msg.sender, splitAddr, t, 0);
				continue;
			}
			IERC20(t).safeTransfer(splitAddr, balance);
			IPullSplitDistribute(splitAddr).distribute(splitParams, t, msg.sender);
			emit Executed(msg.sender, splitAddr, t, balance);
		}
	}

	function reclaim() external override {
		require(initialized, "ScheduledDistributor: not initialized");
		require(!executed, "ScheduledDistributor: already executed");
		require(!reclaimed, "ScheduledDistributor: already reclaimed");
		require(
			block.timestamp >= scheduledDate + RECLAIM_DELAY,
			"ScheduledDistributor: reclaim not open"
		);
		require(
			msg.sender == scheduler || msg.sender == backupWallet,
			"ScheduledDistributor: unauthorized"
		);

		reclaimed = true;
		uint256 tokensLen = _tokens.length;
		for (uint256 i = 0; i < tokensLen; i++) {
			address t = _tokens[i];
			uint256 balance = IERC20(t).balanceOf(address(this));
			if (balance > 0) {
				IERC20(t).safeTransfer(msg.sender, balance);
			}
			emit Reclaimed(msg.sender, t, balance);
		}
	}

	// -------------------- view helpers --------------------

	function getTokens() external view returns (address[] memory) {
		return _tokens;
	}

	function isToken(address t) external view returns (bool) {
		return _isToken[t];
	}

	function getHatIds() external view returns (uint256[] memory) {
		return _hatIds;
	}

	function getMultiplierTops() external view returns (uint256[] memory) {
		return _multiplierTops;
	}

	function getMultiplierBottoms() external view returns (uint256[] memory) {
		return _multiplierBottoms;
	}

	function getConfirmedWearers(
		uint256 index
	) external view returns (address[] memory) {
		return _confirmedWearers[index];
	}

	function getAllConfirmedWearers()
		external
		view
		returns (address[][] memory result)
	{
		uint256 len = _confirmedWearers.length;
		result = new address[][](len);
		for (uint256 i = 0; i < len; i++) {
			result[i] = _confirmedWearers[i];
		}
	}

	function buildSplitsInfo(
		address[][] calldata wearersByHat
	) external view returns (ISplitsCreator.SplitsInfo[] memory) {
		require(
			wearersByHat.length == _hatIds.length,
			"ScheduledDistributor: wearers length mismatch"
		);
		return _buildSplitsInfo(wearersByHat);
	}

	// -------------------- internals --------------------

	function _validateWearers(
		address[][] calldata wearersByHat
	) internal view {
		IHats _hats = IHats(hats);
		uint256 hatsLen = _hatIds.length;

		for (uint256 i = 0; i < hatsLen; i++) {
			address[] calldata w = wearersByHat[i];
			uint256 hatId = _hatIds[i];

			// 1. Each input address is a current wearer.
			// 2. No duplicates.
			for (uint256 j = 0; j < w.length; j++) {
				require(
					_hats.isWearerOfHat(w[j], hatId),
					"ScheduledDistributor: not wearer"
				);
				for (uint256 k = j + 1; k < w.length; k++) {
					require(
						w[j] != w[k],
						"ScheduledDistributor: duplicate wearer"
					);
				}
			}

			// 3. Every confirmed wearer who is still a wearer must appear.
			address[] memory cw = _confirmedWearers[i];
			for (uint256 c = 0; c < cw.length; c++) {
				if (_hats.isWearerOfHat(cw[c], hatId)) {
					bool found = false;
					for (uint256 j = 0; j < w.length; j++) {
						if (w[j] == cw[c]) {
							found = true;
							break;
						}
					}
					require(
						found,
						"ScheduledDistributor: confirmed wearer missing"
					);
				}
			}
		}
	}

	function _buildSplitsInfo(
		address[][] calldata wearersByHat
	) internal view returns (ISplitsCreator.SplitsInfo[] memory splitsInfo) {
		uint256 hatsLen = _hatIds.length;
		splitsInfo = new ISplitsCreator.SplitsInfo[](hatsLen);
		for (uint256 i = 0; i < hatsLen; i++) {
			splitsInfo[i] = ISplitsCreator.SplitsInfo({
				hatId: _hatIds[i],
				multiplierBottom: _multiplierBottoms[i],
				multiplierTop: _multiplierTops[i],
				wearers: wearersByHat[i]
			});
		}
	}
}
