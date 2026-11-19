/-
Principles of ThanksToken, proven against the model in `Model.lean`.

Each principle theorem carries its ID in the comment line directly above it
(`-- THX-n: ...`). The ID matches the Principles table in
pkgs/document/docs/protocol/modules/thanks-token.md and the `[THX-n]` tags in
pkgs/contract/test. `scripts/check-spec-ids.mjs` checks that the three agree.

The principles are about `step` (unbounded `Nat`). By THX-8 every successful
call of the uint256 model (`stepU`) is a successful `step` with the same
result, and a sequence of contract calls (`runU`) ends where `run` ends on the
same calls minus the ones that overflowed (`runU_is_run`), so the principles
about one call and about call sequences both hold for the contract.
-/
import Spec.ThanksToken.Refinement

namespace Spec.ThanksToken

/-! ## Running several calls -/

/-- Apply calls in order; a reverted call leaves the state unchanged. -/
def run (env : Env) : State → List Op → State
  | s, [] => s
  | s, op :: ops => run env (match step env s op with | .ok s' => s' | .error _ => s) ops

/-- How much `mintedAmount(a)` an operation adds when it succeeds. -/
def delta (op : Op) (a : Nat) : Nat :=
  match mintedBy op with
  | some (o, v) => if a = o then v else 0
  | none => 0

/-- How many tokens an operation mints when it succeeds. -/
def total (op : Op) : Nat :=
  match mintedBy op with
  | some (_, v) => v
  | none => 0

/-- The participant list only grows at the end and stays free of duplicates. -/
def Grows (s s' : State) : Prop :=
  s.participants <+: s'.participants ∧ (s.participants.Nodup → s'.participants.Nodup)

theorem Grows.refl (s : State) : Grows s s := ⟨List.prefix_refl _, id⟩

theorem Grows.trans {a b c : State} (h1 : Grows a b) (h2 : Grows b c) : Grows a c :=
  ⟨h1.1.trans h2.1, fun h => h2.2 (h1.2 h)⟩

theorem grows_of_eq {s s' : State} (h : s.participants = s'.participants) : Grows s s' := by
  unfold Grows; rw [h]; exact Grows.refl s'

theorem Grows.mem {s s' : State} (h : Grows s s') {a : Nat} (ha : a ∈ s.participants) :
    a ∈ s'.participants := h.1.subset ha

/-! ## Field lemmas -/

@[simp] theorem addP_minted (s : State) (a : Nat) : (addP s a).minted = s.minted := by
  unfold addP; split <;> rfl
@[simp] theorem addP_supply (s : State) (a : Nat) : (addP s a).supply = s.supply := by
  unfold addP; split <;> rfl
@[simp] theorem addP_allowance (s : State) (a : Nat) : (addP s a).allowance = s.allowance := by
  unfold addP; split <;> rfl
@[simp] theorem addP_nonce (s : State) (a : Nat) : (addP s a).nonce = s.nonce := by
  unfold addP; split <;> rfl

theorem addP_grows (s : State) (a : Nat) : Grows s (addP s a) := by
  unfold addP
  split
  · exact Grows.refl s
  · rename_i ha
    refine ⟨List.prefix_append _ _, fun hn => ?_⟩
    rw [List.nodup_append]
    refine ⟨hn, List.nodup_cons.mpr ⟨by simp, List.nodup_nil⟩, ?_⟩
    intro x hx y hy
    simp only [List.mem_singleton] at hy
    subst hy
    intro hxa; subst hxa; exact ha hx

theorem mem_addP (s : State) (a : Nat) : a ∈ (addP s a).participants := by
  unfold addP; split
  · assumption
  · simp

theorem map_eq_ok {α β : Type} {f : α → β} {x : Result α} {b : β} (h : x.map f = .ok b) :
    ∃ a, x = .ok a ∧ f a = b := by
  cases x with
  | error e => cases h
  | ok a => exact ⟨a, rfl, by simpa [Except.map] using h⟩

