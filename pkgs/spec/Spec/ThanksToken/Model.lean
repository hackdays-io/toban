/-
Reference model of ThanksToken (pkgs/contract/contracts/thankstoken/ThanksToken.sol):
the mint cap `mintableAmount`, and the state changes of `mint`, `batchMint`,
`mintFrom`, `approveMint`, `permitMint`, `setAddressCoefficient` and the ERC-20
`transfer` (the only other way a balance — and so the cap — changes).

Accounts are `Nat`s; `0` is the zero address. Everything ThanksToken reads from
other contracts (FractionToken balances and supplies, wear time) is the plain
input `Env`. The EIP-712 signature check of `permitMint` is abstracted: a
`Permit` names who signed it, and the signature verifies iff the signer is the
owner and the permit's nonce is the owner's current nonce (the contract hashes
the current nonce into the digest, so a signature over any other nonce
recovers some other address).

This model uses unbounded `Nat`. `Contract.lean` is the same with uint256
overflow checks, and `Refinement.lean` proves the two agree (THX-8).

Not modeled: events, ERC-20 `approve` / `transferFrom` (OpenZeppelin), and
`setAddressCoefficients` (the batch form of `setAddressCoefficient`).
-/
namespace Spec.ThanksToken

/-- `type(uint256).max`: an allowance of this size is never decremented. -/
def MAX : Nat := 2 ^ 256 - 1

/-- `DEFAULT_COEFFICIENT`, `1e18` and `1 ether` in ThanksToken.sol. -/
def ONE : Nat := 1000000000000000000

/-- `10 minutes`: wear time is counted in 10-minute units. -/
def UNIT : Nat := 600

/-- One `RelatedRole`. -/
structure RoleRef where
  wearer : Nat
  hatId : Nat
  deriving Repr, DecidableEq, Inhabited

/-- What ThanksToken reads from other contracts, and the clone's owner. -/
structure Env where
  /-- `WORKSPACE_OWNER()` -/
  owner : Nat
  /-- `FractionToken.balanceOf(account, wearer, hatId)` -/
  share : Nat → RoleRef → Nat
  /-- `FractionToken.totalSupply(wearer, hatId)` -/
  supply : RoleRef → Nat
  /-- `HatsTimeFrameModule.getWearingElapsedTime(wearer, hatId)` -/
  elapsed : RoleRef → Nat

structure State where
  /-- ERC-20 `balanceOf` -/
  balance : Nat → Nat
  /-- ERC-20 `totalSupply` -/
  supply : Nat
  /-- `mintedAmount` -/
  minted : Nat → Nat
  /-- `addressCoefficient` (0 = use the default) -/
  coef : Nat → Nat
  /-- `mintAllowance(owner, spender)` -/
  allowance : Nat → Nat → Nat
  /-- `mintNonces` -/
  nonce : Nat → Nat
  /-- `getParticipants()` -/
  participants : List Nat

/-- A freshly cloned ThanksToken. -/
def State.init : State := ⟨fun _ => 0, 0, fun _ => 0, fun _ => 0, fun _ _ => 0, fun _ => 0, []⟩

/-- A signed `PermitMint` message, as submitted to `permitMint`. -/
structure Permit where
  owner : Nat
  spender : Nat
  value : Nat
  /-- the nonce the signer signed over -/
  nonce : Nat
  /-- `block.timestamp > deadline` -/
  expired : Bool
  /-- who produced the signature -/
  signer : Nat
  deriving Repr, DecidableEq

inductive Op where
  | mint (sender to amount : Nat) (roles : List RoleRef)
  | batchMint (sender : Nat) (tos amounts : List Nat) (roles : List RoleRef)
  | mintFrom (sender frm to value : Nat) (roles : List RoleRef)
  | approveMint (sender spender value : Nat)
  | permitMint (sender : Nat) (p : Permit)
  | transfer (sender to amount : Nat)
  | setCoefficient (sender account coef : Nat)
  deriving Repr

/-- Why a call reverts. `overflow` (Panic 0x11) only comes from `Contract.lean`. -/
inductive Err where
  | selfMint            -- "Cannot mint to yourself"
  | zeroAmount          -- "Amount must be greater than 0"
  | exceedsMintable     -- "Amount exceeds mintable amount"
  | lengthMismatch      -- "Arrays length mismatch"
  | totalExceeds        -- "Total exceeds mintable amount"
  | mintToSpender       -- "Cannot mint to spender"
  | allowanceExceeded   -- "ThanksToken: mint allowance exceeded"
  | invalidOwner        -- "ThanksToken: invalid owner"
  | permitExpired       -- "ThanksToken: permit expired"
  | invalidSignature    -- "ThanksToken: invalid signature"
  | approveFromZero     -- "ThanksToken: approve from zero address"
  | approveToZero       -- "ThanksToken: approve to zero address"
  | notOwner            -- "Ownable: caller is not the owner"
  | invalidSender       -- ERC20InvalidSender
  | invalidReceiver     -- ERC20InvalidReceiver
  | insufficientBalance -- ERC20InsufficientBalance
  | overflow            -- Panic 0x11
  deriving Repr, DecidableEq

abbrev Result := Except Err

/-- Point update of a map. -/
def upd (f : Nat → Nat) (a v : Nat) : Nat → Nat := fun x => if x = a then v else f x

def upd2 (f : Nat → Nat → Nat) (a b v : Nat) : Nat → Nat → Nat :=
  fun x y => if x = a ∧ y = b then v else f x y

/-! ## The mint cap (`mintableAmount`) -/

/-- The roles the loop does not skip: each `(wearer, hatId)` at its first
occurrence. `prev` is every role seen before (the `j < i` loop). -/
def firstOcc (prev : List RoleRef) : List RoleRef → List RoleRef
  | [] => []
  | r :: rs => (if r ∈ prev then [] else [r]) ++ firstOcc (r :: prev) rs

