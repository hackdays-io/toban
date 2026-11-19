/-
`HatsTimeFrameModule` with Solidity 0.8 uint256 semantics: the two additions
(`totalActiveTime += ...` in `deactivate`, `activeTime += ...` in
`getWearingElapsedTime`) revert with Panic 0x11 when the result does not fit
in 256 bits. Everything else is the same as `Model.lean`: the checked
subtraction already reverts there, and `mintHat` / `batchMintHat` /
`reactivate` / `renounce` only store values.

`Theorems.lean` proves that on every state the module can reach with block
timestamps below 2^256, these additions never overflow, so this model and the
unbounded one agree (HTF-7). This is the model the test vectors come from.
-/
import Spec.HatsTimeFrameModule.Model

namespace Spec.HatsTimeFrameModule

def WORD : Nat := 2 ^ 256

namespace U

def add (a b : Nat) : Result Nat := if a + b < WORD then .ok (a + b) else .error .overflow

end U

def stepU (e : Env) (s : State) (now : Nat) : Op → Result State
  | .deactivate c w =>
    if !(s w).isActive then .error .alreadyInactive
    else if !(e.hasAuthority c || c == w) then .error .notAuthorized
    else match sub now (s w).woreTime with
      | .error err => .error err
      | .ok d => match U.add (s w).totalActiveTime d with
        | .error err => .error err
        | .ok _ => .ok (s.set w (deactivated (s w) now d))
  | op => step e s now op

def getWearingElapsedTimeU (s : State) (now w : Nat) : Result Nat :=
  if now < (s w).woreTime then .error .invalidWoreTime
  else if (s w).isActive then U.add (s w).totalActiveTime (now - (s w).woreTime)
  else .ok (s w).totalActiveTime

end Spec.HatsTimeFrameModule
