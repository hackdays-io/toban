import { Address, BigInt, Bytes } from "@graphprotocol/graph-ts";
import {
  EscrowedRoleShare,
  HatsQuestModule,
  Quest,
  QuestApproval,
  SubmissionAttempt,
} from "../generated/schema";
import {
  CompletionSubmitted,
  QuestApproved,
  QuestCancelled,
  QuestCompleted,
  QuestCreated,
  SubmissionRejected,
  SubmissionWithdrawn,
} from "../generated/templates/HatsQuestModule/HatsQuestModule";

const STATUS_OPEN = "Open";
const STATUS_PENDING_REVIEW = "PendingReview";
const STATUS_COMPLETED = "Completed";
const STATUS_CANCELLED = "Cancelled";

const OUTCOME_PENDING = "Pending";
const OUTCOME_WITHDRAWN = "Withdrawn";
const OUTCOME_REJECTED = "Rejected";
const OUTCOME_APPROVED = "Approved";

function questEntityId(module: Address, questId: BigInt): string {
  return `${module.toHex()}-${questId.toString()}`;
}

function attemptEntityId(
  module: Address,
  questId: BigInt,
  attemptIndex: i32,
): string {
  return `${module.toHex()}-${questId.toString()}-${attemptIndex.toString()}`;
}

function approvalEntityId(
  module: Address,
  questId: BigInt,
  attemptIndex: i32,
  approver: Address,
): string {
  return `${module.toHex()}-${questId.toString()}-${attemptIndex.toString()}-${approver.toHex()}`;
}

function escrowEntityId(
  creator: Address,
  hatId: BigInt,
  wearer: Address,
): string {
  return `${creator.toHex()}-${hatId.toHexString()}-${wearer.toHex()}`;
}

function adjustEscrow(
  workspaceId: string,
  creator: Address,
  hatId: BigInt,
  wearer: Address,
  delta: BigInt,
  timestamp: BigInt,
): void {
  const id = escrowEntityId(creator, hatId, wearer);
  let escrow = EscrowedRoleShare.load(id);
  if (escrow === null) {
    escrow = new EscrowedRoleShare(id);
    escrow.workspace = workspaceId;
    escrow.creator = creator.toHex();
    escrow.hatId = hatId;
    escrow.wearer = wearer.toHex();
    escrow.amount = BigInt.zero();
  }
  escrow.amount = escrow.amount.plus(delta);
  escrow.updatedAt = timestamp;
  escrow.save();
}

export function handleQuestCreated(ev: QuestCreated): void {
  const module = HatsQuestModule.load(ev.address.toHex());
  if (module === null) return;

  const id = questEntityId(ev.address, ev.params.questId);
  let quest = Quest.load(id);
  if (quest !== null) return;

  quest = new Quest(id);
  quest.workspace = module.workspaceId;
  quest.questModuleEntity = module.id;
  quest.questModule = ev.address.toHex();
  quest.questId = ev.params.questId;
  quest.hatId = ev.params.hatId;
  quest.wearer = ev.params.wearer.toHex();
  quest.creator = ev.params.creator.toHex();
  quest.submitter = null;
  quest.amount = ev.params.amount;
  quest.status = STATUS_OPEN;
  quest.metadataHash = ev.params.metadataHash;
  quest.approvalCount = 0;
  quest.attemptCount = 0;
  quest.createdAt = ev.block.timestamp;
  quest.submittedAt = null;
  quest.completedAt = null;
  quest.cancelledAt = null;
  quest.blockNumber = ev.block.number;
  quest.blockTimestamp = ev.block.timestamp;
  quest.txHash = ev.transaction.hash;
  quest.save();

  adjustEscrow(
    module.workspaceId,
    ev.params.creator,
    ev.params.hatId,
    ev.params.wearer,
    ev.params.amount,
    ev.block.timestamp,
  );
}

export function handleCompletionSubmitted(ev: CompletionSubmitted): void {
  const id = questEntityId(ev.address, ev.params.questId);
  const quest = Quest.load(id);
  if (quest === null) return;

  const attemptIndex = quest.attemptCount;
  const attempt = new SubmissionAttempt(
    attemptEntityId(ev.address, ev.params.questId, attemptIndex),
  );
  attempt.quest = quest.id;
  attempt.attemptIndex = attemptIndex;
  attempt.submitter = ev.params.submitter.toHex();
  attempt.submittedAt = ev.block.timestamp;
  attempt.outcome = OUTCOME_PENDING;
  attempt.withdrawnAt = null;
  attempt.rejectedAt = null;
  attempt.approvedAt = null;
  attempt.save();

  quest.submitter = ev.params.submitter.toHex();
  quest.submittedAt = ev.block.timestamp;
  quest.status = STATUS_PENDING_REVIEW;
  quest.approvalCount = 0;
  quest.attemptCount = attemptIndex + 1;
  quest.save();
}

