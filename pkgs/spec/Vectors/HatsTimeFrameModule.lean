/-
Test vectors for HatsTimeFrameModule: runs the uint256 model (`Spec/HatsTimeFrameModule/Contract.lean`)
on hand-written call sequences plus seeded pseudo-random ones.

  pnpm spec vectors   (→ vectors/hats-time-frame-module.json)

pkgs/contract/test/HatsTimeFrameModule.Differential.ts replays every case
against the Solidity contract. Each case is a sequence of steps; a step is a
call (or just a read, `op: null`) at a block timestamp. After every step the
test compares the revert reason (or success) and, for every account, the four
storage values and `getWearingElapsedTime` with what the model expects.

Accounts are small numbers: `0` is `address(0)`, `k ≥ 1` is the test's k-th
signer. Block timestamps start at `T0` and strictly increase within a case.
-/
import Vectors.Common
import Spec.HatsTimeFrameModule.Contract

open Spec.HatsTimeFrameModule Vectors

namespace Vectors.HatsTimeFrameModule

def jNum (n : Nat) : String := toString n
def jNull : String := "null"

/-- First block timestamp of every case (2096-10-02); later than any chain the tests run on. -/
def T0 : Nat := 4000000000
def T (k : Nat) : Nat := T0 + k

/-- The accounts whose storage is compared after each step. -/
def accounts : List Addr := [1, 2, 3, 4]

abbrev Steps := List (Nat × Option Op)

/-! ## JSON output -/

def errMsg : Err → String
  | .notAuthorized => "Not authorized"
  | .alreadyInactive => "Hat is already inactive"
  | .alreadyActive => "Hat is already active"
  | .alreadyMinted => "Hat already minted"
  | .emptyWearers => "Empty wearers array"
  | .lengthMismatch => "Array length mismatch"
  | .batchTooLarge => "Batch size too large"
  | .invalidWearer => "Invalid wearer address"
  | .invalidWoreTime => "Invalid wore time"
  | .underflow | .overflow => "panic 0x11"

def jOp : Option Op → String
  | none => jNull
  | some (.mintHat c w t) =>
    jObj [("kind", jStr "mintHat"), ("caller", jNum c), ("wearer", jNum w), ("time", jNat t)]
  | some (.batchMintHat c ws ts) =>
    jObj [("kind", jStr "batchMintHat"), ("caller", jNum c), ("wearers", jArr (ws.map jNum)),
      ("times", jArr (ts.map jNat))]
  | some (.deactivate c w) => jObj [("kind", jStr "deactivate"), ("caller", jNum c), ("wearer", jNum w)]
  | some (.reactivate c w) => jObj [("kind", jStr "reactivate"), ("caller", jNum c), ("wearer", jNum w)]
  | some (.renounce c w) => jObj [("kind", jStr "renounce"), ("caller", jNum c), ("wearer", jNum w)]

def jSlot (s : State) (now a : Nat) : String :=
  let x := s a
  jObj [("account", jNum a), ("woreTime", jNat x.woreTime), ("deactivatedTime", jNat x.deactivatedTime),
    ("totalActiveTime", jNat x.totalActiveTime), ("isActive", jBool x.isActive),
    ("elapsed", match getWearingElapsedTimeU s now a with
      | .ok v => jObj [("value", jNat v)]
      | .error e => jObj [("revert", jStr (errMsg e))])]

