/-
`SplitsCreator.preview` with Solidity 0.8 uint256 semantics: every `*` and `+`
reverts with Panic 0x11 when the result does not fit in 256 bits, and every `/`
reverts with Panic 0x12 when the divisor is 0. Every division runs in the same
place relative to the other operations as in the Solidity code, so the first
failing operation — and thus the panic code — is the same. Some additions are
grouped differently (sums taken after a loop instead of inside it; balance and
minted totals summed one after the other instead of interleaved; the
`totalAllocation +=` inside `_calculateThanksAllocations`' score loop, which the
contract discards and recomputes, is not repeated). These only move one overflow
check past another, never past a division, so they cannot change the panic code.

`Model.lean` computes the same allocations with unbounded `Nat`, which is
where the principles are easiest to prove; `Refinement.lean` proves the two
agree whenever this model returns (SPL-8), so the principles carry over.

Not modeled: `_sqrt`'s internal arithmetic (its operands stay far below 2^256
for any wear time) — it is `Nat.sqrt` here, and the differential test checks
the two agree. Contract inputs are uint256 values (< 2^256).
-/
import Spec.SplitsCreator.Model

namespace Spec.SplitsCreator

def WORD : Nat := 2 ^ 256

inductive Panic where
  /-- Panic 0x11: arithmetic overflow -/
  | overflow
  /-- Panic 0x12: division by zero -/
  | divZero
  deriving Repr, DecidableEq

abbrev EVM := Except Panic

namespace U

def add (a b : Nat) : EVM Nat := if a + b < WORD then pure (a + b) else throw .overflow
def mul (a b : Nat) : EVM Nat := if a * b < WORD then pure (a * b) else throw .overflow
def div (a b : Nat) : EVM Nat := if b = 0 then throw .divZero else pure (a / b)

/-- `total += x` over a list, starting from `init`. -/
def sum (l : List Nat) (init : Nat := 0) : EVM Nat := l.foldlM add init

/-! ## Thanks side -/

def thanksScore (w : Weights) (tb tm ws : Nat) (p : Participant) : EVM Entry := do
  let x ← mul w.received p.balance
  let x ← mul x PRECISION
  let x ← div x tb
  let y ← mul w.sent p.minted
  let y ← mul y PRECISION
  let y ← div y tm
  let s ← add x y
  let s ← div s ws
  pure (p.addr, s)

def thanksSide (w : Weights) (ps : List Participant) : EVM (List Entry) := do
  let tb ← sum (ps.map Participant.balance)
  let tm ← sum (ps.map Participant.minted)
  let ws ← add w.received w.sent
  if 0 < tb ∧ 0 < tm then ps.mapM (thanksScore w tb tm ws)
  else pure (ps.map fun _ => (0, 0))

/-! ## Role side -/

def effectiveBalance (m : Modules) (h : Holder) : EVM Nat :=
  if m.quest then add h.balance h.escrow else pure h.balance

def holderScore (m : Modules) (mult : Nat) (w : Wearer) (h : Holder) : EVM Entry := do
  let b ← effectiveBalance m h
  let s ← mul b mult
  let s ← mul s (timeMultiplier m w)
  pure (h.addr, s)

/-- One wearer: `fractionTokenSupply += totalSupply`, then the wearer's and the
other holders' raw scores. -/
def wearerStep (m : Modules) (mult : Nat) (acc : List Entry × Nat) (w : Wearer) :
    EVM (List Entry × Nat) := do
  let supply ← add acc.2 w.supply
  let es ← (w.self :: w.others).mapM (holderScore m mult w)
  pure (acc.1 ++ es, supply)

def normalize (supply : Nat) (e : Entry) : EVM Entry := do
  let x ← mul e.2 PRECISION
  let x ← div x supply
  pure (e.1, x)

def roleEntries (m : Modules) (r : Role) : EVM (List Entry) := do
  let mult ← div r.multiplierTop r.multiplierBottom
  let (raw, supply) ← r.wearers.foldlM (wearerStep m mult) ([], 0)
  raw.mapM (normalize supply)

def roleSide (m : Modules) : List Role → EVM (List Entry)
  | [] => pure []
  | r :: rs => do
    let es ← roleEntries m r
    let rest ← roleSide m rs
    pure (es ++ rest)

/-! ## Combining -/

def scale (weight total weightSum : Nat) (e : Entry) : EVM Entry := do
  let x ← mul e.2 weight
  let x ← mul x PRECISION
  let x ← div x total
  let x ← div x weightSum
  pure (e.1, x)

def side (weight total weightSum : Nat) (es : List Entry) : EVM (List Entry) :=
  if 0 < weight ∧ 0 < total then es.mapM (scale weight total weightSum) else pure []

def combine (w : Weights) (thanks : List Entry) (thanksTotal : Nat)
    (roles : List Entry) (rolesTotal : Nat) : EVM Output := do
  let ws ← add w.thanks w.role
  let ts ← side w.thanks thanksTotal ws thanks
  let rs ← side w.role rolesTotal ws roles
  let total ← sum ((ts ++ rs).map Prod.snd)
  pure { entries := ts ++ rs, totalAllocation := total }

end U

/-- `SplitsCreator.preview` as the contract computes it. -/
def previewU (i : Input) : EVM Output := do
  let thanks ← U.thanksSide i.weights i.participants
  let thanksTotal ← U.sum (thanks.map Prod.snd)
  let roles ← U.roleSide i.modules i.roles
  let rolesTotal ← U.sum (roles.map Prod.snd)
  U.combine i.weights thanks thanksTotal roles rolesTotal

end Spec.SplitsCreator
