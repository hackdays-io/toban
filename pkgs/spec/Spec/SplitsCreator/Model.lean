/-
Reference model of `SplitsCreator.preview` / `_calculateAllocations`
(pkgs/contract/contracts/splitscreator/SplitsCreator.sol).

The model takes, as plain data, everything the contract reads from other
contracts (ThanksToken balances, FractionToken balances and supplies, wear time,
quest escrow), and computes the same allocations with the same integer
arithmetic: every `/` below is floor division, done in the same order as the
Solidity expression it mirrors. `none` means a division by zero.

This model uses unbounded `Nat`. `Contract.lean` is the same computation with
uint256 overflow checks (what the contract actually does), and
`Refinement.lean` proves the two agree whenever the contract returns (SPL-8).

Not covered: how `recipients` is read — the model takes each wearer's other
holders already filtered (wearer itself and the quest module removed).
-/
namespace Spec.SplitsCreator

/-- `PRECISION` in SplitsCreator.sol (`10e8`, i.e. 10^9). -/
def PRECISION : Nat := 1000000000

/-- `WeightsInfo`. -/
structure Weights where
  role : Nat
  thanks : Nat
  received : Nat
  sent : Nat
  deriving Repr, DecidableEq

/-- One ThanksToken participant: `balanceOf` and `mintedAmount`. -/
structure Participant where
  addr : Nat
  balance : Nat
  minted : Nat
  deriving Repr, DecidableEq

/-- An account holding part of a wearer's role share (FractionToken). -/
structure Holder where
  addr : Nat
  /-- `FractionToken.balanceOf(holder, wearer, hatId)` -/
  balance : Nat
  /-- `HatsQuestModule.getEscrowedBalance(holder, hatId, wearer)` -/
  escrow : Nat
  deriving Repr, DecidableEq

/-- A wearer of a role listed in `SplitsInfo.wearers`. -/
structure Wearer where
  self : Holder
  /-- `HatsTimeFrameModule.getWearingElapsedTime(wearer, hatId)` -/
  elapsed : Nat
  /-- `FractionToken.totalSupply(wearer, hatId)` -/
  supply : Nat
  /-- Other holders of this wearer's share, in `getTokenRecipients` order. -/
  others : List Holder
  deriving Repr, DecidableEq

/-- One `SplitsInfo` entry. -/
structure Role where
  hatId : Nat
  multiplierTop : Nat
  multiplierBottom : Nat
  wearers : List Wearer
  deriving Repr, DecidableEq

/-- Which optional modules the SplitsCreator clone was configured with. -/
structure Modules where
  timeFrame : Bool
  quest : Bool
  deriving Repr, DecidableEq

structure Input where
  modules : Modules
  weights : Weights
  participants : List Participant
  roles : List Role
  deriving Repr, DecidableEq

/-- `(recipient, allocation)` -/
abbrev Entry := Nat × Nat

structure Output where
  entries : List Entry
  totalAllocation : Nat
  deriving Repr, DecidableEq

def Output.recipients (o : Output) : List Nat := o.entries.map Prod.fst
def Output.allocations (o : Output) : List Nat := o.entries.map Prod.snd

def allocSum (l : List Entry) : Nat := (l.map Prod.snd).sum

/-! ## Thanks side (`_calculateThanksAllocations`) -/

def totalBalance (ps : List Participant) : Nat := (ps.map Participant.balance).sum
def totalMinted (ps : List Participant) : Nat := (ps.map Participant.minted).sum

/-- `thanksScore` for one participant, given the totals. -/
def thanksScore (w : Weights) (tb tm : Nat) (p : Participant) : Nat :=
  (w.received * p.balance * PRECISION / tb + w.sent * p.minted * PRECISION / tm)
    / (w.received + w.sent)

def thanksSide (w : Weights) (ps : List Participant) : Option (List Entry) :=
  let tb := totalBalance ps
  let tm := totalMinted ps
  if 0 < tb ∧ 0 < tm then
    if w.received + w.sent = 0 then none -- division by zero
    else some (ps.map fun p => (p.addr, thanksScore w tb tm p))
  else
    -- The arrays are allocated but never written: zero address, zero amount.
    some (ps.map fun _ => (0, 0))

/-! ## Role side (`_calculateRoleAllocations`) -/

/-- `_getHatsTimeFrameMultiplier`: ⌊√elapsed⌋, or 1 without the module. -/
def timeMultiplier (m : Modules) (w : Wearer) : Nat :=
  if m.timeFrame then Nat.sqrt w.elapsed else 1

/-- Balance credited to a holder: own balance plus quest escrow. -/
def effectiveBalance (m : Modules) (h : Holder) : Nat :=
  if m.quest then h.balance + h.escrow else h.balance

/-- Raw (un-normalised) score of one holder of `w`'s share. -/
def rawScore (m : Modules) (mult : Nat) (w : Wearer) (h : Holder) : Nat :=
  effectiveBalance m h * mult * timeMultiplier m w

def wearerEntries (m : Modules) (mult : Nat) (w : Wearer) : List Entry :=
  (w.self :: w.others).map fun h => (h.addr, rawScore m mult w h)

def roleSupply (r : Role) : Nat := (r.wearers.map Wearer.supply).sum

def roleRaw (m : Modules) (r : Role) : List Entry :=
  r.wearers.flatMap (wearerEntries m (r.multiplierTop / r.multiplierBottom))

def roleEntries (m : Modules) (r : Role) : Option (List Entry) :=
  if r.multiplierBottom = 0 then none -- division by zero
  else
    let raw := roleRaw m r
    let supply := roleSupply r
    if raw ≠ [] ∧ supply = 0 then none -- division by zero
    else some (raw.map fun e => (e.1, e.2 * PRECISION / supply))

def roleSide (m : Modules) : List Role → Option (List Entry)
  | [] => some []
  | r :: rs => do
    let es ← roleEntries m r
    let rest ← roleSide m rs
    pure (es ++ rest)

/-! ## Combining both sides (`_calculateAllocations`) -/

/-- Final allocation of one entry of a side with weight `weight` and raw total `total`. -/
def scale (weight total weightSum : Nat) (e : Entry) : Entry :=
  (e.1, e.2 * weight * PRECISION / total / weightSum)

/-- A side takes part only if its weight and its total are both non-zero. -/
def side (weight weightSum : Nat) (es : List Entry) : List Entry :=
  if 0 < weight ∧ 0 < allocSum es then es.map (scale weight (allocSum es) weightSum) else []

/-- The Solidity loop that sums `allocations`. -/
def accumulate (l : List Entry) : Nat := l.foldl (fun acc e => acc + e.2) 0

def combine (w : Weights) (thanks roles : List Entry) : Output :=
  let weightSum := w.thanks + w.role
  let entries := side w.thanks weightSum thanks ++ side w.role weightSum roles
  { entries, totalAllocation := accumulate entries }

/-- `SplitsCreator.preview`. -/
def preview (i : Input) : Option Output := do
  let thanks ← thanksSide i.weights i.participants
  let roles ← roleSide i.modules i.roles
  pure (combine i.weights thanks roles)

end Spec.SplitsCreator
