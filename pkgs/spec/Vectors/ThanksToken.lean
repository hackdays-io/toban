/-
ThanksToken test vectors: sequences of calls run through the uint256 model
(`Spec/ThanksToken/Contract.lean`), hand-written scenarios plus seeded
pseudo-random ones.

pkgs/contract/test/ThanksToken.Differential.ts replays every case against a
ThanksToken clone whose FractionToken and time-frame module are data mocks
set to `env`. Accounts are small integers: `k ≥ 1` is the test's k-th wallet,
`0` is the zero address. The workspace owner is account 1. After every call
the test compares the outcome (success, or the revert reason), `totalSupply`
and `getParticipants`; at the end of a case, every account's balance,
mintedAmount, addressCoefficient, mintNonces and every mintAllowance.
-/
import Vectors.Common
import Spec.ThanksToken.Contract

open Spec.ThanksToken Vectors

namespace Vectors.ThanksToken

/-- One `(wearer, hatId)` as the data mocks are set. -/
structure RoleData where
  ref : RoleRef
  supply : Nat
  elapsed : Nat
  /-- `(account, FractionToken balance)` -/
  shares : List (Nat × Nat)

def find (ds : List RoleData) (r : RoleRef) : Option RoleData := ds.find? (·.ref == r)

def OWNER : Nat := 1

def mkEnv (ds : List RoleData) : Env where
  owner := OWNER
  share o r := ((find ds r).bind fun d => d.shares.lookup o).getD 0
  supply r := ((find ds r).map (·.supply)).getD 0
  elapsed r := ((find ds r).map (·.elapsed)).getD 0

inductive Step where
  | call (op : Op)
  /-- the view `mintableAmount(owner, roles)` -/
  | query (owner : Nat) (roles : List RoleRef)

/-- Accounts whose state the final snapshot compares (the test has wallets 1..8). -/
def accounts : List Nat := List.range 9
def signers : List Nat := [1, 2, 3, 4, 5, 6]

/-! ## JSON -/

def jAcct (n : Nat) : String := toString n
def jRef (r : RoleRef) : String := jObj [("wearer", jAcct r.wearer), ("hatId", jNat r.hatId)]
def jRefs (rs : List RoleRef) : String := jArr (rs.map jRef)

def jRoleData (d : RoleData) : String :=
  jObj [("wearer", jAcct d.ref.wearer), ("hatId", jNat d.ref.hatId), ("supply", jNat d.supply),
    ("elapsed", jNat d.elapsed),
    ("shares", jArr (d.shares.map fun (a, b) => jObj [("account", jAcct a), ("balance", jNat b)]))]

def jStep : Step → String
  | .query o rs => jObj [("kind", jStr "mintableAmount"), ("owner", jAcct o), ("roles", jRefs rs)]
  | .call (.mint sender to amount rs) => jObj [("kind", jStr "mint"), ("sender", jAcct sender),
      ("to", jAcct to), ("amount", jNat amount), ("roles", jRefs rs)]
  | .call (.batchMint sender tos amounts rs) => jObj [("kind", jStr "batchMint"),
      ("sender", jAcct sender), ("to", jArr (tos.map jAcct)), ("amounts", jArr (amounts.map jNat)),
      ("roles", jRefs rs)]
  | .call (.mintFrom sender frm to value rs) => jObj [("kind", jStr "mintFrom"),
      ("sender", jAcct sender), ("from", jAcct frm), ("to", jAcct to), ("value", jNat value),
      ("roles", jRefs rs)]
  | .call (.approveMint sender spender value) => jObj [("kind", jStr "approveMint"),
      ("sender", jAcct sender), ("spender", jAcct spender), ("value", jNat value)]
  | .call (.permitMint sender p) => jObj [("kind", jStr "permitMint"), ("sender", jAcct sender),
      ("owner", jAcct p.owner), ("spender", jAcct p.spender), ("value", jNat p.value),
      ("nonce", jNat p.nonce), ("expired", jBool p.expired), ("signer", jAcct p.signer)]
  | .call (.transfer sender to amount) => jObj [("kind", jStr "transfer"),
      ("sender", jAcct sender), ("to", jAcct to), ("amount", jNat amount)]
  | .call (.setCoefficient sender account coef) => jObj [("kind", jStr "setAddressCoefficient"),
      ("sender", jAcct sender), ("account", jAcct account), ("coefficient", jNat coef)]

