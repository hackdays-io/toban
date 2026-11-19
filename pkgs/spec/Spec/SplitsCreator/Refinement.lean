/-
The uint256 model (`Contract.lean`) refines the unbounded model (`Model.lean`):

  `Rel (previewU i) (preview i)`, i.e.
  * `previewU i = .ok o`               → `preview i = some o`
  * `previewU i = .error .divZero`     → `preview i = none`
  * `previewU i = .error .overflow`    → (nothing: an overflow can happen anywhere)

`Sim u a` says a computation either yields exactly `a` or overflows.
-/
import Spec.SplitsCreator.Contract

namespace Spec.SplitsCreator

def Sim {α : Type} (u : EVM α) (a : α) : Prop := u = .ok a ∨ u = .error .overflow

def Rel {α : Type} : EVM α → Option α → Prop
  | .ok a, p => p = some a
  | .error .divZero, p => p = none
  | .error .overflow, _ => True

/-! ## Except plumbing -/

theorem bind_ok_iff {α β : Type} (u : EVM α) (g : α → EVM β) (r : β) :
    (u >>= g) = .ok r ↔ ∃ a, u = .ok a ∧ g a = .ok r := by
  cases u <;> simp [bind, Except.bind]

theorem pure_eq {α : Type} (a : α) : (pure a : EVM α) = .ok a := rfl

theorem sim_pure {α : Type} (a : α) : Sim (pure a : EVM α) a := Or.inl rfl

theorem sim_bind {α β : Type} {u : EVM α} {a : α} {g : α → EVM β} {c : β}
    (hu : Sim u a) (hg : Sim (g a) c) : Sim (u >>= g) c := by
  rcases hu with h | h <;> rw [h]
  · exact hg
  · exact Or.inr rfl

theorem rel_of_sim {α : Type} {u : EVM α} {a : α} (h : Sim u a) : Rel u (some a) := by
  rcases h with h | h <;> rw [h] <;> simp [Rel]

theorem rel_none_of_not_ok {α : Type} {u : EVM α} (h : ∀ a, u ≠ .ok a) : Rel u none := by
  cases u with
  | ok a => exact absurd rfl (h a)
  | error e => cases e <;> simp [Rel]

theorem sim_then_rel {α β : Type} {u : EVM α} {a : α} {g : α → EVM β} {p : Option β}
    (hu : Sim u a) (hg : Rel (g a) p) : Rel (u >>= g) p := by
  rcases hu with h | h <;> rw [h]
  · exact hg
  · simp [bind, Except.bind, Rel]

theorem rel_bind {α β : Type} {u : EVM α} {p : Option α} {g : α → EVM β} {h : α → Option β}
    (hu : Rel u p) (hg : ∀ a, p = some a → Rel (g a) (h a)) : Rel (u >>= g) (p >>= h) := by
  cases u with
  | ok a =>
    simp only [Rel] at hu
    subst hu
    exact hg a rfl
  | error e =>
    cases e
    · simp [bind, Except.bind, Rel]
    · simp only [Rel] at hu
      subst hu
      simp [bind, Except.bind, Rel]

theorem mapM_not_ok {α β : Type} {g : α → EVM β} {l : List α} {x : α} (hx : x ∈ l)
    (hg : ∀ b, g x ≠ .ok b) : ∀ rs, l.mapM g ≠ .ok rs := by
  induction l with
  | nil => cases hx
  | cons y ys ih =>
    intro rs h
    simp only [List.mapM_cons, bind_ok_iff] at h
    obtain ⟨b, hb, bs, hbs, _⟩ := h
    rcases List.mem_cons.mp hx with rfl | hmem
    · exact hg b hb
    · exact ih hmem bs hbs

/-! ## Arithmetic -/

theorem sim_add (a b : Nat) : Sim (U.add a b) (a + b) := by
  unfold U.add; split
  · exact Or.inl rfl
  · exact Or.inr rfl

theorem sim_mul (a b : Nat) : Sim (U.mul a b) (a * b) := by
  unfold U.mul; split
  · exact Or.inl rfl
  · exact Or.inr rfl

theorem sim_div (a : Nat) {b : Nat} (hb : b ≠ 0) : Sim (U.div a b) (a / b) := by
  unfold U.div; simp only [hb, ite_false]; exact Or.inl rfl

theorem div_zero_not_ok (a : Nat) : ∀ r, U.div a 0 ≠ .ok r := by
  intro r h; simp [U.div] at h

theorem sim_sum (l : List Nat) (init : Nat) : Sim (U.sum l init) (init + l.sum) := by
  induction l generalizing init with
  | nil => simp [U.sum]; exact Or.inl rfl
  | cons x xs ih =>
    simp only [U.sum, List.foldlM_cons, List.sum_cons]
    refine sim_bind (sim_add init x) ?_
    have := ih (init + x)
    simp only [U.sum] at this
    rwa [Nat.add_assoc] at this

