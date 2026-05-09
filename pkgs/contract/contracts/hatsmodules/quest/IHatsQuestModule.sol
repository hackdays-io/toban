// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title IHatsQuestModule
 * @notice Interface for the HatsQuestModule contract.
 * @dev Defines the data model, events, errors, and external functions used to
 *      escrow RoleShare (HatsFractionTokenModule) tokens and distribute them
 *      trustlessly via a quest creation / submission / approval workflow.
 */
interface IHatsQuestModule {
    // ============ Types ============

    /**
     * @notice Lifecycle status of a quest.
     * @dev Open -> PendingReview -> Completed and Open -> Cancelled are the
     *      only valid transitions; every transition is irreversible.
     */
    enum QuestStatus {
        Open,
        PendingReview,
        Completed,
        Cancelled
    }

    /**
     * @notice On-chain representation of a single quest.
     * @param hatId The hat that backs the escrowed RoleShare.
     * @param wearer The wearer key of the share (tokenId = keccak256(hatId, wearer)).
     * @param creator The address that created the quest and posted the escrow.
     * @param submitter The address that submitted completion (zero until submitted).
     * @param amount The amount of RoleShare escrowed for this quest.
     * @param status Current lifecycle state.
     * @param metadataHash Off-chain pointer (e.g. IPFS CID hash) for quest details.
     * @param createdAt Timestamp when the quest was created.
     * @param submittedAt Timestamp when the completion was submitted (zero until submitted).
     */
    struct Quest {
        uint256 hatId;
        address wearer;
        address creator;
        address submitter;
        uint256 amount;
        QuestStatus status;
        bytes32 metadataHash;
        uint64 createdAt;
        uint64 submittedAt;
    }

    // ============ Errors ============

    error InvalidAmount();
    error InsufficientShare();
    error InvalidHatDomain();
    error QuestNotFound();
    error InvalidStatus();
    error NotCreator();
    error CannotSubmitOwnQuest();
    error CannotApproveOwnSubmission();
    error AlreadyApproved();
    error NotWorkspaceMember();

    // ============ Events ============

    event QuestCreated(
        uint256 indexed questId,
        address indexed creator,
        uint256 indexed hatId,
        address wearer,
        uint256 amount,
        bytes32 metadataHash
    );
    event CompletionSubmitted(uint256 indexed questId, address indexed submitter);
    event QuestApproved(uint256 indexed questId, address indexed approver, uint8 newApprovalCount);
    event QuestCompleted(uint256 indexed questId, address indexed submitter, uint256 amount);
    event QuestCancelled(uint256 indexed questId, address indexed creator, uint256 amount);

    // ============ Lifecycle ============

    /**
     * @notice Creates a quest backed by the caller's RoleShare.
     * @dev Escrows `amount` of RoleShare from the caller into this contract.
     * @param hatId The hat associated with the RoleShare.
     * @param wearer The wearer key of the share to escrow.
     * @param amount The amount of RoleShare to escrow.
     * @param metadataHash Off-chain metadata pointer for the quest.
     * @return questId The id assigned to the new quest.
     */
    function createQuest(
        uint256 hatId,
        address wearer,
        uint256 amount,
        bytes32 metadataHash
    ) external returns (uint256 questId);

    /**
     * @notice Submits completion of an open quest. The caller becomes the submitter.
     * @param questId The quest to submit completion for.
     * @param membershipHatId A hat the caller wears in this workspace, used to
     *        prove workspace membership.
     */
    function submitCompletion(uint256 questId, uint256 membershipHatId) external;

    /**
     * @notice Approves a quest in PendingReview.
     *         Single creator approval or two distinct hat-holder approvals
     *         transitions the quest to Completed and releases the escrow.
     * @param questId The quest to approve.
     * @param membershipHatId A hat the caller wears in this workspace.
     */
    function approve(uint256 questId, uint256 membershipHatId) external;

    /**
     * @notice Cancels an Open quest and returns the escrow to its creator.
     * @param questId The quest to cancel.
     */
    function cancel(uint256 questId) external;

    // ============ Views ============

    /**
     * @notice Returns the full quest record.
     */
    function getQuest(uint256 questId) external view returns (Quest memory);

    /**
     * @notice Returns the number of distinct approvals collected for a quest.
     */
    function getApprovalCount(uint256 questId) external view returns (uint8);

    /**
     * @notice Returns whether `approver` has already approved `questId`.
     */
    function hasApprovedBy(uint256 questId, address approver) external view returns (bool);

    /**
     * @notice Returns the total amount of RoleShare currently escrowed by
     *         `creator` for the (hatId, wearer) share key.
     * @dev Used by SplitsCreator to credit escrowed shares back to the creator
     *      while a quest is in flight.
     */
    function getEscrowedBalance(
        address creator,
        uint256 hatId,
        address wearer
    ) external view returns (uint256);

    /**
     * @notice Returns the workspace domain id this module is bound to.
     */
    function getDomain() external view returns (uint32);

    /**
     * @notice Returns the address of the HatsFractionTokenModule used for escrow.
     */
    function FRACTION_TOKEN() external view returns (address);
}
