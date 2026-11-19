/-
Principles of HatsFractionTokenModule, proven against the model in `Model.lean`
and carried over to the uint256 model (`Contract.lean`) by `Refinement.lean`.

Each principle theorem carries its ID in the comment line directly above it
(`-- HFT-n: ...`). The ID matches the Principles table in
pkgs/document/docs/protocol/modules/hats-fraction-token-module.md and the
`[HFT-n]` tags in pkgs/contract/test. `scripts/check-spec-ids.mjs` checks that
the three agree.
-/
import Spec.HatsFractionTokenModule.Refinement

namespace Spec.HatsFractionTokenModule

/-! ## Sums over a list with one point updated -/

theorem upd_self {α β : Type} [DecidableEq α] (f : α → β) (a : α) (b : β) : upd f a b a = b := by
  simp [upd]

theorem upd_other {α β : Type} [DecidableEq α] (f : α → β) {a x : α} (b : β) (h : x ≠ a) :
    upd f a b x = f x := by
  simp [upd, h]

theorem upd_same {α β : Type} [DecidableEq α] (f : α → β) (a : α) : upd f a (f a) = f := by
  funext x; unfold upd; split <;> simp_all

theorem sum_upd_not_mem (f : Addr → Nat) {a : Addr} (x : Nat) {l : List Addr} (h : a ∉ l) :
    (l.map (upd f a x)).sum = (l.map f).sum := by
  induction l with
  | nil => rfl
  | cons b l ih =>
    simp only [List.mem_cons, not_or] at h
    simp only [List.map_cons, List.sum_cons, ih h.2, upd_other f x (Ne.symm h.1)]

theorem sum_upd_mem (f : Addr → Nat) {a : Addr} (x : Nat) {l : List Addr} (hn : l.Nodup)
    (h : a ∈ l) : (l.map (upd f a x)).sum + f a = (l.map f).sum + x := by
  induction l with
  | nil => cases h
  | cons b l ih =>
    rw [List.nodup_cons] at hn
    simp only [List.map_cons, List.sum_cons]
    by_cases hab : a = b
    · subst hab
      rw [upd_self, sum_upd_not_mem f x hn.1]
      omega
    · have hl : a ∈ l := by
        rcases List.mem_cons.mp h with h | h
        · exact absurd h hab
        · exact h
      rw [upd_other f x (Ne.symm hab)]
      have := ih hn.2 hl
      omega

theorem le_sum_of_mem (f : Addr → Nat) {a : Addr} {l : List Addr} (h : a ∈ l) :
    f a ≤ (l.map f).sum := by
  induction l with
  | nil => cases h
  | cons b l ih =>
    simp only [List.map_cons, List.sum_cons]
    rcases List.mem_cons.mp h with rfl | h
    · omega
    · have := ih h; omega

/-! ## The holders of a share -/

/-- The recipients of a share other than its wearer. -/
def others (l : List Addr) (wearer : Addr) : List Addr := l.filter (· != wearer)

/-- What the balances of a share's holders add up to: the wearer's own balance,
plus every other recipient's. -/
def holdersSum (f : Addr → Nat) (l : List Addr) (wearer : Addr) : Nat :=
  f wearer + ((others l wearer).map f).sum

theorem mem_others {l : List Addr} {wearer a : Addr} : a ∈ others l wearer ↔ a ∈ l ∧ a ≠ wearer := by
  simp [others, List.mem_filter]

theorem holdersSum_upd (f : Addr → Nat) {l : List Addr} {wearer a : Addr} (x : Nat)
    (hn : (others l wearer).Nodup) (ha : a ∈ l ∨ a = wearer) :
    holdersSum (upd f a x) l wearer + f a = holdersSum f l wearer + x := by
  unfold holdersSum
  by_cases haw : a = wearer
  · subst haw
    have : a ∉ others l a := fun h => (mem_others.mp h).2 rfl
    rw [upd_self, sum_upd_not_mem f x this]
    omega
  · have hm : a ∈ others l wearer := mem_others.mpr ⟨ha.resolve_right haw, haw⟩
    rw [upd_other f x (Ne.symm haw)]
    have := sum_upd_mem f x hn hm
    omega

theorem le_holdersSum (f : Addr → Nat) {l : List Addr} {wearer a : Addr}
    (ha : a ∈ l ∨ a = wearer) : f a ≤ holdersSum f l wearer := by
  unfold holdersSum
  by_cases haw : a = wearer
  · subst haw; omega
  · have := le_sum_of_mem f (mem_others.mpr ⟨ha.resolve_right haw, haw⟩); omega

theorem others_push_wearer (l : List Addr) (wearer : Addr) :
    others (l ++ [wearer]) wearer = others l wearer := by
  simp [others, List.filter_append]

theorem others_push_new (l : List Addr) {wearer a : Addr} (h : a ≠ wearer) :
    others (l ++ [a]) wearer = others l wearer ++ [a] := by
  simp [others, List.filter_append, h]

/-! ## The state invariant -/