theorem sim_mapM {α β : Type} {g : α → EVM β} {f : α → β} (l : List α)
    (h : ∀ x ∈ l, Sim (g x) (f x)) : Sim (l.mapM g) (l.map f) := by
  induction l with
  | nil => exact Or.inl rfl
  | cons x xs ih =>
    simp only [List.mapM_cons, List.map_cons]
    refine sim_bind (h x (List.mem_cons_self ..)) (sim_bind (ih fun y hy => h y (List.mem_cons_of_mem _ hy)) ?_)
    exact sim_pure _

/-! ## Thanks side -/

theorem sim_thanksScore (w : Weights) {tb tm ws : Nat} (p : Participant)
    (htb : tb ≠ 0) (htm : tm ≠ 0) (hws : ws = w.received + w.sent) (hws0 : ws ≠ 0) :
    Sim (U.thanksScore w tb tm ws p) (p.addr, thanksScore w tb tm p) := by
  unfold U.thanksScore thanksScore
  subst hws
  exact sim_bind (sim_mul _ _) <| sim_bind (sim_mul _ _) <| sim_bind (sim_div _ htb) <|
    sim_bind (sim_mul _ _) <| sim_bind (sim_mul _ _) <| sim_bind (sim_div _ htm) <|
    sim_bind (sim_add _ _) <| sim_bind (sim_div _ hws0) (sim_pure _)

theorem thanksScore_not_ok (w : Weights) (tb tm : Nat) (p : Participant) :
    ∀ r, U.thanksScore w tb tm 0 p ≠ .ok r := by
  intro r h
  simp only [U.thanksScore, bind_ok_iff] at h
  obtain ⟨_, _, _, _, _, _, _, _, _, _, _, _, _, _, s, hs, _⟩ := h
  exact div_zero_not_ok _ s hs

theorem rel_thanksSide (w : Weights) (ps : List Participant) :
    Rel (U.thanksSide w ps) (thanksSide w ps) := by
  unfold U.thanksSide
  refine sim_then_rel (sim_sum _ 0) ?_
  refine sim_then_rel (sim_sum _ 0) ?_
  refine sim_then_rel (sim_add _ _) ?_
  simp only [Nat.zero_add]
  unfold thanksSide
  by_cases hg : 0 < totalBalance ps ∧ 0 < totalMinted ps
  · simp only [totalBalance, totalMinted] at hg ⊢
    simp only [hg, and_self, ite_true]
    by_cases hws : w.received + w.sent = 0
    · simp only [hws, ite_true]
      apply rel_none_of_not_ok
      -- someone holds thanks, so the list is not empty, and the first score
      -- divides by received + sent = 0
      cases ps with
      | nil => simp at hg
      | cons p qs =>
        exact mapM_not_ok (List.mem_cons_self ..) (thanksScore_not_ok w _ _ p)
    · simp only [hws, ite_false]
      exact rel_of_sim (sim_mapM ps fun p _ =>
        sim_thanksScore w p (by omega) (by omega) rfl hws)
  · simp only [totalBalance, totalMinted] at hg ⊢
    simp only [hg, ite_false]
    exact rel_of_sim (sim_pure _)

/-! ## Role side -/

theorem sim_effectiveBalance (m : Modules) (h : Holder) :
    Sim (U.effectiveBalance m h) (effectiveBalance m h) := by
  unfold U.effectiveBalance effectiveBalance
  split <;> first | exact sim_add _ _ | exact sim_pure _

theorem sim_holderScore (m : Modules) (mult : Nat) (w : Wearer) (h : Holder) :
    Sim (U.holderScore m mult w h) (h.addr, rawScore m mult w h) :=
  sim_bind (sim_effectiveBalance m h) <| sim_bind (sim_mul _ _) <|
    sim_bind (sim_mul _ _) (sim_pure _)

theorem sim_wearerStep (m : Modules) (mult : Nat) (acc : List Entry × Nat) (w : Wearer) :
    Sim (U.wearerStep m mult acc w) (acc.1 ++ wearerEntries m mult w, acc.2 + w.supply) :=
  sim_bind (sim_add _ _) <|
    sim_bind (sim_mapM _ fun h _ => sim_holderScore m mult w h) (sim_pure _)

theorem sim_wearers (m : Modules) (mult : Nat) (ws : List Wearer) (acc : List Entry × Nat) :
    Sim (ws.foldlM (U.wearerStep m mult) acc)
      (acc.1 ++ ws.flatMap (wearerEntries m mult), acc.2 + (ws.map Wearer.supply).sum) := by
  induction ws generalizing acc with
  | nil => simp only [List.foldlM_nil, List.flatMap_nil, List.append_nil, List.map_nil,
      List.sum_nil, Nat.add_zero]; exact sim_pure _
  | cons w ws ih =>
    simp only [List.foldlM_cons, List.flatMap_cons, List.map_cons, List.sum_cons]
    refine sim_bind (sim_wearerStep m mult acc w) ?_
    have := ih (acc.1 ++ wearerEntries m mult w, acc.2 + w.supply)
    simpa only [List.append_assoc, Nat.add_assoc] using this

