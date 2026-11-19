/-
HatsFractionTokenModule test vectors: sequences of transactions run through the
uint256 model (`Spec/HatsFractionTokenModule/Contract.lean`), hand-written
scenarios plus seeded pseudo-random ones (about 45% of the random transactions
move, burn or top up a balance someone actually holds).

pkgs/contract/test/HatsFractionTokenModule.Differential.ts replays every case
against a module clone whose Hats Protocol is a data mock set to `world`. Each
step must succeed or revert as the model says (custom error and arguments, or
panic code); at the end, every touched share's recipients, supplies, balances
and `balanceOf` / `totalSupply` views must match.
-/
import Vectors.Common
import Spec.HatsFractionTokenModule.Contract

open Vectors

namespace Vectors.HatsFractionTokenModule
open Spec.HatsFractionTokenModule

/-! ## JSON output

Accounts are indices: `0` is `address(0)`, `k ≥ 1` is the test's k-th wallet
(`viem.getWalletClients()[k - 1]`). Hat ids and amounts are decimal strings. -/

def jAcct (a : Addr) : String := toString a
def jShare (sh : Share) : String := jObj [("hat", jNat sh.1), ("wearer", jAcct sh.2)]

/-- Typed custom-error arguments, so the test can rebuild them. -/
def aAddr (a : Addr) : String := jObj [("addr", jAcct a)]
def aUint (n : Nat) : String := jObj [("uint", jNat n)]
def aId (sh : Share) : String := jObj [("id", jShare sh)]

def jRevert (name : String) (args : List String := []) : String :=
  jObj [("error", jStr name), ("args", jArr args)]

def jErr : Err → String
  | .overflow => jObj [("panic", jStr "0x11")]
  | .indexOutOfBounds => jObj [("panic", jStr "0x32")]
  | .invalidHatIdForDomain => jRevert "InvalidHatIdForDomain"
  | .callerNotHatAdminOrWearer => jRevert "CallerNotHatAdminOrWearer"
  | .wearerDoesNotHaveHat => jRevert "WearerDoesNotHaveHat"
  | .tokenAlreadyMinted => jRevert "TokenAlreadyMinted"
  | .initialSupplyNotMinted => jRevert "InitialSupplyNotMinted"
  | .cannotTransferAllTokens => jRevert "CannotTransferAllTokens"
  | .arrayLengthMismatch => jRevert "ArrayLengthMismatch"
  | .insufficientBalance a b n sh =>
    jRevert "ERC1155InsufficientBalance" [aAddr a, aUint b, aUint n, aId sh]
  | .missingApprovalForAll op owner => jRevert "ERC1155MissingApprovalForAll" [aAddr op, aAddr owner]
  | .invalidReceiver a => jRevert "ERC1155InvalidReceiver" [aAddr a]
  | .invalidSender a => jRevert "ERC1155InvalidSender" [aAddr a]
  | .invalidArrayLength i v => jRevert "ERC1155InvalidArrayLength" [aUint i, aUint v]
  | .invalidOperator a => jRevert "ERC1155InvalidOperator" [aAddr a]

def jOp : Op → String
  | .mintInitialSupply s h a v => jObj [("fn", jStr "mintInitialSupply"), ("sender", jAcct s),
      ("hat", jNat h), ("wearer", jAcct a), ("amount", jNat v)]
  | .batchMintInitialSupply s hs as vs => jObj [("fn", jStr "batchMintInitialSupply"),
      ("sender", jAcct s), ("hats", jArr (hs.map jNat)), ("wearers", jArr (as.map jAcct)),
      ("amounts", jArr (vs.map jNat))]
  | .mint s h a v => jObj [("fn", jStr "mint"), ("sender", jAcct s), ("hat", jNat h),
      ("wearer", jAcct a), ("amount", jNat v)]
  | .burn s h a t v => jObj [("fn", jStr "burn"), ("sender", jAcct s), ("hat", jNat h),
      ("wearer", jAcct a), ("target", jAcct t), ("amount", jNat v)]
  | .safeTransferFrom s f t id v => jObj [("fn", jStr "safeTransferFrom"), ("sender", jAcct s),
      ("from", jAcct f), ("to", jAcct t), ("id", jShare id), ("amount", jNat v)]
  | .safeBatchTransferFrom s f t ids vs => jObj [("fn", jStr "safeBatchTransferFrom"),
      ("sender", jAcct s), ("from", jAcct f), ("to", jAcct t), ("ids", jArr (ids.map jShare)),
      ("amounts", jArr (vs.map jNat))]
  | .setApprovalForAll s o b => jObj [("fn", jStr "setApprovalForAll"), ("sender", jAcct s),
      ("operator", jAcct o), ("approved", jBool b)]