theorem mintTo_ok {s s' : State} {a v : Nat} (h : mintTo s a v = .ok s') :
    a ≠ 0 ∧ s' = { s with supply := s.supply + v, balance := upd s.balance a (s.balance a + v) } := by
  unfold mintTo at h
  split at h
  · cases h
  · rename_i ha; cases h; exact ⟨ha, rfl⟩

/-- What `mintAll` (the second loop of `batchMint`) does. -/
theorem mintAll_ok {s s' : State} {l : List (Nat × Nat)} (h : mintAll s l = .ok s') :
    s'.minted = s.minted ∧ s'.allowance = s.allowance ∧ s'.nonce = s.nonce ∧
      s'.supply = s.supply + (l.map Prod.snd).sum ∧ Grows s s' ∧
      ∀ a ∈ l.map Prod.fst, a ∈ s'.participants := by
  induction l generalizing s with
  | nil =>
    cases h; exact ⟨rfl, rfl, rfl, by simp, Grows.refl _, by simp⟩
  | cons p rest ih =>
    obtain ⟨a, v⟩ := p
    simp only [mintAll] at h
    split at h
    · rename_i s1 h1
      obtain ⟨_, rfl⟩ := mintTo_ok h1
      obtain ⟨hm, hal, hn, hs, hg, hmem⟩ := ih h
      simp only [addP_minted, addP_allowance, addP_nonce, addP_supply] at hm hal hn hs
      have hg' : Grows s s' := (grows_of_eq (s' := { s with supply := s.supply + v, balance := upd s.balance a (s.balance a + v) }) rfl).trans
        ((addP_grows _ a).trans hg)
      refine ⟨hm, hal, hn, by simp [hs, Nat.add_assoc], hg', ?_⟩
      intro x hx
      simp only [List.map_cons, List.mem_cons] at hx
      rcases hx with rfl | hx
      · exact hg.mem (mem_addP _ _)
      · exact hmem x hx
    · cases h

theorem checkBatch_ok {sender : Nat} {l : List (Nat × Nat)} (h : checkBatch sender l = .ok ()) :
    ∀ p ∈ l, p.1 ≠ sender ∧ p.2 ≠ 0 := by
  induction l with
  | nil => simp
  | cons p rest ih =>
    obtain ⟨a, v⟩ := p
    simp only [checkBatch] at h
    split at h
    · cases h
    · split at h
      · cases h
      · rename_i h1 h2
        intro q hq
        simp only [List.mem_cons] at hq
        rcases hq with rfl | hq
        · exact ⟨h1, h2⟩
        · exact ih h q hq

/-! ## One successful call, case by case -/

/-- The facts every principle below is read off. -/
structure Frame (env : Env) (s : State) (op : Op) (s' : State) : Prop where
  minted : ∀ a, s'.minted a = s.minted a + delta op a
  supply : s'.supply = s.supply + total op
  grows : Grows s s'
  minter : ∀ o v, mintedBy op = some (o, v) → o ∈ s'.participants
  recipients : ∀ a ∈ recipients op, a ∈ s'.participants
  cap : ∀ o v, mintedBy op = some (o, v) → v ≤ mintable env s o op.roles

theorem upd_apply (f : Nat → Nat) (a v x : Nat) : upd f a v x = if x = a then v else f x := rfl

theorem frame_of_mint {s s' s2 : State} {o to v : Nat}
    (h2 : mintTo (creditMinted s o v) to v = .ok s2) (hs' : s' = addP (addP s2 o) to) :
    (∀ a, s'.minted a = s.minted a + (if a = o then v else 0)) ∧ s'.supply = s.supply + v ∧
      Grows s s' ∧ o ∈ s'.participants ∧ to ∈ s'.participants := by
  obtain ⟨_, rfl⟩ := mintTo_ok h2
  subst hs'
  refine ⟨?_, by simp [creditMinted], ?_, ?_, mem_addP _ _⟩
  · intro a
    simp only [addP_minted, creditMinted, upd_apply]
    split <;> simp_all
  · exact (grows_of_eq (by simp [creditMinted])).trans ((addP_grows _ _).trans (addP_grows _ _))
  · exact (addP_grows _ to).mem (mem_addP _ _)

theorem step_frame {env : Env} {s s' : State} {op : Op} (h : step env s op = .ok s') :
    Frame env s op s' := by
  cases op with
  | mint sender to amount roles =>
    simp only [step] at h
    split at h; · cases h
    split at h; · cases h
    split at h; · cases h
    rename_i hcap
    obtain ⟨s2, h2, hs'⟩ := map_eq_ok h
    obtain ⟨hm, hsup, hg, ho, hto⟩ := frame_of_mint h2 hs'.symm
    refine ⟨fun a => by simp [hm, delta, mintedBy], by simp [hsup, total, mintedBy], hg, ?_, ?_, ?_⟩
    · intro o v hov; simp [mintedBy] at hov; obtain ⟨rfl, rfl⟩ := hov; exact ho
    · intro a ha; simp [recipients] at ha; subst ha; exact hto
    · intro o v hov; simp [mintedBy] at hov; obtain ⟨rfl, rfl⟩ := hov
      simp only [Op.roles]; omega
  | batchMint sender tos amounts roles =>
    simp only [step] at h
    split at h; · cases h
    rename_i hlen
    split at h; · cases h
    rename_i hchk
    split at h; · cases h
    rename_i hcap
    obtain ⟨s2, h2, rfl⟩ := map_eq_ok h
    obtain ⟨hm, _, _, hs, hg, hmem⟩ := mintAll_ok h2
    have hfst : (tos.zip amounts).map Prod.fst = tos := List.map_fst_zip (by omega)
    have hsnd : (tos.zip amounts).map Prod.snd = amounts := List.map_snd_zip (by omega)
    rw [hfst] at hmem
    rw [hsnd] at hs
    refine ⟨?_, ?_, ?_, ?_, ?_, ?_⟩
    · intro a
      simp only [addP_minted, hm, creditMinted, upd_apply, delta, mintedBy]
      split <;> simp_all
    · simp [hs, creditMinted, total, mintedBy]
    · exact Grows.trans hg (addP_grows _ _)
    · intro o v hov; simp [mintedBy] at hov; obtain ⟨rfl, rfl⟩ := hov; exact mem_addP _ _
    · intro a ha; simp only [recipients] at ha; exact (addP_grows _ _).mem (hmem a ha)
    · intro o v hov; simp [mintedBy] at hov; obtain ⟨rfl, rfl⟩ := hov
      simp only [Op.roles]; omega
  | mintFrom sender frm to value roles =>
    simp only [step] at h
    split at h; · cases h
    split at h; · cases h
    split at h; · cases h
    split at h; · cases h
    split at h; · cases h
    rename_i hcap
    obtain ⟨s2, h2, hs'⟩ := map_eq_ok h
    have hsp : (spend s frm sender value).minted = s.minted ∧
        (spend s frm sender value).supply = s.supply ∧
        (spend s frm sender value).participants = s.participants := by
      unfold spend; split <;> simp
    obtain ⟨hm, hsup, hg, ho, hto⟩ := frame_of_mint h2 hs'.symm
    refine ⟨fun a => by simp [hm, hsp.1, delta, mintedBy], by simp [hsup, hsp.2.1, total, mintedBy],
      (grows_of_eq hsp.2.2.symm).trans hg, ?_, ?_, ?_⟩
    · intro o v hov; simp [mintedBy] at hov; obtain ⟨rfl, rfl⟩ := hov; exact ho
    · intro a ha; simp [recipients] at ha; subst ha; exact hto
    · intro o v hov; simp [mintedBy] at hov; obtain ⟨rfl, rfl⟩ := hov
      simp only [Op.roles]; omega
  | approveMint sender spender value =>
    simp only [step, approve] at h
    split at h; · cases h
    split at h; · cases h
    cases h
    exact ⟨fun _ => rfl, rfl, Grows.refl _, by simp [mintedBy], by simp [recipients], by simp [mintedBy]⟩
  | permitMint x p =>
    simp only [step, approve] at h
    repeat (split at h; · cases h)
    cases h
    exact ⟨fun _ => rfl, rfl, Grows.refl _, by simp [mintedBy], by simp [recipients], by simp [mintedBy]⟩
  | transfer sender to amount =>
    simp only [step] at h
    split at h; · cases h
    split at h; · cases h
    split at h; · cases h
    cases h
    exact ⟨fun _ => rfl, rfl, Grows.refl _, by simp [mintedBy], by simp [recipients], by simp [mintedBy]⟩
  | setCoefficient sender account coef =>
    simp only [step] at h
    split at h; · cases h
    cases h
    exact ⟨fun _ => rfl, rfl, Grows.refl _, by simp [mintedBy], by simp [recipients], by simp [mintedBy]⟩

/-! ## Sums over the participant list -/

theorem sum_map_add {α : Type} (l : List α) (f g : α → Nat) :
    (l.map fun a => f a + g a).sum = (l.map f).sum + (l.map g).sum := by
  induction l with
  | nil => rfl
  | cons x xs ih => simp only [List.map_cons, List.sum_cons, ih]; omega

theorem sum_map_zero {α : Type} (l : List α) (f : α → Nat) (h : ∀ a ∈ l, f a = 0) :
    (l.map f).sum = 0 := by
  induction l with
  | nil => rfl
  | cons x xs ih =>
    simp only [List.map_cons, List.sum_cons]
    rw [h x (List.mem_cons_self ..), ih fun a ha => h a (List.mem_cons_of_mem _ ha)]

theorem sum_map_single (l : List Nat) (o v : Nat) (hn : l.Nodup) (ho : o ∈ l) :
    (l.map fun a => if a = o then v else 0).sum = v := by
  induction l with
  | nil => cases ho
  | cons x xs ih =>
    rw [List.nodup_cons] at hn
    simp only [List.map_cons, List.sum_cons]
    by_cases hx : x = o
    · subst hx
      rw [sum_map_zero xs _ fun a ha => by
        have : a ≠ x := fun h => hn.1 (h ▸ ha)
        simp [this]]
      simp
    · have : o ∈ xs := by
        rcases List.mem_cons.mp ho with h | h
        · exact absurd h.symm hx
        · exact h
      simp [hx, ih hn.2 this]

/-! ## Principles -/

-- THX-1: a successful mint, batchMint or mintFrom raises the minter's mintedAmount by at most mintableAmount at that moment, so it never pushes mintedAmount above the cap (role-derived amount × coefficient + 10% of the balance).
theorem mint_within_cap {env : Env} {s s' : State} {op : Op} {o v : Nat}
    (h : step env s op = .ok s') (hm : mintedBy op = some (o, v)) :
    v ≤ mintable env s o op.roles ∧ s'.minted o ≤ max (s.minted o) (cap env s o op.roles) := by
  have f := step_frame h
  have hc := f.cap o v hm
  have hmo := f.minted o
  simp only [delta, hm, ite_true] at hmo
  unfold mintable at hc
  refine ⟨hc, ?_⟩
  rw [hmo]
  omega

theorem firstOcc_congr {p q : List RoleRef} (h : ∀ x, x ∈ p ↔ x ∈ q) (l : List RoleRef) :
    firstOcc p l = firstOcc q l := by
  induction l generalizing p q with
  | nil => rfl
  | cons r rs ih =>
    simp only [firstOcc, h r]
    congr 1
    exact ih fun x => by simp [h x]

theorem firstOcc_append (prev a b : List RoleRef) :
    firstOcc prev (a ++ b) = firstOcc prev a ++ firstOcc (a.reverse ++ prev) b := by
  induction a generalizing prev with
  | nil => simp [firstOcc]
  | cons r rs ih =>
    simp only [List.cons_append, firstOcc, ih, List.append_assoc, List.reverse_cons]
    congr 2

theorem firstOcc_dup {r : RoleRef} {a : List RoleRef} (b : List RoleRef) (hr : r ∈ a) :
    firstOcc [] (a ++ r :: b) = firstOcc [] (a ++ b) := by
  rw [firstOcc_append, firstOcc_append]
  congr 1
  have hr' : r ∈ a.reverse ++ [] := by simp [hr]
  simp only [firstOcc, hr', ite_true, List.nil_append]
  exact firstOcc_congr (fun x => by
    simp only [List.mem_cons, List.mem_append, List.mem_reverse, List.not_mem_nil, or_false]
    constructor
    · rintro (rfl | h) <;> assumption
    · exact Or.inr) b

-- THX-2: passing a role (wearer, hatId) that already appears earlier in relatedRoles changes nothing: mintableAmount is the same as without the repeat, in both models.
theorem duplicate_role_ignored (env : Env) (s : State) (o : Nat) {r : RoleRef}
    {a : List RoleRef} (b : List RoleRef) (hr : r ∈ a) :
    mintable env s o (a ++ r :: b) = mintable env s o (a ++ b) ∧
      U.mintable env s o (a ++ r :: b) = U.mintable env s o (a ++ b) := by
  constructor
  · simp only [mintable, cap, roleSum, firstOcc_dup b hr]
  · simp only [U.mintable, U.cap, U.roleSum, firstOcc_dup b hr]

/-! ### Delegated mint -/

/-- Calls that set `mintAllowance(o, sp)`: `approveMint` by `o`, or a permit for `o`. -/
def Grants (o sp : Nat) : Op → Prop
  | .approveMint sender spender _ => sender = o ∧ spender = sp
  | .permitMint _ p => p.owner = o ∧ p.spender = sp
  | _ => False

/-- How much of `mintAllowance(o, sp)` a call spends: `mintFrom` by `sp` from `o`. -/
def spent (o sp : Nat) : Op → Nat
  | .mintFrom sender frm _ value _ => if sender = sp ∧ frm = o then value else 0
  | _ => 0

/-- Sum of `f` over the calls in `ops` that succeed. -/
def sumRun (env : Env) (f : Op → Nat) : State → List Op → Nat
  | _, [] => 0
  | s, op :: ops => match step env s op with
    | .ok s' => f op + sumRun env f s' ops
    | .error _ => sumRun env f s ops

theorem mintTo_allowance {s s' : State} {a v : Nat} (h : mintTo s a v = .ok s') :
    s'.allowance = s.allowance ∧ s'.nonce = s.nonce := by
  obtain ⟨_, rfl⟩ := mintTo_ok h; exact ⟨rfl, rfl⟩

theorem step_allowance {env : Env} {s s' : State} {op : Op} (h : step env s op = .ok s')
    {o sp : Nat} (hg : ¬ Grants o sp op) (hlt : s.allowance o sp < MAX) :
    s'.allowance o sp + spent o sp op = s.allowance o sp := by
  cases op with
  | mint sender to amount roles =>
    simp only [step] at h
    repeat (split at h; · cases h)
    obtain ⟨s2, h2, rfl⟩ := map_eq_ok h
    simp [(mintTo_allowance h2).1, creditMinted, spent]
  | batchMint sender tos amounts roles =>
    simp only [step] at h
    repeat (split at h; · cases h)
    obtain ⟨s2, h2, rfl⟩ := map_eq_ok h
    simp [(mintAll_ok h2).2.1, creditMinted, spent]
  | mintFrom sender frm to value roles =>
    simp only [step] at h
    repeat (split at h; · cases h)
    rename_i hal _
    obtain ⟨s2, h2, rfl⟩ := map_eq_ok h
    simp only [addP_allowance, (mintTo_allowance h2).1, creditMinted, spent, spend]
    by_cases he : sender = sp ∧ frm = o
    · obtain ⟨rfl, rfl⟩ := he
      have : s.allowance frm sender ≠ MAX := by omega
      simp [this, upd2]; omega
    · simp only [he, ite_false, Nat.add_zero]
      split
      · rfl
      · simp only [upd2]; split
        · rename_i h'; exact absurd ⟨h'.2.symm, h'.1.symm⟩ he
        · rfl
  | approveMint sender spender value =>
    simp only [step, approve] at h
    repeat (split at h; · cases h)
    cases h
    simp only [Grants] at hg
    simp only [upd2, spent, Nat.add_zero]
    split
    · rename_i h'; exact absurd ⟨h'.1.symm, h'.2.symm⟩ hg
    · rfl
  | permitMint x p =>
    simp only [step, approve] at h
    repeat (split at h; · cases h)
    cases h
    simp only [Grants] at hg
    simp only [upd2, spent, Nat.add_zero]
    split
    · rename_i h'; exact absurd ⟨h'.1.symm, h'.2.symm⟩ hg
    · rfl
  | transfer sender to amount =>
    simp only [step] at h
    repeat (split at h; · cases h)
    cases h; rfl
  | setCoefficient sender account coef =>
    simp only [step] at h
    repeat (split at h; · cases h)
    cases h; rfl

-- THX-3: unless o approves sp again (approveMint or permitMint), the total that sp mints from o with mintFrom plus the allowance left is exactly the allowance o gave, so sp never mints more than it was allowed (an allowance of 2^256-1 is never spent down).
theorem allowance_budget (env : Env) (o sp : Nat) (ops : List Op) (s : State)
    (hg : ∀ op ∈ ops, ¬ Grants o sp op) (hlt : s.allowance o sp < MAX) :
    sumRun env (spent o sp) s ops + (run env s ops).allowance o sp = s.allowance o sp := by
  induction ops generalizing s with
  | nil => simp [sumRun, run]
  | cons op ops ih =>
    have hg' : ∀ op ∈ ops, ¬ Grants o sp op := fun x hx => hg x (List.mem_cons_of_mem _ hx)
    simp only [sumRun, run]
    split
    · rename_i s' h
      have hs := step_allowance h (hg op (List.mem_cons_self ..)) hlt
      have := ih s' hg' (by omega)
      omega
    · exact ih s hg' hlt

theorem step_nonce {env : Env} {s s' : State} {op : Op} (h : step env s op = .ok s') (a : Nat) :
    s.nonce a ≤ s'.nonce a := by
  cases op with
  | mint =>
    simp only [step] at h
    repeat (split at h; · cases h)
    obtain ⟨s2, h2, rfl⟩ := map_eq_ok h
    simp [(mintTo_allowance h2).2, creditMinted]
  | batchMint =>
    simp only [step] at h
    repeat (split at h; · cases h)
    obtain ⟨s2, h2, rfl⟩ := map_eq_ok h
    simp [(mintAll_ok h2).2.2.1, creditMinted]
  | mintFrom =>
    simp only [step] at h
    repeat (split at h; · cases h)
    obtain ⟨s2, h2, rfl⟩ := map_eq_ok h
    simp only [addP_nonce, (mintTo_allowance h2).2, creditMinted, spend]
    split <;> exact Nat.le_refl _
  | approveMint =>
    simp only [step, approve] at h
    repeat (split at h; · cases h)
    cases h; exact Nat.le_refl _
  | permitMint x p =>
    simp only [step, approve] at h
    repeat (split at h; · cases h)
    cases h
    simp only [upd]; split
    · rename_i hx; subst hx; omega
    · exact Nat.le_refl _
  | transfer =>
    simp only [step] at h
    repeat (split at h; · cases h)
    cases h; exact Nat.le_refl _
  | setCoefficient =>
    simp only [step] at h
    repeat (split at h; · cases h)
    cases h; exact Nat.le_refl _

theorem run_nonce (env : Env) (ops : List Op) (s : State) (a : Nat) :
    s.nonce a ≤ (run env s ops).nonce a := by
  induction ops generalizing s with
  | nil => exact Nat.le_refl _
  | cons op ops ih =>
    simp only [run]
    split
    · rename_i s' h; exact Nat.le_trans (step_nonce h a) (ih s')
    · exact ih s

theorem permit_ok {env : Env} {s s' : State} {x : Nat} {p : Permit}
    (h : step env s (.permitMint x p) = .ok s') :
    p.nonce = s.nonce p.owner ∧ s'.nonce p.owner = p.nonce + 1 := by
  simp only [step, approve] at h
  repeat (split at h; · cases h)
  rename_i hsig _
  cases h
  have hn : p.nonce = s.nonce p.owner := by
    simp only [ne_eq, not_or, Decidable.not_not] at hsig; exact hsig.2
  exact ⟨hn, by simp [upd, hn]⟩

-- THX-4: a signed permit takes effect at most once: after permitMint succeeds with it, the same permit fails on every later state, whoever submits it.
theorem permit_once {env : Env} {s s1 : State} {x : Nat} {p : Permit}
    (h : step env s (.permitMint x p) = .ok s1) (ops : List Op) (y : Nat) (s2 : State) :
    step env (run env s1 ops) (.permitMint y p) ≠ .ok s2 := by
  intro h2
  have h1 := (permit_ok h).2
  have h3 := (permit_ok h2).1
  have := run_nonce env ops s1 p.owner
  omega

/-! ### `mintedAmount`, participants and supply -/

-- THX-5: mintedAmount(a) is exactly what a has minted (as minter in mint/batchMint, or as `from` in mintFrom) in the calls that succeeded, and never decreases.
theorem minted_is_sum (env : Env) (ops : List Op) (s : State) (a : Nat) :
    (run env s ops).minted a = s.minted a + sumRun env (fun op => delta op a) s ops := by
  induction ops generalizing s with
  | nil => simp [run, sumRun]
  | cons op ops ih =>
    simp only [run, sumRun]
    split
    · rename_i s' h
      rw [ih s', (step_frame h).minted a]; omega
    · exact ih s

-- THX-6: after a successful mint, batchMint or mintFrom, the minter and every recipient are in getParticipants; the list only grows at the end and never holds an account twice.
theorem participants_step {env : Env} {s s' : State} {op : Op} (h : step env s op = .ok s') :
    s.participants <+: s'.participants ∧ (s.participants.Nodup → s'.participants.Nodup) ∧
      (∀ o v, mintedBy op = some (o, v) → o ∈ s'.participants) ∧
      ∀ a ∈ recipients op, a ∈ s'.participants :=
  have f := step_frame h
  ⟨f.grows.1, f.grows.2, f.minter, f.recipients⟩

/-- The invariant behind THX-7. -/
def Inv (s : State) : Prop :=
  s.participants.Nodup ∧ (∀ a, a ∉ s.participants → s.minted a = 0) ∧
    s.supply = (s.participants.map s.minted).sum

theorem sum_delta {op : Op} {l : List Nat} (hn : l.Nodup)
    (hm : ∀ o v, mintedBy op = some (o, v) → o ∈ l) :
    (l.map (delta op)).sum = total op := by
  unfold total
  split
  · rename_i o v hmb
    have : l.map (delta op) = l.map fun a => if a = o then v else 0 :=
      List.map_congr_left fun a _ => by simp [delta, hmb]
    rw [this]
    exact sum_map_single l o v hn (hm o v hmb)
  · rename_i hmb
    apply sum_map_zero
    intro a _
    unfold delta
    split
    · rename_i o v h; rw [hmb] at h; cases h
    · rfl

theorem inv_step {env : Env} {s s' : State} {op : Op} (hi : Inv s) (h : step env s op = .ok s') :
    Inv s' := by
  obtain ⟨hn, hz, hsum⟩ := hi
  have f := step_frame h
  have hn' := f.grows.2 hn
  obtain ⟨q, hq⟩ := f.grows.1
  have hdz : ∀ a, a ∉ s'.participants → delta op a = 0 := by
    intro a ha
    unfold delta
    split
    · rename_i o v hm
      have := f.minter o v hm
      split
      · rename_i hao; subst hao; exact absurd this ha
      · rfl
    · rfl
  refine ⟨hn', fun a ha => ?_, ?_⟩
  · rw [f.minted a, hdz a ha, hz a (fun h => ha (f.grows.mem h))]
  · have hmint : (s'.participants.map s'.minted).sum =
        (s'.participants.map s.minted).sum + (s'.participants.map (delta op)).sum := by
      rw [← sum_map_add]; congr 1; exact List.map_congr_left fun a _ => f.minted a
    have hq0 : (q.map s.minted).sum = 0 := by
      apply sum_map_zero
      intro a ha
      apply hz
      intro hp
      rw [← hq] at hn'
      exact (List.nodup_append.mp hn').2.2 a hp a ha rfl
    rw [hmint, sum_delta hn' f.minter, f.supply, hsum, ← hq, List.map_append, List.sum_append,
      hq0, Nat.add_zero]

theorem inv_run (env : Env) (ops : List Op) (s : State) (hi : Inv s) : Inv (run env s ops) := by
  induction ops generalizing s with
  | nil => exact hi
  | cons op ops ih =>
    simp only [run]
    split
    · rename_i s' h; exact ih s' (inv_step hi h)
    · exact ih s hi

-- THX-7: in every reachable state, totalSupply equals the sum of mintedAmount over getParticipants (each token was minted by exactly one listed participant; transfers move tokens but change neither side).
theorem supply_is_minted_sum (env : Env) (ops : List Op) :
    (run env State.init ops).supply =
      ((run env State.init ops).participants.map (run env State.init ops).minted).sum :=
  (inv_run env ops State.init ⟨List.nodup_nil, fun _ _ => rfl, rfl⟩).2.2

/-- Apply calls in order with the uint256 model (the contract). -/
def runU (env : Env) : State → List Op → State
  | s, [] => s
  | s, op :: ops => runU env (match stepU env s op with | .ok s' => s' | .error _ => s) ops

/-- Calls run on the contract end in the same state as the unbounded model run
on a sub-list of them (the calls that overflowed are dropped), so the principles
about call sequences above (THX-3, 4, 5, 7) hold for the contract too. -/
theorem runU_is_run (env : Env) (ops : List Op) (s : State) :
    ∃ ops', ops'.Sublist ops ∧ runU env s ops = run env s ops' := by
  induction ops generalizing s with
  | nil => exact ⟨[], List.Sublist.slnil, rfl⟩
  | cons op ops ih =>
    rcases rel_step env s op with h | h
    · obtain ⟨ops', hs, he⟩ := ih s
      refine ⟨ops', hs.cons op, ?_⟩
      simp only [runU, h]; exact he
    · cases hu : stepU env s op with
      | ok s' =>
        obtain ⟨ops', hs, he⟩ := ih s'
        refine ⟨op :: ops', hs.cons_cons op, ?_⟩
        rw [hu] at h
        simp only [runU, run, hu, ← h]; exact he
      | error e =>
        obtain ⟨ops', hs, he⟩ := ih s
        refine ⟨op :: ops', hs.cons_cons op, ?_⟩
        rw [hu] at h
        simp only [runU, run, hu, ← h]; exact he

-- THX-8: whenever the contract does not revert with Panic 0x11 (overflow), each call does exactly what the unbounded model does (the same new state, or the same revert reason), mintableAmount returns the unbounded model's value, and any sequence of contract calls ends in the state the unbounded model reaches on the same calls minus the overflowed ones.
theorem contract_refines (env : Env) (s : State) (op : Op) (o : Nat) (roles : List RoleRef)
    (ops : List Op) :
    Rel (stepU env s op) (step env s op) ∧ Sim (U.mintable env s o roles) (mintable env s o roles) ∧
      ∃ ops', ops'.Sublist ops ∧ runU env s ops = run env s ops' :=
  ⟨rel_step env s op, sim_mintable env s o roles, runU_is_run env ops s⟩

end Spec.ThanksToken