function closeCurrentAttempt(
  module: Address,
  questId: BigInt,
  attemptIndex: i32,
  outcome: string,
  timestamp: BigInt,
): void {
  const attempt = SubmissionAttempt.load(
    attemptEntityId(module, questId, attemptIndex),
  );
  if (attempt === null) return;
  attempt.outcome = outcome;
  if (outcome == OUTCOME_WITHDRAWN) {
    attempt.withdrawnAt = timestamp;
  } else if (outcome == OUTCOME_REJECTED) {
    attempt.rejectedAt = timestamp;
  } else if (outcome == OUTCOME_APPROVED) {
    attempt.approvedAt = timestamp;
  }
  attempt.save();
}

export function handleSubmissionWithdrawn(ev: SubmissionWithdrawn): void {
  const id = questEntityId(ev.address, ev.params.questId);
  const quest = Quest.load(id);
  if (quest === null) return;

  closeCurrentAttempt(
    ev.address,
    ev.params.questId,
    quest.attemptCount - 1,
    OUTCOME_WITHDRAWN,
    ev.block.timestamp,
  );

  quest.submitter = null;
  quest.submittedAt = null;
  quest.status = STATUS_OPEN;
  quest.approvalCount = 0;
  quest.save();
}

export function handleSubmissionRejected(ev: SubmissionRejected): void {
  const id = questEntityId(ev.address, ev.params.questId);
  const quest = Quest.load(id);
  if (quest === null) return;

  closeCurrentAttempt(
    ev.address,
    ev.params.questId,
    quest.attemptCount - 1,
    OUTCOME_REJECTED,
    ev.block.timestamp,
  );

  quest.submitter = null;
  quest.submittedAt = null;
  quest.status = STATUS_OPEN;
  quest.approvalCount = 0;
  quest.save();
}

export function handleQuestApproved(ev: QuestApproved): void {
  const id = questEntityId(ev.address, ev.params.questId);
  const quest = Quest.load(id);
  if (quest === null) return;

  const attemptIndex = quest.attemptCount - 1;
  const attemptId = attemptEntityId(
    ev.address,
    ev.params.questId,
    attemptIndex,
  );
  const attempt = SubmissionAttempt.load(attemptId);
  if (attempt === null) return;

  const approval = new QuestApproval(
    approvalEntityId(
      ev.address,
      ev.params.questId,
      attemptIndex,
      ev.params.approver,
    ),
  );
  approval.quest = quest.id;
  approval.attempt = attempt.id;
  approval.approver = ev.params.approver.toHex();
  approval.approvedAt = ev.block.timestamp;
  approval.blockNumber = ev.block.number;
  approval.txHash = ev.transaction.hash;
  approval.save();

  quest.approvalCount = ev.params.newApprovalCount;
  quest.save();
}

export function handleQuestCompleted(ev: QuestCompleted): void {
  const id = questEntityId(ev.address, ev.params.questId);
  const quest = Quest.load(id);
  if (quest === null) return;

  closeCurrentAttempt(
    ev.address,
    ev.params.questId,
    quest.attemptCount - 1,
    OUTCOME_APPROVED,
    ev.block.timestamp,
  );

  quest.status = STATUS_COMPLETED;
  quest.completedAt = ev.block.timestamp;
  quest.save();

  adjustEscrow(
    quest.workspace,
    Address.fromString(quest.creator),
    quest.hatId,
    Address.fromString(quest.wearer),
    ev.params.amount.neg(),
    ev.block.timestamp,
  );
}

export function handleQuestCancelled(ev: QuestCancelled): void {
  const id = questEntityId(ev.address, ev.params.questId);
  const quest = Quest.load(id);
  if (quest === null) return;

  quest.status = STATUS_CANCELLED;
  quest.cancelledAt = ev.block.timestamp;
  quest.save();

  adjustEscrow(
    quest.workspace,
    Address.fromString(quest.creator),
    quest.hatId,
    Address.fromString(quest.wearer),
    ev.params.amount.neg(),
    ev.block.timestamp,
  );
}