def Op.shares : Op → List Share
  | .mintInitialSupply _ h a _ | .mint _ h a _ | .burn _ h a _ _ => [(h, a)]
  | .batchMintInitialSupply _ hs as _ => hs.zip as
  | .safeTransferFrom _ _ _ id _ => [id]
  | .safeBatchTransferFrom _ _ _ ids _ => ids
  | .setApprovalForAll .. => []

/-- Accounts `1..n` of the test. -/
def accounts (n : Nat) : List Addr := (List.range n).map (· + 1)

def jWorld (w : World) : String :=
  jObj [("domain", jNat w.domain), ("defaultTokenSupply", jNat w.default),
    ("wearers", jArr (w.wearers.map fun (a, h) => jObj [("account", jAcct a), ("hat", jNat h)])),
    ("admins", jArr (w.admins.map fun (a, h) => jObj [("account", jAcct a), ("hat", jNat h)]))]

/-- Every op with its expected outcome under the uint256 model, then the state
the whole sequence leaves for every share it touched. -/
def jCase (name : String) (n : Nat) (w : World) (ops : List Op) : String := Id.run do
  let mut s := State.init
  let mut steps := []
  for op in ops do
    match stepU w s op with
    | .ok s' => s := s'; steps := steps ++ [jObj [("op", jOp op), ("expected", jStr "ok")]]
    | .error e => steps := steps ++ [jObj [("op", jOp op), ("expected", jErr e)]]
  let shares := (ops.flatMap Op.shares).eraseDups
  let jFinal (sh : Share) := jObj [
    ("share", jShare sh),
    ("recipients", jArr ((s.recipients sh).map jAcct)),
    ("supply", jNat (s.supply sh)),
    ("balances", jArr ((accounts n).map fun a => jNat (s.bal sh a))),
    ("balanceOf", jArr ((accounts n).map fun a => jNat (balanceOf w s a sh.2 sh.1))),
    ("totalSupply", jNat (totalSupply w s sh.2 sh.1))]
  jObj [("name", jStr name), ("accounts", toString n), ("world", jWorld w),
    ("steps", jArr steps),
    ("final", jObj [("supplyAll", jNat s.supplyAll), ("shares", jArr (shares.map jFinal))])]

/-! ## Hand-written cases -/

def TOP : Hat := 2 ^ 224
/-- Two roles in the module's domain and one in another workspace's. -/
def H1 : Hat := TOP + 2 ^ 208
def H2 : Hat := TOP + 2 * 2 ^ 208
def FOREIGN : Hat := 2 * 2 ^ 224 + 2 ^ 208

