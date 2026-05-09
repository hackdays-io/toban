// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {HatsModule} from "../../hats/module/HatsModule.sol";
import {ERC1155Holder} from "@openzeppelin/contracts/token/ERC1155/utils/ERC1155Holder.sol";
import {IERC1155} from "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";
import {IHatsQuestModule} from "./IHatsQuestModule.sol";
import {IHatsFractionTokenModule} from "../fractiontoken/IHatsFractionTokenModule.sol";

/**
 * @title HatsQuestModule
 * @notice Trustless distribution of RoleShare via the quest workflow.
 * @dev    Creators escrow RoleShare into this module when they create a quest.
 *         A submitter declares completion, and either the creator alone or two
 *         distinct workspace hat holders approve to release the escrow to the
 *         submitter. The creator can cancel an Open quest to reclaim escrow.
 *
 *         One instance is deployed per workspace (TopHat domain) and bound to
 *         that workspace's HatsFractionTokenModule via init data.
 */
contract HatsQuestModule is HatsModule, ERC1155Holder, IHatsQuestModule {
    // ============ Storage ============

    IHatsFractionTokenModule private _fractionToken;
    uint32 private _domain;
    uint256 private _nextQuestId;

    mapping(uint256 => Quest) private _quests;
    mapping(uint256 => mapping(address => bool)) private _hasApproved;
    mapping(uint256 => uint8) private _approvalCount;

    // Tracks the addresses that have approved each quest so the approval
    // state can be cleanly reset when a submission is withdrawn or rejected.
    mapping(uint256 => address[]) private _approvers;

    // creator => fractionTokenId => total amount currently escrowed
    mapping(address => mapping(uint256 => uint256)) private _escrowedByCreator;

    // ============ Constructor ============

    constructor(string memory _version) HatsModule(_version) {}

    /**
     * @dev Initializes the module with the workspace's HatsFractionTokenModule address.
     * @param _initData ABI-encoded `(address fractionToken)`.
     */
    function _setUp(bytes calldata _initData) internal override {
        address fractionTokenAddress = abi.decode(_initData, (address));
        _fractionToken = IHatsFractionTokenModule(fractionTokenAddress);
        _domain = HATS().getTopHatDomain(hatId());
    }

    // ============ Lifecycle ============

    /// @inheritdoc IHatsQuestModule
    function createQuest(
        uint256 hatId_,
        address wearer,
        uint256 amount,
        bytes32 metadataHash
    ) external override returns (uint256 questId) {
        if (amount == 0) revert InvalidAmount();
        if (HATS().getTopHatDomain(hatId_) != _domain) revert InvalidHatDomain();
        if (_fractionToken.balanceOf(msg.sender, wearer, hatId_) < amount) {
            revert InsufficientShare();
        }

        questId = _nextQuestId++;
        _quests[questId] = Quest({
            hatId: hatId_,
            wearer: wearer,
            creator: msg.sender,
            submitter: address(0),
            amount: amount,
            status: QuestStatus.Open,
            metadataHash: metadataHash,
            createdAt: uint64(block.timestamp),
            submittedAt: 0
        });

        uint256 tokenId = _fractionToken.getTokenId(hatId_, wearer);
        _escrowedByCreator[msg.sender][tokenId] += amount;

        IERC1155(address(_fractionToken)).safeTransferFrom(
            msg.sender,
            address(this),
            tokenId,
            amount,
            ""
        );

        emit QuestCreated(questId, msg.sender, hatId_, wearer, amount, metadataHash);
    }

    /// @inheritdoc IHatsQuestModule
    function submitCompletion(
        uint256 questId,
        uint256 membershipHatId
    ) external override {
        Quest storage quest = _quests[questId];
        if (quest.creator == address(0)) revert QuestNotFound();
        if (quest.status != QuestStatus.Open) revert InvalidStatus();
        if (msg.sender == quest.creator) revert CannotSubmitOwnQuest();
        _requireWorkspaceMember(msg.sender, membershipHatId);

        quest.submitter = msg.sender;
        quest.status = QuestStatus.PendingReview;
        quest.submittedAt = uint64(block.timestamp);

        emit CompletionSubmitted(questId, msg.sender);
    }

    /// @inheritdoc IHatsQuestModule
    function withdrawSubmission(uint256 questId) external override {
        Quest storage quest = _quests[questId];
        if (quest.creator == address(0)) revert QuestNotFound();
        if (quest.status != QuestStatus.PendingReview) revert InvalidStatus();
        if (msg.sender != quest.submitter) revert NotSubmitter();

        address oldSubmitter = quest.submitter;
        _resetSubmission(questId);

        emit SubmissionWithdrawn(questId, oldSubmitter);
    }

    /// @inheritdoc IHatsQuestModule
    function rejectSubmission(uint256 questId) external override {
        Quest storage quest = _quests[questId];
        if (quest.creator == address(0)) revert QuestNotFound();
        if (quest.status != QuestStatus.PendingReview) revert InvalidStatus();
        if (msg.sender != quest.creator) revert NotCreator();

        address oldSubmitter = quest.submitter;
        _resetSubmission(questId);

        emit SubmissionRejected(questId, msg.sender, oldSubmitter);
    }

    /// @inheritdoc IHatsQuestModule
    function approve(
        uint256 questId,
        uint256 membershipHatId
    ) external override {
        Quest storage quest = _quests[questId];
        if (quest.creator == address(0)) revert QuestNotFound();
        if (quest.status != QuestStatus.PendingReview) revert InvalidStatus();
        if (msg.sender == quest.submitter) revert CannotApproveOwnSubmission();
        if (_hasApproved[questId][msg.sender]) revert AlreadyApproved();
        _requireWorkspaceMember(msg.sender, membershipHatId);

        _hasApproved[questId][msg.sender] = true;
        _approvers[questId].push(msg.sender);
        uint8 newCount = _approvalCount[questId] + 1;
        _approvalCount[questId] = newCount;

        emit QuestApproved(questId, msg.sender, newCount);

        // Creator's single approval finalizes the quest immediately;
        // otherwise two distinct hat-holder approvals are required.
        bool completed = (msg.sender == quest.creator) || (newCount >= 2);

        if (completed) {
            quest.status = QuestStatus.Completed;

            uint256 tokenId = _fractionToken.getTokenId(quest.hatId, quest.wearer);
            _escrowedByCreator[quest.creator][tokenId] -= quest.amount;

            IERC1155(address(_fractionToken)).safeTransferFrom(
                address(this),
                quest.submitter,
                tokenId,
                quest.amount,
                ""
            );

            emit QuestCompleted(questId, quest.submitter, quest.amount);
        }
    }

    /// @inheritdoc IHatsQuestModule
    function cancel(uint256 questId) external override {
        Quest storage quest = _quests[questId];
        if (quest.creator == address(0)) revert QuestNotFound();
        if (quest.status != QuestStatus.Open) revert InvalidStatus();
        if (msg.sender != quest.creator) revert NotCreator();

        quest.status = QuestStatus.Cancelled;

        uint256 tokenId = _fractionToken.getTokenId(quest.hatId, quest.wearer);
        _escrowedByCreator[quest.creator][tokenId] -= quest.amount;

        IERC1155(address(_fractionToken)).safeTransferFrom(
            address(this),
            quest.creator,
            tokenId,
            quest.amount,
            ""
        );

        emit QuestCancelled(questId, quest.creator, quest.amount);
    }

    // ============ Views ============

    /// @inheritdoc IHatsQuestModule
    function getQuest(uint256 questId) external view override returns (Quest memory) {
        return _quests[questId];
    }

    /// @inheritdoc IHatsQuestModule
    function getApprovalCount(uint256 questId) external view override returns (uint8) {
        return _approvalCount[questId];
    }

    /// @inheritdoc IHatsQuestModule
    function hasApprovedBy(
        uint256 questId,
        address approver
    ) external view override returns (bool) {
        return _hasApproved[questId][approver];
    }

    /// @inheritdoc IHatsQuestModule
    function getEscrowedBalance(
        address creator,
        uint256 hatId_,
        address wearer
    ) external view override returns (uint256) {
        return _escrowedByCreator[creator][_fractionToken.getTokenId(hatId_, wearer)];
    }

    /// @inheritdoc IHatsQuestModule
    function getDomain() external view override returns (uint32) {
        return _domain;
    }

    /// @inheritdoc IHatsQuestModule
    function FRACTION_TOKEN() external view override returns (address) {
        return address(_fractionToken);
    }

    /**
     * @notice Returns the next quest id that will be assigned by `createQuest`.
     */
    function nextQuestId() external view returns (uint256) {
        return _nextQuestId;
    }

    // ============ ERC1155 receiver gating ============

    /// @dev Only accept escrow transfers initiated by the bound fraction token.
    function onERC1155Received(
        address operator,
        address from,
        uint256 id,
        uint256 value,
        bytes memory data
    ) public virtual override returns (bytes4) {
        if (msg.sender != address(_fractionToken)) revert InvalidStatus();
        return super.onERC1155Received(operator, from, id, value, data);
    }

    /// @dev Batch transfers are not used by this module; reject for safety.
    function onERC1155BatchReceived(
        address,
        address,
        uint256[] memory,
        uint256[] memory,
        bytes memory
    ) public pure override returns (bytes4) {
        revert InvalidStatus();
    }

    // ============ Internal ============

    function _requireWorkspaceMember(
        address account,
        uint256 membershipHatId
    ) internal view {
        if (!HATS().isWearerOfHat(account, membershipHatId)) revert NotWorkspaceMember();
        if (HATS().getTopHatDomain(membershipHatId) != _domain) revert InvalidHatDomain();
    }

    /// @dev Returns the quest to Open, clearing submitter and approval state.
    function _resetSubmission(uint256 questId) internal {
        Quest storage quest = _quests[questId];

        address[] storage approvers = _approvers[questId];
        for (uint256 i = 0; i < approvers.length; i++) {
            _hasApproved[questId][approvers[i]] = false;
        }
        delete _approvers[questId];
        _approvalCount[questId] = 0;

        quest.submitter = address(0);
        quest.submittedAt = 0;
        quest.status = QuestStatus.Open;
    }
}