def roleAmount (env : Env) (o : Nat) (r : RoleRef) : Nat :=
  if env.share o r = 0 ∨ env.supply r = 0 then 0
  else env.elapsed r / UNIT * env.share o r / env.supply r

def roleSum (env : Env) (o : Nat) (roles : List RoleRef) : Nat :=
  ((firstOcc [] roles).map (roleAmount env o)).sum

def coefOf (s : State) (o : Nat) : Nat := if 0 < s.coef o then s.coef o else ONE

/-- `totalMintable` just before `mintedAmount` is subtracted: the cap on what
`o` may have minted in total. -/
def cap (env : Env) (s : State) (o : Nat) (roles : List RoleRef) : Nat :=
  roleSum env o roles * coefOf s o / ONE * ONE + s.balance o / 10

/-- `mintableAmount(o, roles)` (`Nat` subtraction stops at 0, like the contract's `if`). -/
def mintable (env : Env) (s : State) (o : Nat) (roles : List RoleRef) : Nat :=
  cap env s o roles - s.minted o

/-! ## State changes -/

def addP (s : State) (a : Nat) : State :=
  if a ∈ s.participants then s else { s with participants := s.participants ++ [a] }

def creditMinted (s : State) (o v : Nat) : State := { s with minted := upd s.minted o (s.minted o + v) }

/-- ERC-20 `_mint(a, v)`. -/
def mintTo (s : State) (a v : Nat) : Result State :=
  if a = 0 then .error .invalidReceiver
  else .ok { s with supply := s.supply + v, balance := upd s.balance a (s.balance a + v) }

/-- `batchMint`'s second loop: `_mint` then add the recipient, for each pair. -/
def mintAll : State → List (Nat × Nat) → Result State
  | s, [] => .ok s
  | s, (a, v) :: rest => match mintTo s a v with
    | .ok s' => mintAll (addP s' a) rest
    | .error e => .error e

/-- `batchMint`'s first loop: the per-recipient checks. -/
def checkBatch (sender : Nat) : List (Nat × Nat) → Result Unit
  | [] => .ok ()
  | (a, v) :: rest =>
    if a = sender then .error .selfMint
    else if v = 0 then .error .zeroAmount
    else checkBatch sender rest

/-- `_approveMint`. -/
def approve (s : State) (o sp v : Nat) : Result State :=
  if o = 0 then .error .approveFromZero
  else if sp = 0 then .error .approveToZero
  else .ok { s with allowance := upd2 s.allowance o sp v }

def spend (s : State) (o sp v : Nat) : State :=
  if s.allowance o sp = MAX then s
  else { s with allowance := upd2 s.allowance o sp (s.allowance o sp - v) }

def step (env : Env) (s : State) : Op → Result State
  | .mint sender to amount roles =>
    if to = sender then .error .selfMint
    else if amount = 0 then .error .zeroAmount
    else if mintable env s sender roles < amount then .error .exceedsMintable
    else (mintTo (creditMinted s sender amount) to amount).map fun s => addP (addP s sender) to
  | .batchMint sender tos amounts roles =>
    if tos.length ≠ amounts.length then .error .lengthMismatch
    else match checkBatch sender (tos.zip amounts) with
      | .error e => .error e
      | .ok () =>
        if mintable env s sender roles < amounts.sum then .error .totalExceeds
        else (mintAll (creditMinted s sender amounts.sum) (tos.zip amounts)).map fun s => addP s sender
  | .mintFrom sender frm to value roles =>
    if to = frm then .error .selfMint
    else if to = sender then .error .mintToSpender
    else if value = 0 then .error .zeroAmount
    else if s.allowance frm sender < value then .error .allowanceExceeded
    else if mintable env s frm roles < value then .error .exceedsMintable
    else (mintTo (creditMinted (spend s frm sender value) frm value) to value).map
      fun s => addP (addP s frm) to
  | .approveMint sender spender value => approve s sender spender value
  | .permitMint _ p =>
    if p.owner = 0 then .error .invalidOwner
    else if p.expired then .error .permitExpired
    else if p.signer ≠ p.owner ∨ p.nonce ≠ s.nonce p.owner then .error .invalidSignature
    else approve { s with nonce := upd s.nonce p.owner (s.nonce p.owner + 1) } p.owner p.spender p.value
  | .transfer sender to amount =>
    if sender = 0 then .error .invalidSender
    else if to = 0 then .error .invalidReceiver
    else if s.balance sender < amount then .error .insufficientBalance
    else
      let b := upd s.balance sender (s.balance sender - amount)
      .ok { s with balance := upd b to (b to + amount) }
  | .setCoefficient sender account coef =>
    if sender ≠ env.owner then .error .notOwner
    else .ok { s with coef := upd s.coef account coef }

/-- The account whose `mintedAmount` an operation raises, and by how much. -/
def mintedBy : Op → Option (Nat × Nat)
  | .mint sender _ amount _ => some (sender, amount)
  | .batchMint sender _ amounts _ => some (sender, amounts.sum)
  | .mintFrom _ frm _ value _ => some (frm, value)
  | _ => none

/-- The roles an operation's cap is computed with. -/
def Op.roles : Op → List RoleRef
  | .mint _ _ _ roles | .batchMint _ _ _ roles | .mintFrom _ _ _ _ roles => roles
  | _ => []

/-- Recipients of newly minted tokens. -/
def recipients : Op → List Nat
  | .mint _ to _ _ => [to]
  | .batchMint _ tos _ _ => tos
  | .mintFrom _ _ to _ _ => [to]
  | _ => []

end Spec.ThanksToken