theorem sim_normalize {supply : Nat} (e : Entry) (h : supply ≠ 0) :
    Sim (U.normalize supply e) (e.1, e.2 * PRECISION / supply) :=
  sim_bind (sim_mul _ _) <| sim_bind (sim_div _ h) (sim_pure _)

theorem normalize_not_ok (e : Entry) : ∀ r, U.normalize 0 e ≠ .ok r := by
  intro r h
  simp only [U.normalize, bind_ok_iff] at h
  obtain ⟨_, _, x, hx, _⟩ := h
  exact div_zero_not_ok _ x hx

theorem rel_roleEntries (m : Modules) (r : Role) :
    Rel (U.roleEntries m r) (roleEntries m r) := by
  unfold U.roleEntries roleEntries
  by_cases hb : r.multiplierBottom = 0
  · simp only [hb, ite_true]
    apply rel_none_of_not_ok
    intro a h
    rw [bind_ok_iff] at h
    obtain ⟨x, hx, _⟩ := h

    exact div_zero_not_ok _ x hx
  · simp only [hb, ite_false]
    refine sim_then_rel (sim_div _ hb) ?_
    refine sim_then_rel (sim_wearers m _ r.wearers ([], 0)) ?_
    simp only [List.nil_append, Nat.zero_add]
    change Rel (List.mapM (U.normalize (roleSupply r)) (roleRaw m r)) _
    by_cases hz : roleRaw m r ≠ [] ∧ roleSupply r = 0
    · obtain ⟨hne, h0⟩ := hz
      rw [h0]
      simp only [ne_eq, hne, not_false_eq_true, and_self, ite_true]
      apply rel_none_of_not_ok
      cases hraw : roleRaw m r with
      | nil => exact absurd hraw hne
      | cons e es => exact mapM_not_ok (List.mem_cons_self ..) (normalize_not_ok e)
    · simp only [hz, ite_false]
      by_cases h0 : roleSupply r = 0
      · have hnil : roleRaw m r = [] := by
          by_cases hne : roleRaw m r = []
          · exact hne
          · exact absurd ⟨hne, h0⟩ hz
        rw [hnil]
        exact rel_of_sim (sim_pure _)
      · exact rel_of_sim (sim_mapM _ fun e _ => sim_normalize e h0)

theorem rel_roleSide (m : Modules) (rs : List Role) :
    Rel (U.roleSide m rs) (roleSide m rs) := by
  induction rs with
  | nil => exact rel_of_sim (sim_pure _)
  | cons r rs ih =>
    exact rel_bind (rel_roleEntries m r) fun es _ =>
      rel_bind ih fun rest _ => rel_of_sim (sim_pure _)

/-! ## Combining and `preview` -/

theorem accumulate_eq_sum (l : List Entry) : accumulate l = allocSum l := by
  suffices h : ∀ a, l.foldl (fun acc e => acc + e.2) a = a + allocSum l by
    simpa [accumulate] using h 0
  induction l with
  | nil => simp [allocSum]
  | cons e es ih =>
    intro a
    simp only [List.foldl_cons, ih, allocSum, List.map_cons, List.sum_cons]
    omega

theorem sim_side (weight weightSum : Nat) (es : List Entry)
    (hws : 0 < weight → weightSum ≠ 0) :
    Sim (U.side weight (allocSum es) weightSum es) (side weight weightSum es) := by
  unfold U.side side
  by_cases hg : 0 < weight ∧ 0 < allocSum es
  · simp only [hg, and_self, ite_true]
    exact sim_mapM _ fun e _ =>
      sim_bind (sim_mul _ _) <| sim_bind (sim_mul _ _) <|
        sim_bind (sim_div _ (by omega)) <| sim_bind (sim_div _ (hws hg.1)) (sim_pure _)
  · simp only [hg, ite_false]
    exact sim_pure _

theorem sim_combine (w : Weights) (thanks roles : List Entry) :
    Sim (U.combine w thanks (allocSum thanks) roles (allocSum roles)) (combine w thanks roles) := by
  unfold U.combine combine
  refine sim_bind (sim_add _ _) ?_
  refine sim_bind (sim_side _ _ _ fun _ => by omega) ?_
  refine sim_bind (sim_side _ _ _ fun _ => by omega) ?_
  refine sim_bind (sim_sum _ 0) ?_
  simp only [Nat.zero_add, accumulate_eq_sum, allocSum]
  exact sim_pure _

/-- The uint256 model refines the unbounded one. -/
theorem rel_preview (i : Input) : Rel (previewU i) (preview i) := by
  unfold previewU preview
  exact rel_bind (rel_thanksSide _ _) fun thanks _ =>
    sim_then_rel (sim_sum _ 0) <| rel_bind (rel_roleSide _ _) fun roles _ =>
      sim_then_rel (sim_sum _ 0) <| by
        simp only [Nat.zero_add]
        exact rel_of_sim (sim_combine _ _ _)

end Spec.SplitsCreator
