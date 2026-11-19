/-
ThanksToken with Solidity 0.8 uint256 semantics: every checked `*` and `+`
reverts with Panic 0x11 (`Err.overflow`) when the result does not fit in 256
bits, in the contract's operation order, so the first failing check — and thus
the revert reason — is the same as the contract's. There is no division by a
value that can be 0 (`mintableAmount` skips roles with zero supply).

The checked operations are: in `mintableAmount`, `wearingTime10Minutes *
shareBalance`, `totalMintable += roleBasedAmount`, `totalMintable *
coefficient`, `* 1 ether` and `+= balanceOf(owner) / 10`; `_mintedAmount +=`;
`batchMint`'s `totalAmount +=` (inside the check loop); and ERC-20
`_totalSupply +=` in `_mint`.

Unchecked operations that cannot wrap are plain `Nat` here: the allowance
decrement (after `currentAllowance >= value`), ERC-20 balance updates (a
balance never exceeds the total supply), and the `mintNonces` increment (it
would take 2^256 permits by one owner to wrap).

`Refinement.lean` proves this agrees with `Model.lean` whenever it does not
overflow (THX-8). The test vectors are generated from this model.
-/
import Spec.ThanksToken.Model

namespace Spec.ThanksToken

def WORD : Nat := 2 ^ 256

namespace U

def add (a b : Nat) : Result Nat := if a + b < WORD then .ok (a + b) else .error .overflow
def mul (a b : Nat) : Result Nat := if a * b < WORD then .ok (a * b) else .error .overflow

def roleAmount (env : Env) (o : Nat) (r : RoleRef) : Result Nat :=
  if env.share o r = 0 ∨ env.supply r = 0 then .ok 0
  else do
    let x ← mul (env.elapsed r / UNIT) (env.share o r)
    pure (x / env.supply r)

/-- The role loop: `totalMintable += roleBasedAmount` after each role. -/
def roleSum (env : Env) (o : Nat) (roles : List RoleRef) : Result Nat :=
  (firstOcc [] roles).foldlM (fun acc r => do add acc (← roleAmount env o r)) 0

def cap (env : Env) (s : State) (o : Nat) (roles : List RoleRef) : Result Nat := do
  let t ← roleSum env o roles
  let t ← mul t (coefOf s o)
  let t ← mul (t / ONE) ONE
  add t (s.balance o / 10)

def mintable (env : Env) (s : State) (o : Nat) (roles : List RoleRef) : Result Nat := do
  let c ← cap env s o roles
  pure (c - s.minted o)

def creditMinted (s : State) (o v : Nat) : Result State := do
  let m ← add (s.minted o) v
  pure { s with minted := upd s.minted o m }

def mintTo (s : State) (a v : Nat) : Result State :=
  if a = 0 then .error .invalidReceiver
  else do
    let t ← add s.supply v
    pure { s with supply := t, balance := upd s.balance a (s.balance a + v) }

def mintAll : State → List (Nat × Nat) → Result State
  | s, [] => .ok s
  | s, (a, v) :: rest => do
    let s' ← mintTo s a v
    mintAll (addP s' a) rest

/-- `batchMint`'s first loop: checks and `totalAmount += amounts[i]`. -/
def checkBatch (sender : Nat) (acc : Nat) : List (Nat × Nat) → Result Nat
  | [] => .ok acc
  | (a, v) :: rest =>
    if a = sender then .error .selfMint
    else if v = 0 then .error .zeroAmount
    else do checkBatch sender (← add acc v) rest

end U

def stepU (env : Env) (s : State) : Op → Result State
  | .mint sender to amount roles =>
    if to = sender then .error .selfMint
    else if amount = 0 then .error .zeroAmount
    else do
      let m ← U.mintable env s sender roles
      if m < amount then .error .exceedsMintable
      else do
        let s ← U.creditMinted s sender amount
        let s ← U.mintTo s to amount
        pure (addP (addP s sender) to)
  | .batchMint sender tos amounts roles =>
    if tos.length ≠ amounts.length then .error .lengthMismatch
    else do
      let total ← U.checkBatch sender 0 (tos.zip amounts)
      let m ← U.mintable env s sender roles
      if m < total then .error .totalExceeds
      else do
        let s ← U.creditMinted s sender total
        let s ← U.mintAll s (tos.zip amounts)
        pure (addP s sender)
  | .mintFrom sender frm to value roles =>
    if to = frm then .error .selfMint
    else if to = sender then .error .mintToSpender
    else if value = 0 then .error .zeroAmount
    else if s.allowance frm sender < value then .error .allowanceExceeded
    else do
      let m ← U.mintable env s frm roles
      if m < value then .error .exceedsMintable
      else do
        let s ← U.creditMinted (spend s frm sender value) frm value
        let s ← U.mintTo s to value
        pure (addP (addP s frm) to)
  | op => step env s op

end Spec.ThanksToken