/-- HFT-1, HFT-2 and HFT-4 together; every reachable state satisfies it. -/
structure Inv (s : State) : Prop where
  sum : ∀ sh, holdersSum (s.bal sh) (s.recipients sh) sh.wearer = s.supply sh
  listed : ∀ sh a, 0 < s.bal sh a → a ∈ s.recipients sh
  once : ∀ sh, (others (s.recipients sh) sh.wearer).Nodup

theorem inv_init : Inv State.init :=
  ⟨fun _ => by simp [holdersSum, others, State.init],
   fun _ _ h => by simp [State.init] at h,
   fun _ => by simp [others, State.init]⟩

/-- A change confined to one share keeps the invariant if it holds at that share. -/
theorem inv_of_at {s s' : State} (h : Inv s) (sh : Share)
    (hb : ∀ sh', sh' ≠ sh → s'.bal sh' = s.bal sh')
    (hr : ∀ sh', sh' ≠ sh → s'.recipients sh' = s.recipients sh')
    (hs : ∀ sh', sh' ≠ sh → s'.supply sh' = s.supply sh')
    (hsum : holdersSum (s'.bal sh) (s'.recipients sh) sh.wearer = s'.supply sh)
    (hl : ∀ a, 0 < s'.bal sh a → a ∈ s'.recipients sh)
    (ho : (others (s'.recipients sh) sh.wearer).Nodup) : Inv s' := by
  refine ⟨fun sh' => ?_, fun sh' a ha => ?_, fun sh' => ?_⟩
  · by_cases e : sh' = sh
    · subst e; exact hsum
    · rw [hb sh' e, hr sh' e, hs sh' e]; exact h.sum sh'
  · by_cases e : sh' = sh
    · subst e; exact hl a ha
    · rw [hb sh' e] at ha; rw [hr sh' e]; exact h.listed sh' a ha
  · by_cases e : sh' = sh
    · subst e; exact ho
    · rw [hr sh' e]; exact h.once sh'

theorem setBal_self (s : State) (sh : Share) (a : Addr) (v : Nat) :
    (s.setBal sh a v).bal sh = upd (s.bal sh) a v := by simp [State.setBal, upd]

theorem setBal_other (s : State) {sh sh' : Share} (a : Addr) (v : Nat) (e : sh' ≠ sh) :
    (s.setBal sh a v).bal sh' = s.bal sh' := by simp [State.setBal, upd, e]

/-- `balanceOf(a)` of share `sh` set to `x`: the holders' sum moves by the same amount. -/
theorem holdersSum_setBal {s : State} (h : Inv s) {sh : Share} {a : Addr} (x : Nat)
    (ha : a ∈ s.recipients sh ∨ a = sh.wearer) :
    holdersSum ((s.setBal sh a x).bal sh) (s.recipients sh) sh.wearer + s.bal sh a =
      s.supply sh + x := by
  rw [setBal_self, holdersSum_upd _ _ (h.once sh) ha, h.sum sh]

/-! ### Minting -/

/-- What `_mint` does when it succeeds. -/
def credit (s : State) (sh : Share) (a : Addr) (v : Nat) : State :=
  { s.setBal sh a (s.bal sh a + v) with
    supply := upd s.supply sh (s.supply sh + v), supplyAll := s.supplyAll + v }

theorem mintTo_ok {s s' : State} {to : Addr} {sh : Share} {v : Nat}
    (h : mintTo natAdd s to sh v = .ok s') : s' = credit s sh to v := by
  unfold mintTo natAdd at h
  split at h
  · cases h
  · cases h; rfl

theorem inv_credit {s : State} (h : Inv s) (sh : Share) (v : Nat)
    (hw : sh.wearer ∈ s.recipients sh) : Inv (credit s sh sh.wearer v) := by
  have hsum := holdersSum_setBal h (sh := sh) (s.bal sh sh.wearer + v) (Or.inr rfl)
  refine inv_of_at h sh (fun sh' e => setBal_other s _ _ e)
    (fun _ _ => rfl) (fun sh' e => by simp [credit, upd, e]) ?_ ?_ (h.once sh)
  · simp only [credit, upd_self]
    change holdersSum ((s.setBal sh sh.wearer (s.bal sh sh.wearer + v)).bal sh)
      (s.recipients sh) sh.wearer = s.supply sh + v
    omega
  · intro a ha
    by_cases e : a = sh.wearer
    · subst e; exact hw
    · simp only [credit, setBal_self, upd_other _ _ e] at ha
      exact h.listed sh a ha

theorem inv_push_wearer {s : State} (h : Inv s) (sh : Share) : Inv (s.push sh sh.wearer) := by
  refine inv_of_at h sh (fun _ _ => rfl) (fun sh' e => by simp [State.push, upd, e])
    (fun _ _ => rfl) ?_ ?_ ?_
  · simp only [State.push, upd_self, holdersSum, others_push_wearer]
    exact h.sum sh
  · intro a ha
    simp only [State.push, upd_self, List.mem_append]
    exact Or.inl (h.listed sh a ha)
  · simp only [State.push, upd_self, others_push_wearer]; exact h.once sh

theorem bind_ok {α β : Type} {u : M α} {g : α → M β} {r : β} (h : (u >>= g) = .ok r) :
    ∃ a, u = .ok a ∧ g a = .ok r := by
  cases u with
  | ok a => exact ⟨a, rfl, h⟩
  | error e => cases h

theorem credit_push (s : State) (sh sh' : Share) (a b : Addr) (v : Nat) :
    (credit s sh a v).push sh' b = credit (s.push sh' b) sh a v := rfl

/-- What `mintInitialSupply` does when it succeeds. -/
theorem mintInitialSupply_ok {w : World} {s s' : State} {sender : Addr} {hat : Hat}
    {wearer : Addr} {amount : Nat}
    (hok : mintInitialSupply natAdd w s sender hat wearer amount = .ok s') :
    s' = credit (s.push (hat, wearer) wearer) (hat, wearer) wearer
      (if amount = 0 then w.default else amount) := by
  unfold mintInitialSupply at hok
  obtain ⟨_, _, hok⟩ := bind_ok hok
  dsimp only at hok
  split at hok
  · cases hok
  · obtain ⟨_, hm, hok⟩ := bind_ok hok
    cases hok
    rw [mintTo_ok hm, credit_push]

theorem inv_mintInitialSupply {w : World} {s s' : State} {sender : Addr} {hat : Hat}
    {wearer : Addr} {amount : Nat} (h : Inv s)
    (hok : mintInitialSupply natAdd w s sender hat wearer amount = .ok s') : Inv s' := by
  rw [mintInitialSupply_ok hok]
  exact inv_credit (inv_push_wearer h (hat, wearer)) (hat, wearer) _
    (by simp [State.push, upd_self])

/-! ### Burning -/

theorem setBal_same (s : State) (sh : Share) (a : Addr) :
    s.setBal sh a (s.bal sh a) = s := by
  simp only [State.setBal, upd_same]

/-- What `_burn` does when it succeeds. -/
def debit (s : State) (sh : Share) (a : Addr) (v : Nat) : State :=
  { s.setBal sh a (s.bal sh a - v) with
    supply := upd s.supply sh (s.supply sh - v), supplyAll := s.supplyAll - v }

theorem burnFrom_ok {s s' : State} {src : Addr} {sh : Share} {v : Nat}
    (hok : burnFrom s src sh v = .ok s') : v ≤ s.bal sh src ∧ s' = debit s sh src v := by
  unfold burnFrom at hok
  split at hok
  · cases hok
  · dsimp only at hok
    split at hok
    · cases hok
    · cases hok; exact ⟨by omega, rfl⟩

theorem inv_burnFrom {s s' : State} {src : Addr} {sh : Share} {v : Nat} (h : Inv s)
    (hok : burnFrom s src sh v = .ok s') : Inv s' := by
  obtain ⟨hv, rfl⟩ := burnFrom_ok hok
  by_cases v0 : v = 0
  · subst v0
    simp only [debit, Nat.sub_zero, setBal_same s, upd_same]
    exact h
  · have ha : src ∈ s.recipients sh ∨ src = sh.wearer := Or.inl (h.listed sh src (by omega))
    have hsum := holdersSum_setBal h (sh := sh) (s.bal sh src - v) ha
    have hle : s.bal sh src ≤ s.supply sh := h.sum sh ▸ le_holdersSum _ ha
    refine inv_of_at h sh (fun sh' e => setBal_other s _ _ e) (fun _ _ => rfl)
      (fun sh' e => by simp [debit, upd, e]) ?_ ?_ (h.once sh)
    · simp only [debit, upd_self]
      change holdersSum ((s.setBal sh src (s.bal sh src - v)).bal sh) (s.recipients sh)
        sh.wearer = s.supply sh - v
      omega
    · intro a ha'
      simp only [debit, setBal_self] at ha'
      by_cases e : a = src
      · subst e; simp only [upd_self] at ha'; exact h.listed sh a (by omega)
      · rw [upd_other _ _ e] at ha'; exact h.listed sh a ha'

/-! ### Transfers -/

def State.withRecipients (s : State) (r : Share → List Addr) : State := { s with recipients := r }

/-- What one successful `(id, value)` of `_update(src, dst, …)` does. -/
def move (src dst : Addr) (s : State) (sh : Share) (v : Nat) : State :=
  let s₁ := s.setBal sh src (s.bal sh src - v)
  s₁.setBal sh dst (s₁.bal sh dst + v)

theorem moveOne_ok {src dst : Addr} {s s' : State} {sh : Share} {v : Nat}
    (h : moveOne natAdd src dst s (sh, v) = .ok s') : v ≤ s.bal sh src ∧ s' = move src dst s sh v := by
  unfold moveOne natAdd at h
  dsimp only at h
  split at h
  · cases h
  · cases h; exact ⟨by omega, rfl⟩

theorem moveOne_withRecipients {src dst : Addr} (s : State) (r : Share → List Addr)
    (p : Share × Nat) :
    moveOne natAdd src dst (s.withRecipients r) p =
      (fun s => s.withRecipients r) <$> moveOne natAdd src dst s p := by
  obtain ⟨sh, v⟩ := p
  unfold moveOne natAdd
  dsimp only
  change (if s.bal sh src < v then _ else _) = _
  by_cases hb : s.bal sh src < v <;> simp only [hb, ↓reduceIte] <;> rfl

theorem foldMove_withRecipients {src dst : Addr} (r : Share → List Addr) (L : List (Share × Nat))
    (s : State) :
    L.foldlM (moveOne natAdd src dst) (s.withRecipients r) =
      (fun s => s.withRecipients r) <$> L.foldlM (moveOne natAdd src dst) s := by
  induction L generalizing s with
  | nil => rfl
  | cons p L ih =>
    simp only [List.foldlM_cons, moveOne_withRecipients]
    cases moveOne natAdd src dst s p with
    | error e => rfl
    | ok s₁ => exact ih s₁

/-- Moves change only balances. -/
theorem foldMove_frame {src dst : Addr} : ∀ (L : List (Share × Nat)) (s s' : State),
    L.foldlM (moveOne natAdd src dst) s = .ok s' →
      s'.recipients = s.recipients ∧ s'.supply = s.supply ∧ s'.supplyAll = s.supplyAll
  | [], s, s', h => by cases h; exact ⟨rfl, rfl, rfl⟩
  | p :: L, s, s', h => by
    simp only [List.foldlM_cons] at h
    obtain ⟨s₁, h₁, h⟩ := bind_ok h
    obtain ⟨sh, v⟩ := p
    obtain ⟨_, rfl⟩ := moveOne_ok h₁
    have := foldMove_frame L _ _ h
    exact this

theorem inv_move {src dst : Addr} {s : State} {sh : Share} {v : Nat} (h : Inv s)
    (hv : v ≤ s.bal sh src) (hd : dst ∈ s.recipients sh) : Inv (move src dst s sh v) := by
  have hg : holdersSum (upd (s.bal sh) src (s.bal sh src - v)) (s.recipients sh) sh.wearer + v =
      s.supply sh := by
    by_cases v0 : v = 0
    · subst v0
      simp only [Nat.sub_zero, upd_same, Nat.add_zero]; exact h.sum sh
    · have ha : src ∈ s.recipients sh ∨ src = sh.wearer := Or.inl (h.listed sh src (by omega))
      have := holdersSum_upd (s.bal sh) (s.bal sh src - v) (h.once sh) ha
      rw [h.sum sh] at this
      omega
  generalize hgdef : upd (s.bal sh) src (s.bal sh src - v) = g at hg
  have hgd := holdersSum_upd g (g dst + v) (h.once sh) (Or.inl hd)
  refine inv_of_at h sh ?_ (fun _ _ => rfl) (fun _ _ => rfl) ?_ ?_ (h.once sh)
  · intro sh' e
    simp only [move, setBal_other _ _ _ e]
  · simp only [move, setBal_self]
    rw [hgdef]
    change holdersSum (upd g dst (g dst + v)) (s.recipients sh) sh.wearer = s.supply sh
    omega
  · intro a ha
    simp only [move, setBal_self] at ha
    rw [hgdef] at ha
    change 0 < upd g dst (g dst + v) a at ha
    change a ∈ s.recipients sh
    by_cases e : a = dst
    · subst e; exact hd
    · rw [upd_other _ _ e] at ha
      by_cases e' : a = src
      · subst e'; rw [← hgdef, upd_self] at ha; exact h.listed sh a (by omega)
      · rw [← hgdef, upd_other _ _ e'] at ha; exact h.listed sh a ha

theorem foldMove_inv {src dst : Addr} : ∀ (L : List (Share × Nat)) (s s' : State), Inv s →
    (∀ p ∈ L, dst ∈ s.recipients p.1) →
    L.foldlM (moveOne natAdd src dst) s = .ok s' → Inv s'
  | [], s, s', h, _, hok => by cases hok; exact h
  | p :: L, s, s', h, hd, hok => by
    simp only [List.foldlM_cons] at hok
    obtain ⟨s₁, h₁, hok⟩ := bind_ok hok
    obtain ⟨sh, v⟩ := p
    obtain ⟨hv, rfl⟩ := moveOne_ok h₁
    exact foldMove_inv L _ _ (inv_move h hv (hd _ (List.mem_cons_self ..)))
      (fun q hq => hd q (List.mem_cons_of_mem _ hq)) hok

/-! ### Adding recipients -/

def pushNewR (r : Share → List Addr) (sh : Share) (a : Addr) : Share → List Addr :=
  if a ∈ r sh then r else upd r sh (r sh ++ [a])

def pushAllR (ids : List Share) (a : Addr) (r : Share → List Addr) : Share → List Addr :=
  ids.foldl (fun r id => pushNewR r id a) r

theorem pushNew_eq (s : State) (sh : Share) (a : Addr) :
    s.pushNew sh a = s.withRecipients (pushNewR s.recipients sh a) := by
  unfold State.pushNew pushNewR
  split <;> rfl

theorem foldl_pushNew (ids : List Share) (a : Addr) (s : State) :
    ids.foldl (fun s id => s.pushNew id a) s = s.withRecipients (pushAllR ids a s.recipients) := by
  induction ids generalizing s with
  | nil => rfl
  | cons id ids ih =>
    simp only [List.foldl_cons, pushAllR]
    rw [ih, pushNew_eq]
    rfl

theorem prefix_pushNewR (r : Share → List Addr) (sh : Share) (a : Addr) (sh' : Share) :
    r sh' <+: pushNewR r sh a sh' := by
  unfold pushNewR
  split
  · exact List.prefix_refl _
  · by_cases e : sh' = sh
    · subst e; rw [upd_self]; exact List.prefix_append _ _
    · rw [upd_other _ _ e]; exact List.prefix_refl _

theorem prefix_pushAllR (ids : List Share) (a : Addr) (r : Share → List Addr) (sh : Share) :
    r sh <+: pushAllR ids a r sh := by
  induction ids generalizing r with
  | nil => exact List.prefix_refl _
  | cons id ids ih => exact (prefix_pushNewR r id a sh).trans (ih _)

theorem mem_pushAllR {ids : List Share} {a : Addr} (r : Share → List Addr) {sh : Share}
    (h : sh ∈ ids) : a ∈ pushAllR ids a r sh := by
  induction ids generalizing r with
  | nil => cases h
  | cons id ids ih =>
    rcases List.mem_cons.mp h with rfl | h
    · have : a ∈ pushNewR r sh a sh := by
        unfold pushNewR; split
        · assumption
        · simp [upd_self]
      exact (prefix_pushAllR ids a _ sh).subset this
    · exact ih _ h

theorem inv_pushNew {s : State} (h : Inv s) (sh : Share) (a : Addr) : Inv (s.pushNew sh a) := by
  unfold State.pushNew
  split
  · exact h
  · rename_i ha
    by_cases e : a = sh.wearer
    · subst e; exact inv_push_wearer h sh
    · have h0 : s.bal sh a = 0 := by
        have := h.listed sh a; by_cases p : 0 < s.bal sh a
        · exact absurd (this p) ha
        · omega
      refine inv_of_at h sh (fun _ _ => rfl) (fun sh' e' => by simp [State.push, upd, e'])
        (fun _ _ => rfl) ?_ ?_ ?_
      · simp only [State.push, upd_self, holdersSum, others_push_new _ e, List.map_append,
          List.sum_append, List.map_cons, List.map_nil, List.sum_cons, List.sum_nil, h0]
        have := h.sum sh; simp only [holdersSum] at this; omega
      · intro b hb
        simp only [State.push, upd_self, List.mem_append]
        exact Or.inl (h.listed sh b hb)
      · simp only [State.push, upd_self, others_push_new _ e, List.nodup_append]
        refine ⟨h.once sh, by simp, ?_⟩
        intro x hx y hy
        simp only [List.mem_cons, List.not_mem_nil, or_false] at hy
        subst hy
        intro hxa; subst hxa
        exact ha (mem_others.mp hx).1

theorem inv_foldl_pushNew (ids : List Share) (a : Addr) :
    ∀ s : State, Inv s → Inv (ids.foldl (fun s id => s.pushNew id a) s) := by
  induction ids with
  | nil => intro s h; exact h
  | cons id ids ih => intro s h; exact ih _ (inv_pushNew h id a)

/-- `transferCore` succeeds only by running every move. -/
theorem transferCore_ok {s s' : State} {sender src dst : Addr} {ids : List Share}
    {amounts : List Nat} (h : transferCore natAdd s sender src dst ids amounts = .ok s') :
    (ids.zip amounts).foldlM (moveOne natAdd src dst) s = .ok s' := by
  unfold transferCore at h
  -- four checks that throw, then the moves
  iterate 4
    try dsimp only at h
    split at h
    · cases h
  exact h

/-- A transfer followed by adding the receiver to each id's recipients. -/
theorem inv_transfer {s s₂ : State} {sender src dst : Addr} {ids : List Share}
    {amounts : List Nat} (h : Inv s) (hok : transferCore natAdd s sender src dst ids amounts = .ok s₂) :
    Inv (ids.foldl (fun s id => s.pushNew id dst) s₂) := by
  have hf := transferCore_ok hok
  have hframe := foldMove_frame _ _ _ hf
  rw [foldl_pushNew, hframe.1]
  have hp := foldMove_withRecipients (src := src) (dst := dst) (pushAllR ids dst s.recipients)
    (ids.zip amounts) s
  rw [hf] at hp
  refine foldMove_inv _ _ _ ?_ ?_ hp
  · have := inv_foldl_pushNew ids dst s h
    rwa [foldl_pushNew] at this
  · intro p hp'
    exact mem_pushAllR _ (List.of_mem_zip hp').1

/-! ## One transaction, then a sequence -/

theorem foldlM_preserve {α : Type} (P : State → Prop) {f : State → α → M State}
    (hf : ∀ s x s', P s → f s x = .ok s' → P s') :
    ∀ (L : List α) (s s' : State), P s → L.foldlM f s = .ok s' → P s'
  | [], s, s', hs, hok => by cases hok; exact hs
  | x :: L, s, s', hs, hok => by
    simp only [List.foldlM_cons] at hok
    obtain ⟨s₁, h₁, hok⟩ := bind_ok hok
    exact foldlM_preserve P hf L s₁ s' (hf s x s₁ hs h₁) hok

/-! ### What each successful transaction did -/

theorem step_mint_ok {w : World} {s s' : State} {sender : Addr} {hat : Hat} {wearer : Addr}
    {amount : Nat} (hok : step natAdd w s (.mint sender hat wearer amount) = .ok s') :
    0 < s.bal (hat, wearer) wearer ∧ s' = credit s (hat, wearer) wearer amount := by
  simp only [step] at hok
  obtain ⟨_, _, hok⟩ := bind_ok hok
  split at hok
  · cases hok
  · exact ⟨Nat.pos_of_ne_zero ‹_›, mintTo_ok hok⟩

theorem step_burn_ok {w : World} {s s' : State} {sender : Addr} {hat : Hat} {wearer target : Addr}
    {amount : Nat} (hok : step natAdd w s (.burn sender hat wearer target amount) = .ok s') :
    burnFrom s target (hat, wearer) amount = .ok s' := by
  simp only [step] at hok
  obtain ⟨_, _, hok⟩ := bind_ok hok
  exact hok

/-- Both transfers: `transferCore`, then the receiver joins each id's recipients. -/
def TransferOk (s s' : State) : Op → Prop
  | .safeTransferFrom sender src dst id amount =>
    ∃ s₂, transferCore natAdd s sender src dst [id] [amount] = .ok s₂ ∧
      s' = [id].foldl (fun s id => s.pushNew id dst) s₂
  | .safeBatchTransferFrom sender src dst ids amounts =>
    ∃ s₂, transferCore natAdd s sender src dst ids amounts = .ok s₂ ∧
      s' = ids.foldl (fun s id => s.pushNew id dst) s₂
  | _ => False

theorem step_safeTransferFrom_ok {w : World} {s s' : State} {sender src dst : Addr} {id : Share}
    {amount : Nat} (hok : step natAdd w s (.safeTransferFrom sender src dst id amount) = .ok s') :
    TransferOk s s' (.safeTransferFrom sender src dst id amount) := by
  simp only [step] at hok
  split at hok
  · cases hok
  · obtain ⟨s₂, h₂, hok⟩ := bind_ok hok
    cases hok
    exact ⟨s₂, h₂, rfl⟩

theorem step_safeBatchTransferFrom_ok {w : World} {s s' : State} {sender src dst : Addr}
    {ids : List Share} {amounts : List Nat}
    (hok : step natAdd w s (.safeBatchTransferFrom sender src dst ids amounts) = .ok s') :
    TransferOk s s' (.safeBatchTransferFrom sender src dst ids amounts) := by
  simp only [step] at hok
  obtain ⟨_, _, hok⟩ := bind_ok hok
  obtain ⟨s₂, h₂, hok⟩ := bind_ok hok
  cases hok
  exact ⟨s₂, h₂, rfl⟩

/-- The initial mints a successful `batchMintInitialSupply` ran, in order. -/
theorem step_batchMint_preserve (P : State → Prop) {w : World} {s s' : State} {sender : Addr}
    {hats : List Hat} {wearers : List Addr} {amounts : List Nat}
    (hf : ∀ s s' sender hat wearer amount, P s →
      mintInitialSupply natAdd w s sender hat wearer amount = .ok s' → P s')
    (hs : P s) (hok : step natAdd w s (.batchMintInitialSupply sender hats wearers amounts) = .ok s') :
    P s' := by
  simp only [step] at hok
  split at hok
  · cases hok
  · obtain ⟨_, _, hok⟩ := bind_ok hok
    exact foldlM_preserve P (fun _ x _ hp hx => by
      obtain ⟨_, _, _⟩ := x; exact hf _ _ _ _ _ _ hp hx) _ _ _ hs hok

theorem step_setApprovalForAll_ok {w : World} {s s' : State} {sender operator : Addr}
    {approved : Bool} (hok : step natAdd w s (.setApprovalForAll sender operator approved) = .ok s') :
    s'.bal = s.bal ∧ s'.recipients = s.recipients ∧ s'.supply = s.supply := by
  simp only [step] at hok
  split at hok
  · cases hok
  · cases hok; exact ⟨rfl, rfl, rfl⟩

/-! ### The invariant and `Grows` hold across a transaction -/

theorem inv_transferOk {s s' : State} {op : Op} (h : Inv s) (ht : TransferOk s s' op) : Inv s' := by
  cases op <;> try exact ht.elim
  all_goals obtain ⟨_, h₂, rfl⟩ := ht; exact inv_transfer h h₂

theorem inv_step {w : World} {s s' : State} {op : Op} (h : Inv s)
    (hok : step natAdd w s op = .ok s') : Inv s' := by
  cases op with
  | mintInitialSupply => exact inv_mintInitialSupply h hok
  | batchMintInitialSupply => exact step_batchMint_preserve Inv (fun _ _ _ _ _ _ => inv_mintInitialSupply) h hok
  | mint _ hat wearer amount =>
    obtain ⟨hb, rfl⟩ := step_mint_ok hok
    exact inv_credit h (hat, wearer) amount (h.listed _ _ hb)
  | burn => exact inv_burnFrom h (step_burn_ok hok)
  | safeTransferFrom => exact inv_transferOk h (step_safeTransferFrom_ok hok)
  | safeBatchTransferFrom => exact inv_transferOk h (step_safeBatchTransferFrom_ok hok)
  | setApprovalForAll =>
    obtain ⟨hb, hr, hs⟩ := step_setApprovalForAll_ok hok
    exact ⟨fun sh => by rw [hb, hr, hs]; exact h.sum sh, fun sh a => by rw [hb, hr]; exact h.listed sh a,
      fun sh => by rw [hr]; exact h.once sh⟩

/-- Whether every share's recipient list of `s` is a prefix of the one in `s'`. -/
def Grows (s s' : State) : Prop := ∀ sh, s.recipients sh <+: s'.recipients sh

theorem grows_trans {s₁ s₂ s₃ : State} (h₁ : Grows s₁ s₂) (h₂ : Grows s₂ s₃) : Grows s₁ s₃ :=
  fun sh => (h₁ sh).trans (h₂ sh)

theorem grows_same {s s' : State} (h : s'.recipients = s.recipients) : Grows s s' :=
  fun _ => h ▸ List.prefix_refl _

theorem grows_mintInitialSupply {w : World} {s s' : State} {sender : Addr} {hat : Hat}
    {wearer : Addr} {amount : Nat}
    (hok : mintInitialSupply natAdd w s sender hat wearer amount = .ok s') : Grows s s' := by
  rw [mintInitialSupply_ok hok]
  intro sh
  by_cases e : sh = (hat, wearer)
  · subst e; simp only [credit, State.push, State.setBal, upd_self]; exact List.prefix_append _ _
  · simp only [credit, State.push, State.setBal, upd_other _ _ e]; exact List.prefix_refl _

theorem grows_transfer {s s₂ : State} {sender src dst : Addr} {ids : List Share}
    {amounts : List Nat} (hok : transferCore natAdd s sender src dst ids amounts = .ok s₂) :
    Grows s (ids.foldl (fun s id => s.pushNew id dst) s₂) ∧ s₂.supply = s.supply ∧
      s₂.supplyAll = s.supplyAll := by
  have hframe := foldMove_frame _ _ _ (transferCore_ok hok)
  refine ⟨fun sh => ?_, hframe.2⟩
  rw [foldl_pushNew]
  change s.recipients sh <+: pushAllR ids dst s₂.recipients sh
  rw [hframe.1]
  exact prefix_pushAllR _ _ _ _

/-- Transfers: recipient lists only grow, supplies stay. -/
theorem transferOk_frame {s s' : State} {op : Op} (ht : TransferOk s s' op) :
    Grows s s' ∧ s'.supply = s.supply ∧ s'.supplyAll = s.supplyAll := by
  cases op <;> try exact ht.elim
  all_goals
    obtain ⟨_, h₂, rfl⟩ := ht
    have := grows_transfer h₂
    rw [foldl_pushNew] at this ⊢
    exact this

theorem grows_step {w : World} {s s' : State} {op : Op}
    (hok : step natAdd w s op = .ok s') : Grows s s' := by
  cases op with
  | mintInitialSupply => exact grows_mintInitialSupply hok
  | batchMintInitialSupply =>
    exact step_batchMint_preserve (Grows s) (fun _ _ _ _ _ _ hp hx =>
      grows_trans hp (grows_mintInitialSupply hx)) (fun _ => List.prefix_refl _) hok
  | mint => obtain ⟨_, rfl⟩ := step_mint_ok hok; exact grows_same rfl
  | burn => obtain ⟨_, rfl⟩ := burnFrom_ok (step_burn_ok hok); exact grows_same rfl
  | safeTransferFrom => exact (transferOk_frame (step_safeTransferFrom_ok hok)).1
  | safeBatchTransferFrom => exact (transferOk_frame (step_safeBatchTransferFrom_ok hok)).1
  | setApprovalForAll => exact grows_same (step_setApprovalForAll_ok hok).2.1

/-- A successful uint256 transaction is a successful unbounded one. -/
theorem step_of_stepU {w : World} {s s' : State} {op : Op} (h : stepU w s op = .ok s') :
    step natAdd w s op = .ok s' := by
  rcases relE_stepU w s op with e | e <;> rw [h] at e
  · exact e.symm
  · cases e

theorem inv_execU (w : World) : ∀ (ops : List Op) (s : State), Inv s → Inv (execU w s ops)
  | [], _, h => h
  | op :: ops, s, h => by
    unfold execU exec
    cases hs : step uAdd w s op with
    | ok s' => exact inv_execU w ops s' (inv_step h (step_of_stepU hs))
    | error _ => exact inv_execU w ops s h

theorem inv_reachable (w : World) (ops : List Op) : Inv (execU w State.init ops) :=
  inv_execU w ops _ inv_init

/-! ## Principles of the contract (uint256 model)

`execU w State.init ops` is the state after any sequence of transactions
`ops` (reverted ones change nothing), starting from a freshly set-up module. -/

-- HFT-1: the supply of a share is exactly the wearer's balance plus the balance of every other account in its recipient list.
theorem hft1_supply_is_holders_sum (w : World) (ops : List Op) (sh : Share) :
    let s := execU w State.init ops
    s.bal sh sh.wearer + ((others (s.recipients sh) sh.wearer).map (s.bal sh)).sum = s.supply sh :=
  (inv_reachable w ops).sum sh

-- HFT-2: every account holding a positive balance of a share is in that share's recipient list.
theorem hft2_holders_are_listed (w : World) (ops : List Op) (sh : Share) (a : Addr) :
    let s := execU w State.init ops
    0 < s.bal sh a → a ∈ s.recipients sh :=
  (inv_reachable w ops).listed sh a

-- HFT-3: a successful transaction only appends to recipient lists: every list before it is a prefix of the list after it.
theorem hft3_recipients_only_grow (w : World) (s s' : State) (op : Op)
    (h : stepU w s op = .ok s') (sh : Share) : s.recipients sh <+: s'.recipients sh :=
  grows_step (step_of_stepU h) sh

-- HFT-4: an account other than the share's wearer appears in its recipient list at most once.
theorem hft4_others_listed_once (w : World) (ops : List Op) (sh : Share) :
    let s := execU w State.init ops
    (others (s.recipients sh) sh.wearer).Nodup :=
  (inv_reachable w ops).once sh

-- HFT-5: a successful safeTransferFrom or safeBatchTransferFrom changes neither any share's supply nor the total supply.
theorem hft5_transfer_keeps_supply (w : World) (s s' : State) (sender src dst : Addr) :
    (∀ id amount, stepU w s (.safeTransferFrom sender src dst id amount) = .ok s' →
      s'.supply = s.supply ∧ s'.supplyAll = s.supplyAll) ∧
    (∀ ids amounts, stepU w s (.safeBatchTransferFrom sender src dst ids amounts) = .ok s' →
      s'.supply = s.supply ∧ s'.supplyAll = s.supplyAll) := by
  exact ⟨fun _ _ h => (transferOk_frame (step_safeTransferFrom_ok (step_of_stepU h))).2,
    fun _ _ h => (transferOk_frame (step_safeBatchTransferFrom_ok (step_of_stepU h))).2⟩

-- HFT-6: safeTransferFrom reverts with CannotTransferAllTokens when the sender is the first entry of the share's recipient list and the amount is its whole balance.
theorem hft6_first_recipient_keeps_balance (w : World) (s : State)
    (sender src dst : Addr) (id : Share) (amount : Nat)
    (hf : s.isFirst id src = true) (hb : s.bal id src = amount) :
    stepU w s (.safeTransferFrom sender src dst id amount) = .error .cannotTransferAllTokens := by
  simp only [stepU, step, hf, hb, and_self, ↓reduceIte]; rfl

-- HFT-7: if the wearer is in its share's recipient list, totalSupply(wearer, hat) equals the sum of balanceOf(account, wearer, hat) over the wearer and the other accounts in the list; if not, totalSupply is DEFAULT_TOKEN_SUPPLY, and so is the wearer's own balanceOf when they wear the role.
theorem hft7_views (w : World) (ops : List Op) (hat : Hat) (wearer : Addr) :
    let s := execU w State.init ops
    (wearer ∈ s.recipients (hat, wearer) →
      totalSupply w s wearer hat = balanceOf w s wearer wearer hat +
        ((others (s.recipients (hat, wearer)) wearer).map fun a => balanceOf w s a wearer hat).sum) ∧
    (wearer ∉ s.recipients (hat, wearer) →
      totalSupply w s wearer hat = w.default ∧
        (w.wears wearer hat = true → balanceOf w s wearer wearer hat = w.default)) := by
  intro s
  have hinv := inv_reachable w ops
  refine ⟨fun hw => ?_, fun hw => ⟨?_, fun hwr => ?_⟩⟩
  · have hlisted : ∀ a ∈ s.recipients (hat, wearer), balanceOf w s a wearer hat = s.bal (hat, wearer) a := by
      intro a ha; simp [balanceOf, ha]
    have hmap : ((others (s.recipients (hat, wearer)) wearer).map fun a => balanceOf w s a wearer hat) =
        (others (s.recipients (hat, wearer)) wearer).map (s.bal (hat, wearer)) :=
      List.map_congr_left fun a ha => hlisted a (mem_others.mp ha).1
    rw [hmap, hlisted wearer hw]
    simp only [totalSupply, hw, not_true_eq_false, ite_false]
    exact (hinv.sum (hat, wearer)).symm
  · simp [totalSupply, hw]
  · simp [balanceOf, hw, hwr]

-- HFT-8: whenever a transaction succeeds, it leaves exactly the state the unbounded computation does, and whenever it reverts for a reason other than arithmetic overflow (Panic 0x11), the unbounded computation reverts for the same reason.
theorem hft8_uint256_matches_unbounded (w : World) (s : State) (op : Op) :
    (∀ s', stepU w s op = .ok s' → step natAdd w s op = .ok s') ∧
    (∀ e, stepU w s op = .error e → e ≠ .overflow → step natAdd w s op = .error e) := by
  refine ⟨fun _ h => step_of_stepU h, fun e h hne => ?_⟩
  rcases relE_stepU w s op with r | r <;> rw [h] at r
  · exact r.symm
  · cases r; exact absurd rfl hne

end Spec.HatsFractionTokenModule