/-- Runs the steps from empty storage; a reverted call leaves the state as it was. -/
def runSteps (e : Env) (steps : Steps) : List String :=
  (steps.foldl (fun (s, out) (now, op?) =>
    let (s', revert) := match op? with
      | none => (s, jNull)
      | some op => match stepU e s now op with
        | .ok s' => (s', jNull)
        | .error err => (s, jStr (errMsg err))
    (s', out ++ [jObj [("time", jNat now), ("op", jOp op?), ("revert", revert),
      ("slots", jArr (accounts.map (jSlot s' now)))]])) (State.empty, [])).2

def jCase (name : String) (e : Env) (steps : Steps) : String :=
  jObj [("name", jStr name),
    ("env", jObj [("admins", jArr (e.admins.map jNum)), ("minters", jArr (e.minters.map jNum))]),
    ("steps", jArr (runSteps e steps))]

/-! ## Hand-written cases -/

/-- Account 1 is an admin of the minter hat, account 2 wears it; 3 and 4 are plain wearers. -/
def base : Env := ⟨[1], [2]⟩

def mint (c w : Nat) (t : Nat := 0) : Option Op := some (.mintHat c w t)
def batch (c : Nat) (ws ts : List Nat) : Option Op := some (.batchMintHat c ws ts)
def deact (c w : Nat) : Option Op := some (.deactivate c w)
def react (c w : Nat) : Option Op := some (.reactivate c w)
def renounce (c w : Nat) : Option Op := some (.renounce c w)
def read : Option Op := none

def edgeCases : List (String × Env × Steps) := [
  ("mint, pause, resume", base,
    [(T 0, mint 1 3), (T 100, read), (T 200, deact 3 3), (T 250, read), (T 300, react 3 3), (T 400, read)]),
  ("mint by the minter hat's wearer", base, [(T 0, mint 2 3), (T 10, read)]),
  ("mint with a past time counts from that time", base,
    [(T 10000, mint 1 3 (T 5000)), (T 10001, read), (T 10100, deact 1 3)]),
  ("mint at time 1", base, [(T 0, mint 1 3 1), (T 1, read), (T 2, deact 3 3)]),
  ("mint with a future time: reverts until it comes", base,
    [(T 0, mint 1 3 (T 100)), (T 50, read), (T 60, deact 3 3), (T 99, read), (T 100, read),
     (T 101, read), (T 150, deact 3 3), (T 160, read)]),
  ("deactivate exactly at the future start time", base,
    [(T 0, mint 1 3 (T 100)), (T 100, deact 3 3), (T 200, read)]),
  ("mint with the largest uint256 time", base,
    [(T 0, mint 1 3 (WORD - 1)), (T 10, read), (T 20, deact 3 3), (T 30, react 3 3),
     (T 40, renounce 3 3), (T 50, mint 1 3), (T 60, read)]),
  ("unauthorized mint", base, [(T 0, mint 3 3), (T 1, mint 4 3), (T 2, read)]),
  ("mint twice", base, [(T 0, mint 1 3), (T 1, mint 1 3)]),
  ("mint again after deactivate is refused", base, [(T 0, mint 1 3), (T 10, deact 3 3), (T 20, mint 1 3)]),
  ("renounce resets, mint starts over", base,
    [(T 0, mint 1 3), (T 100, renounce 3 3), (T 150, read), (T 200, mint 1 3), (T 260, read)]),
  ("renounce while paused", base, [(T 0, mint 1 3), (T 50, deact 3 3), (T 60, renounce 1 3), (T 70, read)]),
  ("deactivate twice", base, [(T 0, mint 1 3), (T 10, deact 3 3), (T 20, deact 3 3)]),
  ("reactivate while active", base, [(T 0, mint 1 3), (T 10, react 3 3)]),
  ("another wearer cannot deactivate, reactivate or renounce", base,
    [(T 0, mint 1 3), (T 10, deact 4 3), (T 20, deact 3 3), (T 30, react 4 3), (T 40, renounce 4 3),
     (T 50, read)]),
  ("admin and minter can deactivate, reactivate and renounce", base,
    [(T 0, mint 1 3), (T 10, deact 1 3), (T 20, react 2 3), (T 30, deact 2 3), (T 40, react 1 3),
     (T 50, renounce 2 3)]),
  ("deactivate a never-minted wearer", base, [(T 0, deact 3 3), (T 1, deact 1 3)]),
  ("reactivate a never-minted wearer counts time", base,
    [(T 0, react 3 3), (T 100, read), (T 110, mint 1 3), (T 120, deact 3 3)]),
  ("renounce a never-minted wearer", base, [(T 0, renounce 3 3), (T 1, mint 1 3), (T 2, read)]),
  ("many pauses", base,
    [(T 0, mint 1 3), (T 1, deact 3 3), (T 2, react 3 3), (T 1000, deact 3 3), (T 1001, react 3 3),
     (T 5000, read), (T 5001, deact 1 3), (T 9000, read)]),
  ("no authority at all", ⟨[], []⟩,
    [(T 0, mint 1 3), (T 1, batch 1 [3] [0]), (T 2, react 3 3), (T 3, deact 3 3), (T 4, renounce 1 3)]),
  ("an account both admin and minter", ⟨[1], [1]⟩, [(T 0, mint 1 3), (T 1, mint 2 4)]),
  ("wearers are independent", base,
    [(T 0, mint 1 3), (T 10, mint 1 4 (T 5)), (T 20, deact 3 3), (T 30, read), (T 40, renounce 4 4),
     (T 50, read)]),
  ("the minter can mint itself", base, [(T 0, mint 2 2), (T 10, deact 2 2), (T 20, read)]),
  -- batchMintHat
  ("batch: mixed times", base,
    [(T 1000, batch 1 [3, 4, 2] [0, T 500, T 2000]), (T 1500, read), (T 2500, read)]),
  ("batch: not authorized", base, [(T 0, batch 3 [3] [0])]),
  ("batch: authority is checked first", ⟨[], []⟩, [(T 0, batch 1 [] [])]),
  ("batch: empty", base, [(T 0, batch 1 [] [])]),
  ("batch: empty is checked before lengths", base, [(T 0, batch 1 [] [0])]),
  ("batch: length mismatch", base, [(T 0, batch 1 [3, 4] [0])]),
  ("batch: length is checked before size", base,
    [(T 0, batch 1 (List.replicate 101 3) [0])]),
  ("batch: 101 wearers", base, [(T 0, batch 1 (List.replicate 101 3) (List.replicate 101 0))]),
  ("batch: 100 wearers pass the size check", base,
    [(T 0, batch 1 (List.replicate 100 3) (List.replicate 100 0)), (T 1, read)]),
  ("batch: zero address", base, [(T 0, batch 1 [3, 0] [0, 0]), (T 1, read)]),
  ("batch: already minted", base, [(T 0, mint 1 3), (T 1, batch 1 [4, 3] [0, 0]), (T 2, read)]),
  ("batch: wearers are checked in order", base,
    [(T 0, mint 1 3), (T 1, batch 1 [3, 0] [0, 0]), (T 2, batch 1 [0, 3] [0, 0])]),
  ("batch: duplicate wearer", base, [(T 0, batch 1 [3, 3] [0, 0]), (T 1, read)]),
  ("batch: future and largest times", base,
    [(T 0, batch 2 [3, 4] [T 50, WORD - 1]), (T 10, read), (T 60, read), (T 70, deact 3 3)])
]

/-! ## Seeded pseudo-random cases -/

def genAcct : Gen Nat := do pure (1 + (← rand accounts.length))

def genEnv : Gen Env := do
  let admins ← accounts.filterM fun _ => chance 30
  let minters ← accounts.filterM fun _ => chance 30
  pure ⟨admins, minters⟩

/-- Mostly the wearer itself or someone with authority, so calls often succeed. -/
def genCaller (e : Env) (w : Nat) : Gen Nat := do
  let r ← rand 10
  let auth := e.admins ++ e.minters
  if r < 4 then pure w
  else if r < 7 && !auth.isEmpty then pick auth
  else genAcct

/-- `mintHat`'s `time`: mostly 0 (now), sometimes past, future, 1 or the largest uint256. -/
def genTime (now : Nat) : Gen Nat := do
  let r ← rand 20
  if r = 0 then pure 1
  else if r = 1 then pure (WORD - 1)
  else if r < 4 then pure (now + 1 + (← rand 1000))
  else if r < 9 then pure (now - (← rand 100000))
  else pure 0

def genGap : Gen Nat := do
  let r ← rand 4
  if r = 0 then pure 1
  else if r = 1 then pure (1 + (← rand 100))
  else if r = 2 then pure (1 + (← rand 100000))
  else pure (1 + (← rand 10000000))

/-- Calls mostly target account 3, so one wearer goes through long call sequences. -/
def genOp (e : Env) (now : Nat) : Gen (Option Op) := do
  let w ← if ← chance 60 then pure 3 else genAcct
  let c ← genCaller e w
  let r ← rand 20
  if r < 6 then pure (some (.mintHat c w (← genTime now)))
  else if r < 8 then
    let n ← rand 4
    let ws ← (List.range n).mapM fun _ => do if ← chance 5 then pure 0 else genAcct
    let m := if ← chance 10 then n + 1 else n
    let ts ← (List.range m).mapM fun _ => genTime now
    pure (some (.batchMintHat c ws ts))
  else if r < 12 then pure (some (.deactivate c w))
  else if r < 16 then pure (some (.reactivate c w))
  else if r < 18 then pure (some (.renounce c w))
  else pure none

def genCase : Gen (Env × Steps) := do
  let e ← genEnv
  let n := 6 + (← rand 13)
  let mut now := T0
  let mut steps : Steps := []
  for _ in [0:n] do
    now := now + (← genGap)
    steps := steps ++ [(now, ← genOp e now)]
  pure (e, steps)

def randomCount : Nat := 100
def seed : Nat := 629

def randomCases : List (String × Env × Steps) :=
  ((List.range randomCount).mapM fun k => do
    let (e, steps) ← genCase
    pure (s!"random #{k}", e, steps)).run' seed

def json : String :=
  let cases := (edgeCases ++ randomCases).map fun (n, e, steps) => jCase n e steps
  jObj [
    ("generatedBy", jStr "pkgs/spec: lake exe gen-vectors (do not edit by hand)"),
    ("t0", jNat T0),
    ("cases", "[\n" ++ ",\n".intercalate cases ++ "\n]")]

end Vectors.HatsTimeFrameModule
