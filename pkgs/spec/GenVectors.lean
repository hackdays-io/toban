/-
Test vector generator: runs the Lean model on hand-written edge cases plus
seeded pseudo-random inputs and prints JSON to stdout.

  lake exe gen-vectors > vectors/splits-creator.json

pkgs/contract/test/SplitsCreator.Differential.ts replays every case against
the Solidity contract. Numbers are decimal strings (they exceed 2^53).
-/
import Spec.SplitsCreator.Contract

open Spec.SplitsCreator

/-! ## JSON output -/

def jStr (s : String) : String := "\"" ++ s ++ "\""
def jNat (n : Nat) : String := jStr (toString n)
def jBool (b : Bool) : String := if b then "true" else "false"
def jArr (xs : List String) : String := "[" ++ ",".intercalate xs ++ "]"
def jObj (kvs : List (String × String)) : String :=
  "{" ++ ",".intercalate (kvs.map fun (k, v) => jStr k ++ ":" ++ v) ++ "}"

def jAddr (n : Nat) : String :=
  let ds := Nat.toDigits 16 n
  jStr ("0x" ++ String.ofList (List.replicate (40 - ds.length) '0' ++ ds))

def jHolder (h : Holder) : String :=
  jObj [("addr", jAddr h.addr), ("balance", jNat h.balance), ("escrow", jNat h.escrow)]

def jWearer (w : Wearer) : String :=
  jObj [("self", jHolder w.self), ("elapsed", jNat w.elapsed), ("supply", jNat w.supply),
    ("others", jArr (w.others.map jHolder))]

def jRole (r : Role) : String :=
  jObj [("hatId", jNat r.hatId), ("multiplierTop", jNat r.multiplierTop),
    ("multiplierBottom", jNat r.multiplierBottom), ("wearers", jArr (r.wearers.map jWearer))]

def jInput (i : Input) : String :=
  jObj [
    ("modules", jObj [("timeFrame", jBool i.modules.timeFrame), ("quest", jBool i.modules.quest)]),
    ("weights", jObj [("roleWeight", jNat i.weights.role), ("thanksTokenWeight", jNat i.weights.thanks),
      ("thanksTokenReceivedWeight", jNat i.weights.received),
      ("thanksTokenSentWeight", jNat i.weights.sent)]),
    ("participants", jArr (i.participants.map fun p =>
      jObj [("addr", jAddr p.addr), ("balance", jNat p.balance), ("minted", jNat p.minted)])),
    ("roles", jArr (i.roles.map jRole))]

/-- Expected result of the uint256 model: the output, or which panic it reverts with. -/
def jOutput : EVM Output → String
  | .error .overflow => jObj [("revert", jStr "overflow")]
  | .error .divZero => jObj [("revert", jStr "divZero")]
  | .ok o => jObj [("recipients", jArr (o.recipients.map jAddr)),
      ("allocations", jArr (o.allocations.map jNat)), ("totalAllocation", jNat o.totalAllocation)]

def jCase (name : String) (i : Input) : String :=
  jObj [("name", jStr name), ("input", jInput i), ("expected", jOutput (previewU i))]

/-! ## Hand-written cases -/

def A (k : Nat) : Nat := 0xA000 + k
/-- The largest `x` with `x * PRECISION < 2^256`. -/
def maxFit : Nat := (WORD - 1) / PRECISION
def ether : Nat := 1000000000000000000

def holder (k b : Nat) (e : Nat := 0) : Holder := ⟨A k, b, e⟩
def wearer (k b elapsed : Nat) (supply : Nat := 10000) (others : List Holder := []) (e : Nat := 0) :
    Wearer := ⟨holder k b e, elapsed, supply, others⟩
def role (hat top bottom : Nat) (ws : List Wearer) : Role := ⟨hat, top, bottom, ws⟩

def both : Modules := ⟨true, true⟩
def baseRoles : List Role :=
  [role 1 1 1 [wearer 1 10000 2592000, wearer 2 6000 86400 10000 [holder 3 4000]],
   role 2 2 1 [wearer 4 10000 604800]]
def baseParticipants : List Participant :=
  [⟨A 1, 3 * ether, 1 * ether⟩, ⟨A 5, 1 * ether, 5 * ether⟩, ⟨A 6, 0, 2 * ether⟩]

