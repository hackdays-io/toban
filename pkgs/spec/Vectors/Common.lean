/-
Shared helpers for the test vector generators: JSON output and a seeded
pseudo-random generator (deterministic: same seed, same vectors).
-/
namespace Vectors

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

abbrev Gen := StateM Nat

/-- 64-bit LCG (Knuth MMIX constants); upper bits as output. -/
def rand (n : Nat) : Gen Nat := do
  let s := ((← get) * 6364136223846793005 + 1442695040888963407) % 2 ^ 64
  set s
  pure (if n = 0 then 0 else (s >>> 33) % n)

def chance (percent : Nat) : Gen Bool := return (← rand 100) < percent

def pick {α : Type} [Inhabited α] (xs : List α) : Gen α := return xs[← rand xs.length]!

/-- Occasionally a value big enough to overflow somewhere (still < 2^256). -/
def huge : Gen Nat := do pure (2 ^ (150 + (← rand 106)) + (← rand 1000))

def maybeHuge (percent : Nat) (g : Gen Nat) : Gen Nat := do
  if ← chance percent then huge else g

/-- `1 ether` in wei. -/
def ether : Nat := 1000000000000000000

end Vectors
