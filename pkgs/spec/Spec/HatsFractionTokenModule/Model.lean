/-
Reference model of HatsFractionTokenModule
(pkgs/contract/contracts/hatsmodules/fractiontoken/HatsFractionTokenModule.sol)
together with the OpenZeppelin 5.3 ERC1155 / ERC1155Supply code it inherits.

State is what the contract stores: ERC1155 balances, `tokenRecipients`,
`ERC1155Supply` totals and `isApprovedForAll`. Every transaction is one `Op`;
`step add w s op` returns the new state, or the revert reason. Checks run in
the same order as in Solidity, so the reason is the same one the contract gives.

The model is written once over an `add` operation: `step natAdd` (this file)
adds unbounded `Nat`s and is where the principles are proven; `Contract.lean`
plugs in uint256 addition, which reverts with Panic 0x11 at 2^256, and generates
the test vectors. `Refinement.lean` proves the two agree whenever the uint256
version succeeds (HFT-8). Subtractions are only done after a balance check (as
in OpenZeppelin's `unchecked` blocks), so `Nat` subtraction never truncates.

Not modeled:
* Hats Protocol itself: who wears / administers which hat is plain input
  (`World`). The top-hat domain of a hat is its top 32 bits, as in Hats.
* `getTokenId` = keccak256(abi.encodePacked(hatId, wearer)): a token id is the
  pair `(hatId, wearer)` itself, i.e. we assume keccak256 has no collisions.
  Token ids that are no such hash cannot be minted, so they never hold anything.
* ERC1155 receiver hooks: every account is assumed to accept tokens (an EOA).
* `uri`, `setUp` / `DEFAULT_TOKEN_SUPPLY ≤ 1_000_000` (initialisation), events.
-/
namespace Spec.HatsFractionTokenModule

/-- An address; `0` is `address(0)`. -/
abbrev Addr := Nat
abbrev Hat := Nat

/-- A share: one wearer's share of one role. Its token id is
`getTokenId(hat, wearer)`. -/
abbrev Share := Hat × Addr

/-- `Share.wearer` -/
abbrev Share.wearer (sh : Share) : Addr := sh.2

/-- Everything the module reads from Hats Protocol, plus its configuration. -/
structure World where
  /-- `DOMAIN`: the top-hat domain the module was set up for. -/
  domain : Nat
  /-- `DEFAULT_TOKEN_SUPPLY` -/
  default : Nat
  /-- `isWearerOfHat(account, hat)` is true exactly for these pairs. -/
  wearers : List (Addr × Hat)
  /-- `isAdminOfHat(account, hat)` is true exactly for these pairs. -/
  admins : List (Addr × Hat)
  deriving Repr, DecidableEq

def World.wears (w : World) (a : Addr) (h : Hat) : Bool := w.wearers.contains (a, h)
def World.isAdmin (w : World) (a : Addr) (h : Hat) : Bool := w.admins.contains (a, h)

/-- `Hats.getTopHatDomain`: the top 32 bits of a hat id. -/
def topHatDomain (h : Hat) : Nat := h / 2 ^ 224

/-- Revert reasons. -/
inductive Err where
  /-- Panic 0x11: arithmetic overflow (only in the uint256 model) -/
  | overflow
  /-- Panic 0x32: array index out of bounds -/
  | indexOutOfBounds
  | invalidHatIdForDomain
  | callerNotHatAdminOrWearer
  | wearerDoesNotHaveHat
  | tokenAlreadyMinted
  | initialSupplyNotMinted
  | cannotTransferAllTokens
  | arrayLengthMismatch
  /-- `ERC1155InsufficientBalance(sender, balance, needed, tokenId)` -/
  | insufficientBalance (sender : Addr) (balance needed : Nat) (id : Share)
  /-- `ERC1155MissingApprovalForAll(operator, owner)` -/
  | missingApprovalForAll (operator owner : Addr)
  /-- `ERC1155InvalidReceiver(receiver)` -/
  | invalidReceiver (receiver : Addr)
  /-- `ERC1155InvalidSender(sender)` -/
  | invalidSender (sender : Addr)
  /-- `ERC1155InvalidArrayLength(idsLength, valuesLength)` -/
  | invalidArrayLength (idsLength valuesLength : Nat)
  /-- `ERC1155InvalidOperator(operator)` -/
  | invalidOperator (operator : Addr)
  deriving Repr, DecidableEq

abbrev M := Except Err

/-- One transaction. `sender` is `msg.sender`. -/
inductive Op where
  | mintInitialSupply (sender : Addr) (hat : Hat) (wearer : Addr) (amount : Nat)
  | batchMintInitialSupply (sender : Addr) (hats : List Hat) (wearers : List Addr) (amounts : List Nat)
  | mint (sender : Addr) (hat : Hat) (wearer : Addr) (amount : Nat)
  | burn (sender : Addr) (hat : Hat) (wearer target : Addr) (amount : Nat)
  | safeTransferFrom (sender src dst : Addr) (id : Share) (amount : Nat)
  | safeBatchTransferFrom (sender src dst : Addr) (ids : List Share) (amounts : List Nat)
  | setApprovalForAll (sender operator : Addr) (approved : Bool)
  deriving Repr, DecidableEq

structure State where
  /-- ERC1155 `balanceOf(account, id)` -/
  bal : Share → Addr → Nat
  /-- `tokenRecipients[id]` -/
  recipients : Share → List Addr
  /-- ERC1155Supply `totalSupply(id)` -/
  supply : Share → Nat
  /-- ERC1155Supply `totalSupply()` (over all ids) -/
  supplyAll : Nat
  /-- `isApprovedForAll(owner, operator)` -/
  approved : Addr → Addr → Bool

def State.init : State := ⟨fun _ _ => 0, fun _ => [], fun _ => 0, 0, fun _ _ => false⟩

def upd {α β : Type} [DecidableEq α] (f : α → β) (a : α) (b : β) : α → β :=
  fun x => if x = a then b else f x

/-- Set `balanceOf(a, sh)` to `v`. -/
def State.setBal (s : State) (sh : Share) (a : Addr) (v : Nat) : State :=
  { s with bal := upd s.bal sh (upd (s.bal sh) a v) }

/-- `tokenRecipients[sh].push(a)` -/
def State.push (s : State) (sh : Share) (a : Addr) : State :=
  { s with recipients := upd s.recipients sh (s.recipients sh ++ [a]) }

/-- `if (!_containsRecipient(sh, a)) tokenRecipients[sh].push(a)` -/
def State.pushNew (s : State) (sh : Share) (a : Addr) : State :=
  if a ∈ s.recipients sh then s else s.push sh a

/-- `_isOriginalWearer`: `a` is the first entry of `tokenRecipients[sh]`. -/
def State.isFirst (s : State) (sh : Share) (a : Addr) : Bool := (s.recipients sh).head? == some a

/-! ## Views -/

/-- `balanceOf(account, wearer, hatId)` -/
def balanceOf (w : World) (s : State) (account wearer : Addr) (hat : Hat) : Nat :=
  if w.wears account hat ∧ account ∉ s.recipients (hat, wearer) then w.default
  else s.bal (hat, wearer) account

/-- `totalSupply(wearer, hatId)` -/
def totalSupply (w : World) (s : State) (wearer : Addr) (hat : Hat) : Nat :=
  if wearer ∉ s.recipients (hat, wearer) then w.default else s.supply (hat, wearer)

section
variable (add : Nat → Nat → M Nat) (w : World)

/-! ## OpenZeppelin ERC1155 / ERC1155Supply internals -/

/-- `_mint(to, sh, v)`: balance, then `totalSupply(id)`, then `totalSupply()`. -/
def mintTo (s : State) (to : Addr) (sh : Share) (v : Nat) : M State := do
  if to = 0 then throw (.invalidReceiver 0)
  let b ← add (s.bal sh to) v
  let sup ← add (s.supply sh) v
  let all ← add s.supplyAll v
  pure { s.setBal sh to b with supply := upd s.supply sh sup, supplyAll := all }

/-- `_burn(src, sh, v)` -/
def burnFrom (s : State) (src : Addr) (sh : Share) (v : Nat) : M State := do
  if src = 0 then throw (.invalidSender 0)
  let b := s.bal sh src
  if b < v then throw (.insufficientBalance src b v sh)
  pure { s.setBal sh src (b - v) with
    supply := upd s.supply sh (s.supply sh - v), supplyAll := s.supplyAll - v }

/-- One `(id, value)` of `_update(src, dst, ids, values)` with both addresses non-zero. -/
def moveOne (src dst : Addr) (s : State) (p : Share × Nat) : M State := do
  let (sh, v) := p
  let b := s.bal sh src
  if b < v then throw (.insufficientBalance src b v sh)
  let s := s.setBal sh src (b - v)
  let d ← add (s.bal sh dst) v
  pure (s.setBal sh dst d)

/-- `safeTransferFrom` / `safeBatchTransferFrom` of ERC1155, after the module's guard. -/
def transferCore (s : State) (sender src dst : Addr) (ids : List Share) (amounts : List Nat) :
    M State := do
  if src ≠ sender ∧ !(s.approved src sender) then throw (.missingApprovalForAll sender src)
  if dst = 0 then throw (.invalidReceiver 0)
  if src = 0 then throw (.invalidSender 0)
  if ids.length ≠ amounts.length then throw (.invalidArrayLength ids.length amounts.length)
  (ids.zip amounts).foldlM (moveOne add src dst) s

/-! ## HatsFractionTokenModule -/

/-- `_checkValidAction(hatId, wearer)` -/
def checkValidAction (sender : Addr) (hat : Hat) (wearer : Addr) : M Unit := do
  if topHatDomain hat ≠ w.domain then throw .invalidHatIdForDomain
  if !(w.isAdmin sender hat) ∧ !(w.wears sender hat) then throw .callerNotHatAdminOrWearer
  if !(w.wears wearer hat) then throw .wearerDoesNotHaveHat

def mintInitialSupply (s : State) (sender : Addr) (hat : Hat) (wearer : Addr) (amount : Nat) :
    M State := do
  checkValidAction w sender hat wearer
  let sh : Share := (hat, wearer)
  let v := if amount = 0 then w.default else amount
  if s.bal sh wearer > 0 then throw .tokenAlreadyMinted
  let s ← mintTo add s wearer sh v
  pure (s.push sh wearer)

/-- The module's guard in `safeBatchTransferFrom`: reads `_amounts[i]` only for
ids whose first recipient is `src` (`&&` short-circuits), hence Panic 0x32 when
`_amounts` is shorter. -/
def batchGuard (s : State) (src : Addr) (amounts : List Nat) : List (Share × Nat) → M Unit
  | [] => pure ()
  | (sh, i) :: rest =>
    if s.isFirst sh src then
      match amounts[i]? with
      | none => throw .indexOutOfBounds
      | some v => if s.bal sh src = v then throw .cannotTransferAllTokens
                  else batchGuard s src amounts rest
    else batchGuard s src amounts rest

def zip3 {α β γ : Type} : List α → List β → List γ → List (α × β × γ)
  | a :: as, b :: bs, c :: cs => (a, b, c) :: zip3 as bs cs
  | _, _, _ => []

def step (s : State) : Op → M State
  | .mintInitialSupply sender hat wearer amount =>
    mintInitialSupply add w s sender hat wearer amount
  | .batchMintInitialSupply sender hats wearers amounts => do
    if hats.length ≠ wearers.length ∨ hats.length ≠ amounts.length then
      throw .arrayLengthMismatch
    (hats.zip wearers).forM fun (h, a) => checkValidAction w sender h a
    (zip3 hats wearers amounts).foldlM
      (fun s (h, a, v) => mintInitialSupply add w s sender h a v) s
  | .mint sender hat wearer amount => do
    checkValidAction w sender hat wearer
    if s.bal (hat, wearer) wearer = 0 then throw .initialSupplyNotMinted
    mintTo add s wearer (hat, wearer) amount
  | .burn sender hat wearer target amount => do
    checkValidAction w sender hat wearer
    burnFrom s target (hat, wearer) amount
  | .safeTransferFrom sender src dst id amount => do
    if s.isFirst id src ∧ s.bal id src = amount then throw .cannotTransferAllTokens
    let s ← transferCore add s sender src dst [id] [amount]
    pure (s.pushNew id dst)
  | .safeBatchTransferFrom sender src dst ids amounts => do
    batchGuard s src amounts ids.zipIdx
    let s ← transferCore add s sender src dst ids amounts
    pure (ids.foldl (fun s id => s.pushNew id dst) s)
  | .setApprovalForAll sender operator approved => do
    if operator = 0 then throw (.invalidOperator 0)
    pure { s with approved := upd s.approved sender (upd (s.approved sender) operator approved) }

end

/-- A sequence of transactions: a reverted one leaves the state unchanged. -/
def exec (add : Nat → Nat → M Nat) (w : World) : State → List Op → State
  | s, [] => s
  | s, op :: ops =>
    match step add w s op with
    | .ok s' => exec add w s' ops
    | .error _ => exec add w s ops

/-- Unbounded addition. -/
def natAdd (a b : Nat) : M Nat := pure (a + b)

end Spec.HatsFractionTokenModule