def edgeCases : List (String × Input) := [
  ("both sides", ⟨both, ⟨60, 40, 1, 1⟩, baseParticipants, baseRoles⟩),
  ("role weight only", ⟨both, ⟨1, 0, 1, 1⟩, baseParticipants, baseRoles⟩),
  ("thanks weight only", ⟨both, ⟨0, 1, 1, 1⟩, baseParticipants, baseRoles⟩),
  ("all weights zero", ⟨both, ⟨0, 0, 1, 1⟩, baseParticipants, baseRoles⟩),
  ("no participants", ⟨both, ⟨50, 50, 1, 1⟩, [], baseRoles⟩),
  ("nothing minted yet", ⟨both, ⟨50, 50, 1, 1⟩, [⟨A 1, ether, 0⟩, ⟨A 2, ether, 0⟩], baseRoles⟩),
  ("received only", ⟨both, ⟨50, 50, 1, 0⟩, baseParticipants, baseRoles⟩),
  ("sent only", ⟨both, ⟨50, 50, 0, 1⟩, baseParticipants, baseRoles⟩),
  ("revert: received+sent weight zero", ⟨both, ⟨50, 50, 0, 0⟩, baseParticipants, baseRoles⟩),
  ("revert: received+sent zero even with thanks weight zero",
    ⟨both, ⟨1, 0, 0, 0⟩, baseParticipants, baseRoles⟩),
  ("received+sent zero is fine when nobody holds tokens",
    ⟨both, ⟨1, 0, 0, 0⟩, [], baseRoles⟩),
  ("revert: multiplierBottom zero", ⟨both, ⟨1, 1, 1, 1⟩, baseParticipants,
    baseRoles ++ [role 3 1 0 [wearer 7 10000 100]]⟩),
  ("revert: multiplierBottom zero without wearers", ⟨both, ⟨1, 1, 1, 1⟩, baseParticipants,
    baseRoles ++ [role 3 1 0 []]⟩),
  ("revert: role supply zero", ⟨both, ⟨1, 1, 1, 1⟩, baseParticipants,
    [role 1 1 1 [wearer 1 0 100 0]]⟩),
  ("role without wearers", ⟨both, ⟨1, 1, 1, 1⟩, baseParticipants, baseRoles ++ [role 3 1 1 []]⟩),
  ("multiplier 1/2 floors to 0", ⟨both, ⟨1, 1, 1, 1⟩, baseParticipants,
    [role 1 1 2 [wearer 1 10000 100], role 2 3 2 [wearer 2 10000 100]]⟩),
  ("only zero multipliers", ⟨both, ⟨1, 1, 1, 1⟩, baseParticipants, [role 1 1 2 [wearer 1 10000 100]]⟩),
  ("sqrt boundaries", ⟨both, ⟨1, 0, 1, 1⟩, [], [role 1 1 1
    ([0, 1, 2, 3, 4, 8, 9, 15, 16, 17, 99, 100, 101, 1000000, 999999999999, 1000000000000].zipIdx.map
      fun (t, k) => wearer (10 + k) 10000 t)]⟩),
  ("no time frame module", ⟨⟨false, true⟩, ⟨1, 1, 1, 1⟩, baseParticipants, baseRoles⟩),
  ("no quest module", ⟨⟨true, false⟩, ⟨1, 1, 1, 1⟩, baseParticipants,
    [role 1 1 1 [wearer 1 6000 400 10000 [holder 2 4000 500] 300]]⟩),
  ("quest escrow credited", ⟨both, ⟨1, 1, 1, 1⟩, baseParticipants,
    [role 1 1 1 [wearer 1 6000 400 10000 [holder 2 3000 1000] 0]]⟩),
  ("same account in several roles and in thanks", ⟨both, ⟨1, 1, 1, 1⟩, baseParticipants,
    [role 1 1 1 [wearer 1 10000 100], role 2 1 1 [wearer 1 10000 400, wearer 2 10000 900]]⟩),
  ("large balances", ⟨both, ⟨100, 100, 7, 3⟩,
    [⟨A 1, 1000000 * ether, 999999 * ether⟩, ⟨A 2, 1, 1⟩], baseRoles⟩),
  -- uint256 overflow (Panic 0x11)
  ("overflow: thanks balances sum past 2^256", ⟨both, ⟨1, 1, 1, 1⟩,
    [⟨A 1, 2 ^ 255, ether⟩, ⟨A 2, 2 ^ 255, ether⟩], baseRoles⟩),
  ("overflow: received weight × balance", ⟨both, ⟨1, 1, 2 ^ 200, 1⟩, baseParticipants, baseRoles⟩),
  ("largest received weight that fits", ⟨both, ⟨0, 1, maxFit, 0⟩, [⟨A 1, 1, 1⟩], []⟩),
  ("one more overflows", ⟨both, ⟨0, 1, maxFit + 1, 0⟩, [⟨A 1, 1, 1⟩], []⟩),
  ("overflow: role multiplier × balance", ⟨both, ⟨1, 1, 1, 1⟩, baseParticipants,
    [role 1 (2 ^ 250) 1 [wearer 1 10000 100]]⟩),
  ("overflow: thanks weight + role weight", ⟨both, ⟨2 ^ 255, 2 ^ 255, 1, 1⟩,
    baseParticipants, baseRoles⟩),
  ("overflow: quest escrow added to balance", ⟨both, ⟨1, 1, 1, 1⟩, baseParticipants,
    [role 1 1 1 [wearer 1 (2 ^ 255) 100 10000 [] (2 ^ 255)]]⟩),
  ("overflow: share supplies sum past 2^256", ⟨both, ⟨1, 1, 1, 1⟩, baseParticipants,
    [role 1 1 1 [wearer 1 10000 100 (2 ^ 255), wearer 2 10000 100 (2 ^ 255)]]⟩),
  ("overflow comes before division by zero", ⟨both, ⟨1, 1, 0, 0⟩,
    [⟨A 1, 2 ^ 255, ether⟩, ⟨A 2, 2 ^ 255, ether⟩], baseRoles⟩),
  ("division by zero comes before overflow", ⟨both, ⟨1, 1, 1, 1⟩, baseParticipants,
    [role 1 1 0 [wearer 1 10000 100], role 2 (2 ^ 250) 1 [wearer 2 10000 100]]⟩)
]

