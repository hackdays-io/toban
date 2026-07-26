#!/usr/bin/env bash
#
# Apply a policy from turnkey/policy.json to the Turnkey organization.
#
#   ./turnkey/apply-policy.sh <base|sepolia> [--dry-run]
#
# Idempotent: looks the policy up by `policyName` and issues update_policy if it
# already exists, create_policy if it does not. It never deletes anything.
#
# Why a script rather than a documented curl: the request envelope has to carry a
# fresh `timestampMs`, create and update spell the same fields differently
# (`condition` vs `policyCondition`), and re-running `create_policy` silently
# stacks a second policy instead of replacing the first. All three are easy to
# get wrong by hand and hard to notice afterwards.
#
# Requires: turnkey CLI, jq. Uses the admin API key (root user) — the bot's own
# stamper key is non-root and cannot manage policies.
#
# See docs/turnkey-setup.md §6.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
POLICY_FILE="$SCRIPT_DIR/policy.json"
ADMIN_KEY="${TK_ADMIN_KEY:-toban-turnkey-admin}"

die() { printf 'error: %s\n' "$*" >&2; exit 1; }

command -v turnkey >/dev/null || die "turnkey CLI not found — see docs/turnkey-setup.md §1"
command -v jq      >/dev/null || die "jq not found"
[ -f "$POLICY_FILE" ] || die "policy file not found: $POLICY_FILE"

POLICY_ID=""
DRY_RUN=0
for arg in "$@"; do
  case "$arg" in
    --dry-run) DRY_RUN=1 ;;
    -*)        die "unknown flag: $arg" ;;
    *)         [ -z "$POLICY_ID" ] || die "only one policy id may be given"; POLICY_ID="$arg" ;;
  esac
done

if [ -z "$POLICY_ID" ]; then
  printf 'usage: %s <%s> [--dry-run]\n' \
    "$(basename "$0")" "$(jq -r '[.policies[].id] | join("|")' "$POLICY_FILE")" >&2
  exit 64
fi

ORG="${TK_ORG:-$(jq -r '.organizationId' "$POLICY_FILE")}"
[ -n "$ORG" ] && [ "$ORG" != "null" ] || die "organizationId missing from $POLICY_FILE (or set TK_ORG)"

PARAMS="$(jq -c --arg id "$POLICY_ID" '.policies[] | select(.id == $id) | .parameters' "$POLICY_FILE")"
[ -n "$PARAMS" ] || die "no policy with id '$POLICY_ID' in $POLICY_FILE"

POLICY_NAME="$(jq -r '.policyName' <<<"$PARAMS")"
PINNED_ID="$(jq -r --arg id "$POLICY_ID" \
  '.policies[] | select(.id == $id) | .policyId // ""' "$POLICY_FILE")"

# Read-only lookup, so it runs in --dry-run too: knowing whether this would
# create or update is the whole point of the dry run.
echo "--> looking up policy for '$POLICY_ID' in org $ORG" >&2
LIVE="$(
  turnkey request --path /public/v1/query/list_policies \
    -k "$ADMIN_KEY" --organization "$ORG" --body "{\"organizationId\":\"$ORG\"}"
)"

# Prefer the pinned policyId over the name. Matching on name alone breaks the
# moment policy.json renames a policy: the lookup misses, a second policy is
# created, and the old — broader — one stays live and keeps granting.
if [ -n "$PINNED_ID" ]; then
  EXISTING="$(jq -r --arg pid "$PINNED_ID" \
    '[.policies[] | select(.policyId == $pid) | .policyId] | .[0] // ""' <<<"$LIVE")"
  [ -n "$EXISTING" ] || die "policy.json pins policyId $PINNED_ID for '$POLICY_ID', but the org has no such policy.
       It was probably deleted out of band. Set \"policyId\": null in policy.json to create a fresh one."
else
  EXISTING="$(jq -r --arg n "$POLICY_NAME" \
    '[.policies[] | select(.policyName == $n) | .policyId] | .[0] // ""' <<<"$LIVE")"
  if [ -n "$EXISTING" ]; then
    echo "--> note: '$POLICY_NAME' already exists as $EXISTING; record it as \"policyId\" in policy.json" >&2
  fi
fi

if [ -n "$EXISTING" ]; then
  ACTION="update"
  API_PATH="/public/v1/submit/update_policy"
  ACTIVITY="ACTIVITY_TYPE_UPDATE_POLICY_V2"
  BODY_PARAMS="$(jq -c --arg pid "$EXISTING" \
    '{policyId: $pid, policyName, policyEffect: .effect,
      policyCondition: .condition, policyConsensus: .consensus, policyNotes: .notes}' <<<"$PARAMS")"
  echo "--> found policyId $EXISTING — will UPDATE it in place" >&2
else
  ACTION="create"
  API_PATH="/public/v1/submit/create_policy"
  ACTIVITY="ACTIVITY_TYPE_CREATE_POLICY_V3"
  BODY_PARAMS="$PARAMS"
  echo "--> no policy named '$POLICY_NAME' — will CREATE one" >&2
fi

BODY="$(jq -n --arg t "$ACTIVITY" --arg org "$ORG" --argjson p "$BODY_PARAMS" \
  '{type: $t, timestampMs: (now * 1000 | floor | tostring), organizationId: $org, parameters: $p}')"

if [ "$DRY_RUN" -eq 1 ]; then
  echo "--> DRY RUN — would POST $API_PATH:" >&2
  jq . <<<"$BODY"
  exit 0
fi

turnkey request --path "$API_PATH" -k "$ADMIN_KEY" --organization "$ORG" --body "$BODY"
echo "--> ${ACTION}d '$POLICY_NAME'. Verify with:" >&2
echo "    turnkey request --path /public/v1/query/list_policies -k $ADMIN_KEY --organization $ORG --body '{\"organizationId\":\"$ORG\"}' | jq '.policies[]|{policyName,condition}'" >&2