/-- Account 1 administers both roles (like the top hat's wearer); 2 and 3 wear
H1, 3 and 4 wear H2. -/
def world (default : Nat := 10000) : World :=
  ⟨1, default, [(2, H1), (3, H1), (3, H2), (4, H2), (2, FOREIGN)], [(1, H1), (1, H2)]⟩

open Op in
def edgeCases : List (String × World × List Op) := [
  ("initial mint by the wearer, default supply", world,
    [mintInitialSupply 2 H1 2 0]),
  ("initial mint with an explicit amount, by the admin", world,
    [mintInitialSupply 1 H1 2 500]),
  ("revert: initial mint twice", world,
    [mintInitialSupply 2 H1 2 0, mintInitialSupply 2 H1 2 0]),
  ("revert: additional mint before the initial mint", world,
    [mint 1 H1 2 100]),
  ("additional mint by the admin and by the wearer", world,
    [mintInitialSupply 2 H1 2 0, mint 1 H1 2 5000, mint 2 H1 2 1]),
  ("revert: hat of another domain", world, [mintInitialSupply 2 FOREIGN 2 0]),
  ("revert: caller neither admin nor wearer", world, [mintInitialSupply 4 H1 2 0]),
  ("another wearer of the same role may mint for a wearer", world, [mintInitialSupply 3 H1 2 0]),
  ("revert: wearer does not wear the role", world, [mintInitialSupply 1 H1 4 0]),
  ("transfer part of a share, then back", world,
    [mintInitialSupply 2 H1 2 0, safeTransferFrom 2 2 3 (H1, 2) 4000,
     safeTransferFrom 3 3 2 (H1, 2) 1000]),
  ("revert: the wearer cannot transfer their whole balance", world,
    [mintInitialSupply 2 H1 2 0, safeTransferFrom 2 2 3 (H1, 2) 10000]),
  ("another holder can transfer their whole balance", world,
    [mintInitialSupply 2 H1 2 0, safeTransferFrom 2 2 3 (H1, 2) 4000,
     safeTransferFrom 3 3 4 (H1, 2) 4000]),
  ("revert: transfer more than the balance", world,
    [mintInitialSupply 2 H1 2 0, safeTransferFrom 2 2 3 (H1, 2) 10001]),
  ("transfer to oneself", world,
    [mintInitialSupply 2 H1 2 0, safeTransferFrom 2 2 2 (H1, 2) 3000]),
  ("revert: transfer to address(0)", world,
    [mintInitialSupply 2 H1 2 0, safeTransferFrom 2 2 0 (H1, 2) 1]),
  ("revert: transfer without approval", world,
    [mintInitialSupply 2 H1 2 0, safeTransferFrom 3 2 3 (H1, 2) 1]),
  ("approved operator transfers", world,
    [mintInitialSupply 2 H1 2 0, setApprovalForAll 2 3 true, safeTransferFrom 3 2 4 (H1, 2) 7]),
  ("revert: approving address(0)", world, [setApprovalForAll 2 0 true]),
  ("approval revoked", world,
    [mintInitialSupply 2 H1 2 0, setApprovalForAll 2 3 true, setApprovalForAll 2 3 false,
     safeTransferFrom 3 2 4 (H1, 2) 7]),
  ("burn by the admin from the wearer and from another holder", world,
    [mintInitialSupply 2 H1 2 0, safeTransferFrom 2 2 3 (H1, 2) 4000,
     burn 1 H1 2 2 1000, burn 1 H1 2 3 4000]),
  ("revert: burn more than the balance", world,
    [mintInitialSupply 2 H1 2 0, burn 1 H1 2 2 10001]),
  ("revert: burn from address(0)", world, [mintInitialSupply 2 H1 2 0, burn 1 H1 2 0 0]),
  ("revert: burn by a non-admin non-wearer", world,
    [mintInitialSupply 2 H1 2 0, burn 4 H1 2 2 1]),
  ("batch transfer of two shares", world,
    [mintInitialSupply 3 H1 3 0, mintInitialSupply 3 H2 3 0,
     safeBatchTransferFrom 3 3 2 [(H1, 3), (H2, 3)] [10, 20]]),
  ("revert: batch transfer of the wearer's whole balance", world,
    [mintInitialSupply 3 H1 3 0, safeBatchTransferFrom 3 3 2 [(H1, 3)] [10000]]),
  ("batch transfer with a repeated id empties the wearer's balance", world,
    [mintInitialSupply 3 H1 3 0, safeBatchTransferFrom 3 3 2 [(H1, 3), (H1, 3)] [9999, 1]]),
  ("revert: batch with fewer amounts than ids (wearer: index out of bounds)", world,
    [mintInitialSupply 3 H1 3 0, mintInitialSupply 3 H2 3 0,
     safeBatchTransferFrom 3 3 2 [(H1, 3), (H2, 3)] [10]]),
  ("revert: batch with fewer amounts than ids (not the first recipient)", world,
    [mintInitialSupply 3 H1 3 0, safeTransferFrom 3 3 2 (H1, 3) 100,
     safeBatchTransferFrom 2 2 4 [(H1, 3), (H1, 3)] [10]]),
  ("revert: batch with more amounts than ids", world,
    [mintInitialSupply 3 H1 3 0, safeBatchTransferFrom 3 3 2 [(H1, 3)] [10, 20]]),
  ("batch initial mint", world,
    [batchMintInitialSupply 1 [H1, H1, H2] [2, 3, 4] [0, 300, 0]]),
  ("revert: batch initial mint with mismatched arrays", world,
    [batchMintInitialSupply 1 [H1, H1] [2, 3] [0]]),
  ("revert: batch initial mint with one invalid wearer", world,
    [batchMintInitialSupply 1 [H1, H1] [2, 4] [0, 0]]),
  ("revert: batch initial mint of the same share twice", world,
    [batchMintInitialSupply 1 [H1, H1] [2, 2] [0, 0]]),
  -- Recipient-list behaviour that the shape assumption in SplitsCreator does not cover
  ("zero-amount transfer by anyone adds a recipient before the initial mint", world,
    [safeTransferFrom 4 4 1 (H1, 2) 0, mintInitialSupply 2 H1 2 0]),
  ("then the wearer is not first and can transfer everything", world,
    [safeTransferFrom 4 4 1 (H1, 2) 0, mintInitialSupply 2 H1 2 0,
     safeTransferFrom 2 2 3 (H1, 2) 10000]),
  ("zero-amount transfer to the wearer before the initial mint turns the views to 0", world,
    [safeTransferFrom 1 1 2 (H1, 2) 0]),
  ("burn to zero, then initial mint again: the wearer is listed twice", world,
    [mintInitialSupply 2 H1 2 0, burn 1 H1 2 2 10000, mintInitialSupply 2 H1 2 0]),
  ("default supply 0: initial mint mints nothing and can be repeated", world 0,
    [mintInitialSupply 2 H1 2 0, mintInitialSupply 2 H1 2 0, mint 1 H1 2 5]),
  ("default supply 1,000,000", world 1000000, [mintInitialSupply 2 H1 2 0]),
  ("another wearer of the role sees the default as their balance", world,
    [mintInitialSupply 2 H1 2 0, safeTransferFrom 2 2 4 (H1, 2) 10]),
  -- uint256 overflow (Panic 0x11)
  ("largest initial mint that fits", world, [mintInitialSupply 2 H1 2 (2 ^ 256 - 1)]),
  ("overflow: additional mint past 2^256", world,
    [mintInitialSupply 2 H1 2 (2 ^ 256 - 1), mint 2 H1 2 1]),
  ("overflow: total supply of all shares past 2^256", world,
    [mintInitialSupply 2 H1 2 (2 ^ 255), mintInitialSupply 3 H1 3 (2 ^ 255)]),
  ("total supply of all shares just fits", world,
    [mintInitialSupply 2 H1 2 (2 ^ 255), mintInitialSupply 3 H1 3 (2 ^ 255 - 1)]),
  ("overflow: batch initial mint past 2^256 reverts the whole batch", world,
    [batchMintInitialSupply 1 [H1, H2] [2, 3] [2 ^ 255, 2 ^ 255]])
]

/-! ## Seeded pseudo-random cases -/

def hats : List Hat := [H1, H2, FOREIGN]
/-- Mostly the module's own roles. -/
def genHat : Gen Hat := pick [H1, H1, H1, H2, H2, H2, FOREIGN]

def genWorld : Gen World := do
  let mut wearers := []
  for a in accounts 4 do
    for h in hats do
      if ← chance (if h = FOREIGN then 30 else 65) then wearers := wearers ++ [(a, h)]
  let mut admins := []
  for a in accounts 4 do
    for h in [H1, H2] do
      if ← chance (if a = 1 then 80 else 10) then admins := admins ++ [(a, h)]
  pure ⟨1, ← pick [10000, 10000, 0, 1, 1000000, ← rand 1000001], wearers, admins⟩

/-- One of the test's wallets 1..4. -/
def genWallet : Gen Addr := do pure ((← rand 4) + 1)
/-- A wallet, or occasionally address(0). -/
def genAcct : Gen Addr := do if ← chance 3 then pure 0 else genWallet
def genShare : Gen Share := do pure (← genHat, ← genWallet)

def genAmount : Gen Nat := do
  if ← chance 2 then return (2 ^ (200 + (← rand 57)) - (← rand 2))
  pick [0, 1, 10000, ← rand 3000, ← rand 3000, ← rand 10001, ← rand 20000, 9999]

/-- Every positive balance in `s`: (share, holder, balance). -/
def holdings (s : State) : List (Share × Addr × Nat) :=
  (hats.flatMap fun h => (accounts 4).map fun a => (h, a)).flatMap fun sh =>
    ((accounts 4).filter fun a => s.bal sh a > 0).map fun a => (sh, a, s.bal sh a)

/-- An amount near an actual balance `b`. -/
def amountFor (b : Nat) : Gen Nat := do pick [1, b / 2, b, b - 1, ← rand (b + 1), 0]

/-- Ops that move or burn what someone actually holds, so they mostly succeed. -/
def genInformedOp (s : State) : Gen (Option Op) := do
  let hs := holdings s
  if hs.isEmpty then return none
  let (sh, a, b) ← pick hs
  let sender ← if ← chance 85 then pure a else genWallet
  match ← rand 5 with
  | 0 => pure (some (.burn (← genWallet) sh.1 sh.2 a (← amountFor b)))
  | 1 => do
    let (sh', _, b') ← pick hs
    pure (some (.safeBatchTransferFrom sender a (← genAcct) [sh, sh']
      [← amountFor b, ← amountFor b']))
  | 2 => pure (some (.mint (← genWallet) sh.1 sh.2 (← pick [1, ← rand 5000])))
  | _ => pure (some (.safeTransferFrom sender a (← genAcct) sh (← amountFor b)))

def genOp (s : State) : Gen Op := do
  if ← chance 45 then
    if let some op ← genInformedOp s then return op
  match ← rand 12 with
  | 0 | 1 | 2 => pure (.mintInitialSupply (← genWallet) (← genHat) (← genWallet) (← genAmount))
  | 3 => do
    let k ← rand 4
    let hs ← (List.range k).mapM fun _ => genHat
    let as ← (List.range (if ← chance 10 then k + 1 else k)).mapM fun _ => genWallet
    let vs ← (List.range k).mapM fun _ => genAmount
    pure (.batchMintInitialSupply (← genWallet) hs as vs)
  | 4 => pure (.mint (← genWallet) (← genHat) (← genWallet) (← genAmount))
  | 5 => pure (.burn (← genWallet) (← genHat) (← genWallet) (← genAcct) (← genAmount))
  | 6 | 7 | 8 => do
    let src ← genWallet
    let sender ← if ← chance 85 then pure src else genWallet
    pure (.safeTransferFrom sender src (← genAcct) (← genShare) (← genAmount))
  | 9 | 10 => do
    let src ← genWallet
    let sender ← if ← chance 85 then pure src else genWallet
    let k ← rand 4
    let ids ← (List.range k).mapM fun _ => genShare
    let n ← if ← chance 10 then pick [k + 1, k - 1] else pure k
    let vs ← (List.range n).mapM fun _ => genAmount
    pure (.safeBatchTransferFrom sender src (← genAcct) ids vs)
  | _ => pure (.setApprovalForAll (← genWallet) (← genAcct) (← chance 70))

def randomCount : Nat := 120
def seed : Nat := 630

def randomCases : List (String × World × List Op) :=
  ((List.range randomCount).mapM fun k => do
    let w ← genWorld
    let mut s := State.init
    let mut ops := []
    for _ in [0:(← rand 12) + 3] do
      let op ← genOp s
      ops := ops ++ [op]
      if let .ok s' := stepU w s op then s := s'
    pure (s!"random #{k}", w, ops)).run' seed

def json : String :=
  let cases := (edgeCases ++ randomCases).map fun (n, w, ops) => jCase n 4 w ops
  jObj [
    ("generatedBy", jStr "pkgs/spec: lake exe gen-vectors hats-fraction-token-module (do not edit by hand)"),
    ("cases", "[\n" ++ ",\n".intercalate cases ++ "\n]")]

end Vectors.HatsFractionTokenModule