/-! ## Seeded pseudo-random cases -/

abbrev Gen := StateM Nat

/-- 64-bit LCG (Knuth MMIX constants); upper bits as output. -/
def rand (n : Nat) : Gen Nat := do
  let s := ((← get) * 6364136223846793005 + 1442695040888963407) % 2 ^ 64
  set s
  pure (if n = 0 then 0 else (s >>> 33) % n)

def chance (percent : Nat) : Gen Bool := return (← rand 100) < percent

def pick {α : Type} [Inhabited α] (xs : List α) : Gen α := return xs[← rand xs.length]!

def genElapsed : Gen Nat := do
  match ← rand 4 with
  | 0 => let r ← rand 3000; pure (r * r + (← pick [0, 1, 2 * r]))
  | 1 => rand 100
  | _ => rand 100000000

/-- `n` distinct addresses from a pool of 16, so accounts repeat across roles. -/
def genAddrs (n : Nat) (exclude : List Nat := []) : Gen (List Nat) := do
  let mut out := []
  for _ in [0:n] do
    let a := A (← rand 16)
    unless out.contains a || exclude.contains a do out := out ++ [a]
  pure out

/-- Occasionally a value big enough to overflow somewhere (still < 2^256). -/
def huge : Gen Nat := do pure (2 ^ (150 + (← rand 106)) + (← rand 1000))

def maybeHuge (percent : Nat) (g : Gen Nat) : Gen Nat := do
  if ← chance percent then huge else g

def genHolder (m : Modules) (addr : Nat) : Gen Holder := do
  let balance ← maybeHuge 2 do pick [0, 10000, ← rand 10001]
  let escrow ← if m.quest && (← chance 30) then rand 5000 else pure 0
  pure ⟨addr, balance, escrow⟩

def genWearer (m : Modules) (addr : Nat) : Gen Wearer := do
  let self ← genHolder m addr
  let others ← (← genAddrs (← rand 3) [addr]).mapM (genHolder m)
  let total := self.balance + (others.map Holder.balance).sum
  let supply ← if (← chance 3) then pure 0 else pick [10000, total, total + 1]
  pure ⟨self, ← genElapsed, supply, others⟩

def genRole (m : Modules) (hat : Nat) : Gen Role := do
  let bottom ← if (← chance 2) then pure 0 else pick [1, 1, 1, 2, 3]
  let top ← maybeHuge 2 do pick [1, 1, 2, 3, 5, ← rand 20]
  let ws ← (← genAddrs (← rand 4)).mapM (genWearer m)
  pure ⟨hat, top, bottom, ws⟩

def genParticipant (addr : Nat) : Gen Participant := do
  let amount : Gen Nat := maybeHuge 2 do
    pick [0, ether, (← rand 1000000) * 1000000000000, ← rand 1000]
  pure ⟨addr, ← amount, ← amount⟩

def genWeight : Gen Nat := maybeHuge 2 do pick [0, 1, ← rand 101, ← rand 101]

def genInput : Gen Input := do
  let m : Modules := ⟨← chance 80, ← chance 70⟩
  let w : Weights := ⟨← genWeight, ← genWeight, ← maybeHuge 2 (rand 11), ← maybeHuge 2 (rand 11)⟩
  let ps ← (← genAddrs (← rand 6)).mapM genParticipant
  let rs ← (List.range (← rand 4)).mapM fun k => do genRole m ((k + 1) * 1000 + (← rand 1000))
  pure ⟨m, w, ps, rs⟩

def randomCount : Nat := 150
def seed : Nat := 624

def randomCases : List (String × Input) :=
  ((List.range randomCount).mapM fun k => do pure (s!"random #{k}", ← genInput)).run' seed

def main : IO Unit := do
  let cases := (edgeCases ++ randomCases).map fun (n, i) => jCase n i
  IO.println (jObj [
    ("generatedBy", jStr "pkgs/spec: lake exe gen-vectors (do not edit by hand)"),
    ("precision", jNat PRECISION),
    ("cases", "[\n" ++ ",\n".intercalate cases ++ "\n]")])
