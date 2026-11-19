/-
Reference model of `HatsTimeFrameModule`
(pkgs/contract/contracts/hatsmodules/timeframe/HatsTimeFrameModule.sol).

The module keeps, per (hatId, wearer), four storage values (`woreTime`,
`deactivatedTime`, `totalActiveTime`, `isActive`). Different hats never touch
each other's storage, so the model covers one `hatId`: the state maps each
account to its four values. Every operation runs at a block timestamp `now`.

Each operation is written as the same chain of checks as the Solidity code,
in the same order, so a reverting call fails with the same reason. A reverting
transaction changes nothing, so it is just an `Except.error`.

This model uses unbounded `Nat`, with the one checked subtraction
(`block.timestamp - woreTime` in `deactivate`) failing as `.underflow`.
`Contract.lean` adds the uint256 overflow checks on the additions, and
`Refinement.lean` / `Theorems.lean` prove they never fire (HTF-7).

Data from Hats Protocol is plain input: `hasAuthority` is "admin or wearer of
the minter hat", given as two lists. The calls into Hats (`mintHat`,
`transferHat`, `renounceHat`) are not modeled: their own checks are Hats'
specification, not this module's.
-/
namespace Spec.HatsTimeFrameModule

/-- An account. `0` is `address(0)`. -/
abbrev Addr := Nat

/-- Why a call reverts: a `require` message, or Panic 0x11. -/
inductive Err where
  /-- "Not authorized" -/
  | notAuthorized
  /-- "Hat is already inactive" -/
  | alreadyInactive
  /-- "Hat is already active" -/
  | alreadyActive
  /-- "Hat already minted" -/
  | alreadyMinted
  /-- "Empty wearers array" -/
  | emptyWearers
  /-- "Array length mismatch" -/
  | lengthMismatch
  /-- "Batch size too large" -/
  | batchTooLarge
  /-- "Invalid wearer address" -/
  | invalidWearer
  /-- "Invalid wore time" -/
  | invalidWoreTime
  /-- Panic 0x11 from a checked subtraction -/
  | underflow
  /-- Panic 0x11 from a checked addition (only in `Contract.lean`) -/
  | overflow
  deriving Repr, DecidableEq

abbrev Result := Except Err

/-- The storage of one (hatId, wearer). -/
structure Slot where
  woreTime : Nat := 0
  deactivatedTime : Nat := 0
  totalActiveTime : Nat := 0
  isActive : Bool := false
  deriving Repr, DecidableEq, Inhabited

/-- The storage of one hat: every account's slot. -/
abbrev State := Addr → Slot

def State.empty : State := fun _ => {}

def State.set (s : State) (w : Addr) (x : Slot) : State := fun a => if a = w then x else s a

/-- What the module reads from Hats about the minter hat (`minterHatId`). -/
structure Env where
  /-- accounts for which `isAdminOfHat(account, minterHatId)` -/
  admins : List Addr
  /-- accounts for which `isWearerOfHat(account, minterHatId)` -/
  minters : List Addr
  deriving Repr, DecidableEq

/-- `hasAuthority` -/
def Env.hasAuthority (e : Env) (a : Addr) : Bool := e.admins.contains a || e.minters.contains a

/-- A state-changing call, with `msg.sender` first. -/
inductive Op where
  | mintHat (caller wearer time : Nat)
  | batchMintHat (caller : Nat) (wearers times : List Nat)
  | deactivate (caller wearer : Nat)
  | reactivate (caller wearer : Nat)
  | renounce (caller wearer : Nat)
  deriving Repr, DecidableEq

/-- `time == 0 ? block.timestamp : time` -/
def startTime (now t : Nat) : Nat := if t = 0 then now else t

/-- `_setWoreTime(wearer, hatId, time)` followed by `isActive = true`. -/
def mintOne (now : Nat) (s : State) (w t : Nat) : Result State :=
  if (s w).woreTime = 0 then .ok (s.set w { s w with woreTime := startTime now t, isActive := true })
  else .error .alreadyMinted

/-- `batchMintHat`'s first loop: every wearer is checked before any is minted. -/
def precheck (s : State) : List Addr → Result Unit
  | [] => .ok ()
  | w :: ws =>
    if w = 0 then .error .invalidWearer
    else if (s w).woreTime ≠ 0 then .error .alreadyMinted
    else precheck s ws

/-- `batchMintHat`'s second loop. A wearer listed twice fails here. -/
def mintAll (now : Nat) : State → List (Addr × Nat) → Result State
  | s, [] => .ok s
  | s, (w, t) :: rest => match mintOne now s w t with
    | .ok s' => mintAll now s' rest
    | .error e => .error e

/-- `block.timestamp - woreTime`, checked. -/
def sub (a b : Nat) : Result Nat := if b ≤ a then .ok (a - b) else .error .underflow

/-- The slot after `deactivate`, given the elapsed active time `d`. -/
def deactivated (x : Slot) (now d : Nat) : Slot :=
  { x with isActive := false, deactivatedTime := now, totalActiveTime := x.totalActiveTime + d }

def step (e : Env) (s : State) (now : Nat) : Op → Result State
  | .mintHat c w t =>
    if !e.hasAuthority c then .error .notAuthorized
    else mintOne now s w t
  | .batchMintHat c ws ts =>
    if !e.hasAuthority c then .error .notAuthorized
    else if ws.length = 0 then .error .emptyWearers
    else if ws.length ≠ ts.length then .error .lengthMismatch
    else if 100 < ws.length then .error .batchTooLarge
    else match precheck s ws with
      | .error err => .error err
      | .ok () => mintAll now s (ws.zip ts)
  | .deactivate c w =>
    if !(s w).isActive then .error .alreadyInactive
    else if !(e.hasAuthority c || c == w) then .error .notAuthorized
    else match sub now (s w).woreTime with
      | .error err => .error err
      | .ok d => .ok (s.set w (deactivated (s w) now d))
  | .reactivate c w =>
    if (s w).isActive then .error .alreadyActive
    else if !(e.hasAuthority c || c == w) then .error .notAuthorized
    else .ok (s.set w { s w with isActive := true, woreTime := now })
  | .renounce c w =>
    if !(e.hasAuthority c || c == w) then .error .notAuthorized
    else .ok (s.set w {})

/-- `getWearingElapsedTime(wearer, hatId)` at block timestamp `now`. -/
def getWearingElapsedTime (s : State) (now w : Nat) : Result Nat :=
  if now < (s w).woreTime then .error .invalidWoreTime
  else if (s w).isActive then .ok ((s w).totalActiveTime + (now - (s w).woreTime))
  else .ok (s w).totalActiveTime

end Spec.HatsTimeFrameModule