def errName : Err → String
  | .selfMint => "selfMint" | .zeroAmount => "zeroAmount" | .exceedsMintable => "exceedsMintable"
  | .lengthMismatch => "lengthMismatch" | .totalExceeds => "totalExceeds"
  | .mintToSpender => "mintToSpender" | .allowanceExceeded => "allowanceExceeded"
  | .invalidOwner => "invalidOwner" | .permitExpired => "permitExpired"
  | .invalidSignature => "invalidSignature" | .approveFromZero => "approveFromZero"
  | .approveToZero => "approveToZero" | .notOwner => "notOwner"
  | .invalidSender => "invalidSender" | .invalidReceiver => "invalidReceiver"
  | .insufficientBalance => "insufficientBalance" | .overflow => "overflow"

def jState (s : State) : List (String × String) :=
  [("totalSupply", jNat s.supply), ("participants", jArr (s.participants.map jAcct))]

/-- Run one step: the new state and its expected-result JSON. -/
def runStep (env : Env) (s : State) : Step → State × String
  | .query o rs => match U.mintable env s o rs with
    | .ok v => (s, jObj [("value", jNat v)])
    | .error e => (s, jObj [("revert", jStr (errName e))])
  | .call op => match stepU env s op with
    | .ok s' => (s', jObj ([("ok", jBool true)] ++ jState s'))
    | .error e => (s, jObj ([("revert", jStr (errName e))] ++ jState s))

def jFinal (s : State) : String :=
  jObj [
    ("accounts", jArr (accounts.map fun a => jObj [("account", jAcct a), ("balance", jNat (s.balance a)),
      ("minted", jNat (s.minted a)), ("coefficient", jNat (s.coef a)), ("nonce", jNat (s.nonce a))])),
    ("allowances", jArr (signers.flatMap fun o => signers.map fun sp =>
      jObj [("owner", jAcct o), ("spender", jAcct sp), ("value", jNat (s.allowance o sp))]))]

def jCase (name : String) (ds : List RoleData) (steps : List Step) : String :=
  let env := mkEnv ds
  let (s, outs) := steps.foldl (fun (s, outs) st =>
    let (s', out) := runStep env s st
    (s', outs ++ [jObj [("step", jStep st), ("expected", out)]])) (State.init, [])
  jObj [("name", jStr name), ("roles", jArr (ds.map jRoleData)), ("steps", jArr outs),
    ("final", jFinal s)]

/-! ## Hand-written scenarios -/

def R (w h : Nat) : RoleRef := ⟨w, h⟩
/-- 10 hours of wear (60 units of 10 minutes) and all of the share: a cap of 60 ether. -/
def full (w h : Nat) (holders : List (Nat × Nat) := [(w, 10000)]) : RoleData :=
  ⟨R w h, 10000, 36000, holders⟩

def mint (sender to amount : Nat) (rs : List RoleRef := []) : Step := .call (.mint sender to amount rs)
def batch (sender : Nat) (tos amounts : List Nat) (rs : List RoleRef := []) : Step :=
  .call (.batchMint sender tos amounts rs)
def mintFrom (sender frm to value : Nat) (rs : List RoleRef := []) : Step :=
  .call (.mintFrom sender frm to value rs)
def approve (sender spender value : Nat) : Step := .call (.approveMint sender spender value)
def permit (sender owner spender value nonce : Nat) (expired := false) (signer := owner) : Step :=
  .call (.permitMint sender ⟨owner, spender, value, nonce, expired, signer⟩)
def transfer (sender to amount : Nat) : Step := .call (.transfer sender to amount)
def setCoef (sender account coef : Nat) : Step := .call (.setCoefficient sender account coef)
def q (o : Nat) (rs : List RoleRef := []) : Step := .query o rs

/-- A role sum of `2^195` makes the cap `2^195 · 10^18`, about `2^254.8`. -/
def bigRole (w h : Nat) : RoleData := ⟨R w h, 1, 2 ^ 195 * UNIT, [(w, 1)]⟩
def bigCap : Nat := 2 ^ 195 * ONE

def edgeCases : List (String × List RoleData × List Step) := [
  ("mint up to the cap, then 10% of what was received", [full 2 1], [
    q 2 [R 2 1], q 2, mint 2 3 (60 * ether) [R 2 1], mint 2 3 1 [R 2 1], q 2 [R 2 1],
    q 3, mint 3 4 (6 * ether), mint 3 4 1, q 3]),
  ("reverts: self, zero amount, zero address", [full 2 1], [
    mint 2 2 1 [R 2 1], mint 2 3 0 [R 2 1], mint 2 0 1 [R 2 1], mint 2 3 1 [R 2 1]]),
  ("a role passed several times counts once", [full 2 1, full 2 2], [
    q 2 [R 2 1, R 2 1, R 2 1], q 2 [R 2 1, R 2 2, R 2 1], mint 2 3 (61 * ether) [R 2 1, R 2 1],
    mint 2 3 (120 * ether) [R 2 2, R 2 1, R 2 2], mint 2 3 1 [R 2 1, R 2 2]]),
  ("share fraction, 10-minute floor, skipped roles", [
      ⟨R 2 1, 10000, 599, [(2, 10000)]⟩, ⟨R 2 2, 10000, 1199, [(2, 3333), (3, 6667)]⟩,
      ⟨R 3 1, 0, 36000, [(2, 10000)]⟩, ⟨R 3 2, 10000, 36000, []⟩, ⟨R 4 4, 3, 7 * 3600, [(2, 2)]⟩], [
    q 2 [R 2 1], q 2 [R 2 2], q 3 [R 2 2], q 2 [R 3 1], q 2 [R 3 2], q 2 [R 4 4], q 2 [R 5 5],
    q 2 [R 2 1, R 2 2, R 3 1, R 3 2, R 4 4]]),
  ("address coefficient", [full 2 1], [
    setCoef 2 2 (2 * ether), setCoef 1 2 (2 * ether), q 2 [R 2 1], mint 2 3 (100 * ether) [R 2 1],
    setCoef 1 2 (ether / 2), q 2 [R 2 1], mint 2 3 1 [R 2 1], batch 2 [] [] [R 2 1],
    setCoef 1 2 1, q 2 [R 2 1], setCoef 1 2 0, q 2 [R 2 1], setCoef 1 2 (3 * ether / 2), q 2 [R 2 1]]),
  ("batchMint", [full 2 1], [
    batch 2 [3, 4] [ether] [R 2 1], batch 2 [3, 2, 4] [ether, ether, ether] [R 2 1],
    batch 2 [3, 4, 5] [ether, 0, ether] [R 2 1], batch 2 [3, 4] [30 * ether, 31 * ether] [R 2 1],
    batch 2 [3, 0] [ether, ether] [R 2 1], batch 2 [3, 4, 3] [ether, 2 * ether, 3 * ether] [R 2 1],
    batch 5 [] [] [], q 2 [R 2 1]]),
  ("mintFrom with an allowance", [full 2 1], [
    mintFrom 5 2 3 ether [R 2 1], approve 2 5 (10 * ether), mintFrom 5 2 2 ether [R 2 1],
    mintFrom 5 2 5 ether [R 2 1], mintFrom 5 2 3 0 [R 2 1], mintFrom 5 2 3 (11 * ether) [R 2 1],
    mintFrom 5 2 3 (4 * ether) [R 2 1], mintFrom 6 2 3 ether [R 2 1], mintFrom 5 2 3 (6 * ether),
    mintFrom 5 2 3 (6 * ether) [R 2 1], mintFrom 5 2 3 1 [R 2 1], approve 2 0 1]),
  ("infinite allowance is never spent down", [full 2 1], [
    approve 2 5 MAX, mintFrom 5 2 3 (50 * ether) [R 2 1], mintFrom 5 2 4 (11 * ether) [R 2 1],
    mintFrom 5 2 4 (10 * ether) [R 2 1], approve 2 5 0, mintFrom 5 2 3 1 [R 2 1]]),
  ("permitMint", [full 2 1], [
    permit 6 2 5 (3 * ether) 0, permit 6 2 5 (3 * ether) 0, permit 5 2 5 ether 1 (signer := 3),
    permit 5 2 5 ether 1 (expired := true), permit 5 0 5 ether 0, permit 5 2 5 ether 5,
    permit 5 2 0 ether 1, permit 4 2 5 (7 * ether) 1, mintFrom 5 2 3 (7 * ether) [R 2 1],
    permit 3 2 5 0 2, mintFrom 5 2 3 1 [R 2 1], permit 2 2 2 1 3, permit 2 3 4 ether 0]),
  ("transfer moves the 10% without adding participants", [full 2 1], [
    mint 2 3 (10 * ether) [R 2 1], transfer 3 7 (4 * ether), q 7, q 3, transfer 3 7 (7 * ether),
    transfer 3 0 1, transfer 3 3 ether, mint 3 4 (ether / 2), transfer 3 7 (6 * ether), q 3,
    mint 3 4 1, mint 7 3 (ether / 2)]),
  ("overflow: mintableAmount", [⟨R 2 1, 1, 2 ^ 250, [(2, 2 ^ 20)]⟩, bigRole 3 1,
      ⟨R 4 1, 1, (2 ^ 196) * UNIT, [(4, 1)]⟩], [
    q 2 [R 2 1], mint 2 3 1 [R 2 1], q 3 [R 3 1], mint 3 4 bigCap [R 3 1], q 4 [R 4 1],
    setCoef 1 3 (2 * ether), q 3 [R 3 1], setCoef 1 3 (64 * ether), q 3 [R 3 1]]),
  ("overflow: totalSupply and balance/10", [bigRole 2 1, bigRole 3 1, bigRole 5 1], [
    mint 2 4 bigCap [R 2 1], q 4, mint 3 4 bigCap [R 3 1], mint 3 4 (2 ^ 256 - 1 - bigCap) [R 3 1],
    q 4, q 4 [R 4 1], transfer 4 5 (2 ^ 254), q 5 [R 5 1], mint 5 6 1 [R 5 1]]),
  ("overflow: batchMint total comes before the cap check", [full 2 1], [
    batch 2 [3, 4] [2 ^ 255, 2 ^ 255] [R 2 1], batch 2 [3, 4, 2] [2 ^ 255, 2 ^ 255, 1] [R 2 1],
    batch 2 [3, 2] [2 ^ 255, 1] [R 2 1], batch 2 [3, 4] [2 ^ 255, 2 ^ 254] [R 2 1]])
]

/-! ## Seeded pseudo-random traces -/

def genAcct : Gen Nat := do if ← chance 3 then pure 0 else pick signers
def genOther (a : Nat) : Gen Nat := do
  if ← chance 8 then pure a else
  let b ← genAcct
  pure (if b = a then (if a = 6 then 1 else a + 1) else b)

def genRoleData (ref : RoleRef) : Gen RoleData := do
  let supply ← if ← chance 4 then pure 0 else maybeHuge 3 (pick [10000, 10000, 3, ← rand 20000])
  let elapsed ← maybeHuge 4 do
    match ← rand 4 with
    | 0 => rand UNIT
    | 1 => pure (36000 + (← rand 1000))
    | _ => rand 10000000
  let holders := (← (signers.filterM fun _ => chance 50))
  let shares ← holders.mapM fun a => do
    pure (a, ← maybeHuge 3 (pick [10000, 5000, 1, ← rand 10001]))
  pure ⟨ref, supply, elapsed, shares⟩

def genEnv : Gen (List RoleData) := do
  let n := 1 + (← rand 3)
  let mut refs : List RoleRef := []
  for _ in [0:n] do
    let r := R (1 + (← rand 8)) (1 + (← rand 3))
    unless refs.contains r do refs := refs ++ [r]
  refs.mapM genRoleData

/-- Roles to pass for `o`: mostly the ones `o` holds a share of, sometimes repeated. -/
def genRoles (ds : List RoleData) (o : Nat) : Gen (List RoleRef) := do
  let own := (ds.filter fun d => (d.shares.lookup o).getD 0 > 0).map (·.ref)
  let refs := if own ≠ [] ∧ (← chance 75) then own else ds.map (·.ref)
  let mut out := []
  for _ in [0:1 + (← rand 3)] do
    out := out ++ [← if ← chance 10 then pure (R 8 9) else pick refs]
  pure out

def genAmount (cap : Nat) : Gen Nat := do
  match ← rand 12 with
  | 0 | 1 => pure cap
  | 2 => pure (cap + 1)
  | 3 => pure 0
  | 4 => pure 1
  | 5 => maybeHuge 50 (pure ether)
  | _ => pure (1 + (← rand cap))

/-- Accounts holding a share of some role, so that they can mint. -/
def holders (ds : List RoleData) : List Nat :=
  (ds.flatMap fun d => (d.shares.filter (·.2 > 0)).map (·.1)).eraseDups

def genMinter (ds : List RoleData) : Gen Nat := do
  let hs := holders ds
  if hs ≠ [] ∧ (← chance 70) then pick hs else pick signers

def genCoef : Gen Nat := do
  maybeHuge 3 (pick [0, ONE, 2 * ONE, ONE / 2, 1, 3 * ONE / 2, ← rand (3 * ONE)])

def genStep (ds : List RoleData) (s : State) : Gen Step := do
  let env := mkEnv ds
  let capOf (o : Nat) (rs : List RoleRef) : Nat :=
    match U.mintable env s o rs with | .ok v => v | .error _ => ether
  let k ← rand 100
  if k < 28 then
    let sender ← genMinter ds
    let rs ← genRoles ds sender
    pure (mint sender (← genOther sender) (← genAmount (capOf sender rs)) rs)
  else if k < 38 then
    let sender ← genMinter ds
    let rs ← genRoles ds sender
    let n ← rand 4
    let tos ← (List.range n).mapM fun _ => genOther sender
    let cap := capOf sender rs
    let amounts ← (List.range (if ← chance 5 then n + 1 else n)).mapM fun _ => do
      genAmount (cap / (n + 1))
    pure (batch sender tos amounts rs)
  else if k < 52 then
    let granted := signers.flatMap fun o => (signers.filter (s.allowance o · > 0)).map (o, ·)
    let (frm, sender) ← if granted ≠ [] ∧ (← chance 75) then pick granted
      else pure (← if ← chance 80 then genMinter ds else genAcct, ← pick signers)
    let rs ← genRoles ds frm
    let cap := min (capOf frm rs) (s.allowance frm sender)
    pure (mintFrom sender frm (← genOther frm) (← genAmount cap) rs)
  else if k < 60 then
    let sender ← genMinter ds
    let v ← maybeHuge 5 (pick [0, ether, 10 * ether, MAX, ← rand (100 * ether)])
    pure (approve sender (← genOther sender) v)
  else if k < 70 then
    let owner ← genAcct
    let n := s.nonce owner
    let nonce ← if ← chance 75 then pure n else pick [n + 1, n - 1, n + 2]
    let v ← pick [0, ether, 10 * ether, MAX, ← rand (100 * ether)]
    let signer ← if ← chance 85 then pure (if owner = 0 then 1 else owner) else pick signers
    pure (permit (← pick signers) owner (← genOther owner) v nonce (← chance 10) signer)
  else if k < 80 then
    let sender ← pick signers
    let b := s.balance sender
    pure (transfer sender (← genOther sender) (← pick [b, b + 1, 0, ← rand (b + 1)]))
  else if k < 86 then
    pure (setCoef (← if ← chance 80 then pure OWNER else pick signers) (← pick signers) (← genCoef))
  else
    let o ← genAcct
    pure (q o (← genRoles ds o))

def genCase : Gen (List RoleData × List Step) := do
  let ds ← genEnv
  let env := mkEnv ds
  let mut s := State.init
  let mut steps := []
  for _ in [0:(12 + (← rand 10))] do
    let st ← genStep ds s
    s := (runStep env s st).1
    steps := steps ++ [st]
  pure (ds, steps)

def randomCount : Nat := 40
def seed : Nat := 628

def randomCases : List (String × List RoleData × List Step) :=
  ((List.range randomCount).mapM fun k => do pure (s!"random #{k}", ← genCase)).run' seed

def json : String :=
  let cases := (edgeCases ++ randomCases).map fun (n, ds, steps) => jCase n ds steps
  jObj [
    ("generatedBy", jStr "pkgs/spec: lake exe gen-vectors thanks-token (do not edit by hand)"),
    ("owner", jAcct OWNER),
    ("cases", "[\n" ++ ",\n".intercalate cases ++ "\n]")]

end Vectors.ThanksToken
