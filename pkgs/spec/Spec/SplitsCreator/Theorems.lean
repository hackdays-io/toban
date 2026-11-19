/-
Principles of SplitsCreator, proven against the model in `Model.lean`.

Each principle theorem carries its ID in the comment line directly above it
(`-- SPL-n: ...`). The ID matches the Principles table in
pkgs/document/docs/protocol/modules/splits-creator.md and the `[SPL-n]` tags in
pkgs/contract/test. `scripts/check-spec-ids.mjs` checks that the three agree.
-/
import Spec.SplitsCreator.Refinement

namespace Spec.SplitsCreator

/-! ## Arithmetic helpers -/

theorem add_div_le_add_div (a b c : Nat) : a / c + b / c ≤ (a + b) / c := by
  rcases Nat.eq_zero_or_pos c with rfl | hc
  · simp
  · rw [Nat.le_div_iff_mul_le hc, Nat.add_mul]
    exact Nat.add_le_add (Nat.div_mul_le_self a c) (Nat.div_mul_le_self b c)

theorem sum_map_div_le {α : Type} (l : List α) (f : α → Nat) (c : Nat) :
    (l.map fun x => f x / c).sum ≤ (l.map f).sum / c := by
  induction l with
  | nil => simp
  | cons x xs ih =>
    simp only [List.map_cons, List.sum_cons]
    exact Nat.le_trans (Nat.add_le_add_left ih _) (add_div_le_add_div _ _ _)

theorem sum_map_mul {α : Type} (l : List α) (f : α → Nat) (k : Nat) :
    (l.map fun x => f x * k).sum = (l.map f).sum * k := by
  induction l with
  | nil => simp
  | cons x xs ih => simp [List.sum_cons, ih, Nat.add_mul]

theorem sqrt_mono {a b : Nat} (h : a ≤ b) : Nat.sqrt a ≤ Nat.sqrt b := by
  apply Nat.le_of_lt_succ
  apply Nat.lt_of_not_le
  intro hle
  have h1 := Nat.mul_le_mul hle hle
  have h2 := Nat.sqrt_le a
  have h3 := Nat.lt_succ_sqrt b
  omega

theorem preview_eq_some {i : Input} {o : Output} (h : preview i = some o) :
    ∃ thanks roles, thanksSide i.weights i.participants = some thanks ∧
      roleSide i.modules i.roles = some roles ∧ o = combine i.weights thanks roles := by
  simp only [preview, bind, Option.bind, pure] at h
  cases ht : thanksSide i.weights i.participants <;> cases hr : roleSide i.modules i.roles <;>
    simp_all

/-! ## Principles -/

/-- SPL-1 for the unbounded model. -/
theorem total_is_sum {i : Input} {o : Output} (h : preview i = some o) :
    o.totalAllocation = o.allocations.sum ∧ o.recipients.length = o.allocations.length := by
  obtain ⟨_, _, _, _, rfl⟩ := preview_eq_some h
  simp [combine, Output.allocations, Output.recipients, accumulate_eq_sum, allocSum]

/-- Each side's allocations sum to at most `weight · PRECISION / weightSum`. -/
theorem side_sum_le (weight weightSum : Nat) (es : List Entry) :
    allocSum (side weight weightSum es) ≤ weight * PRECISION / weightSum := by
  unfold side
  split
  · rename_i h
    have hT : 0 < allocSum es := h.2
    have step1 := sum_map_div_le es (fun e => e.2 * weight * PRECISION / allocSum es) weightSum
    have step2 := sum_map_div_le es (fun e => e.2 * weight * PRECISION) (allocSum es)
    have hsum : (es.map fun e => e.2 * weight * PRECISION) = es.map fun e => e.2 * (weight * PRECISION) := by
      simp [Nat.mul_assoc]
    rw [hsum, sum_map_mul] at step2
    have hcancel : (es.map Prod.snd).sum * (weight * PRECISION) / allocSum es = weight * PRECISION := by
      rw [Nat.mul_comm]; exact Nat.mul_div_cancel _ hT
    rw [show (es.map Prod.snd).sum = allocSum es from rfl] at step2 hcancel
    rw [hcancel] at step2
    have := Nat.div_le_div_right (c := weightSum) step2
    simp only [allocSum, List.map_map, Function.comp_def, scale] at step1 ⊢
    exact Nat.le_trans step1 this
  · simp [allocSum]

-- SPL-2: each side gets at most its weight's share: thanks ≤ PRECISION·thanksWeight/(thanksWeight+roleWeight), likewise for roles.
theorem spl2_side_bounded_by_weight (w : Weights) (thanks roles : List Entry) :
    allocSum (side w.thanks (w.thanks + w.role) thanks) ≤ w.thanks * PRECISION / (w.thanks + w.role) ∧
    allocSum (side w.role (w.thanks + w.role) roles) ≤ w.role * PRECISION / (w.thanks + w.role) :=
  ⟨side_sum_le _ _ _, side_sum_le _ _ _⟩

/-- SPL-3 for the unbounded model. -/
theorem total_le_precision {i : Input} {o : Output} (h : preview i = some o) :
    o.totalAllocation ≤ PRECISION := by
  obtain ⟨thanks, roles, _, _, rfl⟩ := preview_eq_some h
  have ⟨ht, hr⟩ := spl2_side_bounded_by_weight i.weights thanks roles
  simp only [combine, accumulate_eq_sum]
  rw [show ∀ a b : List Entry, allocSum (a ++ b) = allocSum a + allocSum b from
    fun a b => by simp [allocSum, List.sum_append]]
  have hsum := add_div_le_add_div (i.weights.thanks * PRECISION) (i.weights.role * PRECISION)
    (i.weights.thanks + i.weights.role)
  rw [← Nat.add_mul] at hsum
  rcases Nat.eq_zero_or_pos (i.weights.thanks + i.weights.role) with hz | hpos
  · have h1 : i.weights.thanks = 0 := by omega
    have h2 : i.weights.role = 0 := by omega
    simp [side, h1, h2, allocSum]
  · rw [Nat.mul_div_cancel_left _ hpos] at hsum
    omega

theorem side_eq_nil (weight weightSum : Nat) (es : List Entry)
    (h : weight = 0 ∨ allocSum es = 0) : side weight weightSum es = [] := by
  unfold side
  split
  · omega
  · rfl

-- SPL-4: a side whose weight is 0, or whose raw scores sum to 0, has no recipients (no division by zero happens), and the result is exactly what it would be if that side had no entries at all.
theorem spl4_zero_side_excluded (w : Weights) (thanks roles : List Entry) :
    ((w.role = 0 ∨ allocSum roles = 0) →
      side w.role (w.thanks + w.role) roles = [] ∧ combine w thanks roles = combine w thanks []) ∧
    ((w.thanks = 0 ∨ allocSum thanks = 0) →
      side w.thanks (w.thanks + w.role) thanks = [] ∧ combine w thanks roles = combine w [] roles) := by
  have hnil : ∀ wt, side wt (w.thanks + w.role) [] = [] := fun wt =>
    side_eq_nil _ _ _ (Or.inr (by simp [allocSum]))
  refine ⟨fun h => ?_, fun h => ?_⟩
  · have := side_eq_nil _ (w.thanks + w.role) _ h
    exact ⟨this, by simp [combine, this, hnil]⟩
  · have := side_eq_nil _ (w.thanks + w.role) _ h
    exact ⟨this, by simp [combine, this, hnil]⟩

def thanksReverts (w : Weights) (ps : List Participant) : Prop :=
  0 < totalBalance ps ∧ 0 < totalMinted ps ∧ w.received + w.sent = 0

def roleReverts (r : Role) : Prop :=
  r.multiplierBottom = 0 ∨ (r.wearers ≠ [] ∧ roleSupply r = 0)

theorem roleRaw_eq_nil_iff (m : Modules) (r : Role) : roleRaw m r = [] ↔ r.wearers = [] := by
  cases hw : r.wearers with
  | nil => simp [roleRaw, hw]
  | cons w ws => simp [roleRaw, hw, List.flatMap_cons, wearerEntries]

theorem thanksSide_eq_none_iff (w : Weights) (ps : List Participant) :
    thanksSide w ps = none ↔ thanksReverts w ps := by
  unfold thanksSide thanksReverts
  by_cases h1 : 0 < totalBalance ps ∧ 0 < totalMinted ps
  · by_cases h2 : w.received + w.sent = 0 <;> simp [h1, h2]
  · simp only [h1, ite_false, reduceCtorEq, false_iff]
    omega

theorem roleEntries_eq_none_iff (m : Modules) (r : Role) :
    roleEntries m r = none ↔ roleReverts r := by
  unfold roleEntries roleReverts
  by_cases h1 : r.multiplierBottom = 0
  · simp [h1]
  · have := roleRaw_eq_nil_iff m r
    by_cases h2 : r.wearers = [] <;> by_cases h3 : roleSupply r = 0 <;> simp_all

theorem roleSide_eq_none_iff (m : Modules) (rs : List Role) :
    roleSide m rs = none ↔ ∃ r ∈ rs, roleReverts r := by
  induction rs with
  | nil => simp [roleSide]
  | cons r rs ih =>
    simp only [roleSide, bind, Option.bind, pure]
    cases he : roleEntries m r with
    | none => simp [(roleEntries_eq_none_iff m r).mp he]
    | some es =>
      have hr : ¬ roleReverts r := fun h => by
        rw [(roleEntries_eq_none_iff m r).mpr h] at he; contradiction
      cases hs : roleSide m rs with
      | none => simp_all
      | some _ => simp_all

/-- SPL-5 for the unbounded model: it fails exactly when a divisor would be 0. -/
theorem reverts_iff (i : Input) :
    preview i = none ↔
      thanksReverts i.weights i.participants ∨ ∃ r ∈ i.roles, roleReverts r := by
  rw [← thanksSide_eq_none_iff, ← roleSide_eq_none_iff i.modules]
  simp only [preview, bind, Option.bind, pure]
  cases thanksSide i.weights i.participants <;> cases roleSide i.modules i.roles <;> simp

-- SPL-6: on the thanks side, a participant who holds and has sent at least as much ThanksToken as another never gets less.
theorem spl6_thanks_monotone (w : Weights) (tb tm total weightSum : Nat) (p q : Participant)
    (hb : p.balance ≤ q.balance) (hm : p.minted ≤ q.minted) :
    (scale w.thanks total weightSum (p.addr, thanksScore w tb tm p)).2 ≤
      (scale w.thanks total weightSum (q.addr, thanksScore w tb tm q)).2 := by
  simp only [scale, thanksScore]
  have hr := Nat.div_le_div_right (c := tb)
    (Nat.mul_le_mul (Nat.mul_le_mul (Nat.le_refl w.received) hb) (Nat.le_refl PRECISION))
  have hs := Nat.div_le_div_right (c := tm)
    (Nat.mul_le_mul (Nat.mul_le_mul (Nat.le_refl w.sent) hm) (Nat.le_refl PRECISION))
  have hscore := Nat.div_le_div_right (c := w.received + w.sent) (Nat.add_le_add hr hs)
  apply Nat.div_le_div_right
  apply Nat.div_le_div_right
  exact Nat.mul_le_mul (Nat.mul_le_mul hscore (Nat.le_refl _)) (Nat.le_refl _)

/-- Final allocation of holder `h` of wearer `w` in a role with multiplier `mult`. -/
def roleFinal (m : Modules) (mult supply weight total weightSum : Nat) (w : Wearer) (h : Holder) : Nat :=
  (scale weight total weightSum (h.addr, rawScore m mult w h * PRECISION / supply)).2

-- SPL-7: within one role, holding at least as much of a share whose wearer has worn the role at least as long never gives less (time counts as ⌊√seconds⌋).
theorem spl7_role_monotone (m : Modules) (mult supply weight total weightSum : Nat)
    (w₁ w₂ : Wearer) (h₁ h₂ : Holder)
    (hb : effectiveBalance m h₁ ≤ effectiveBalance m h₂) (ht : w₁.elapsed ≤ w₂.elapsed) :
    roleFinal m mult supply weight total weightSum w₁ h₁ ≤
      roleFinal m mult supply weight total weightSum w₂ h₂ := by
  have htm : timeMultiplier m w₁ ≤ timeMultiplier m w₂ := by
    unfold timeMultiplier
    split
    · exact sqrt_mono ht
    · exact Nat.le_refl 1
  have hraw : rawScore m mult w₁ h₁ ≤ rawScore m mult w₂ h₂ :=
    Nat.mul_le_mul (Nat.mul_le_mul hb (Nat.le_refl mult)) htm
  simp only [roleFinal, scale]
  apply Nat.div_le_div_right
  apply Nat.div_le_div_right
  apply Nat.mul_le_mul _ (Nat.le_refl _)
  apply Nat.mul_le_mul _ (Nat.le_refl _)
  exact Nat.div_le_div_right (Nat.mul_le_mul hraw (Nat.le_refl _))

/-- SPL-6 is about the function `preview` really applies to every participant. -/
theorem thanksSide_entries {w : Weights} {ps : List Participant} {t : List Entry}
    (h : thanksSide w ps = some t) (hb : 0 < totalBalance ps) (hm : 0 < totalMinted ps) :
    t = ps.map fun p => (p.addr, thanksScore w (totalBalance ps) (totalMinted ps) p) := by
  unfold thanksSide at h
  by_cases hw : w.received + w.sent = 0 <;> simp_all

/-- SPL-7 is about the function `preview` really applies to every holder of a role. -/
theorem roleEntries_entries {m : Modules} {r : Role} {es : List Entry} (h : roleEntries m r = some es) :
    es = (roleRaw m r).map fun e => (e.1, e.2 * PRECISION / roleSupply r) := by
  unfold roleEntries at h
  by_cases h1 : r.multiplierBottom = 0
  · simp [h1] at h
  · by_cases h2 : roleRaw m r ≠ [] ∧ roleSupply r = 0
    · simp [h1, h2] at h
    · simp only [h1, h2, ite_false, Option.some.injEq] at h
      exact h.symm

/-! ## Principles of the contract (uint256 model) -/

-- SPL-8: whenever preview returns (no uint256 overflow), the result is exactly the unbounded computation's; it reverts with division by zero (Panic 0x12) only where the unbounded computation also fails, and wherever that fails it reverts too.
theorem spl8_uint256_matches_unbounded (i : Input) :
    (∀ o, previewU i = .ok o → preview i = some o) ∧
    (previewU i = .error .divZero → preview i = none) ∧
    (preview i = none → ∀ o, previewU i ≠ .ok o) := by
  have h := rel_preview i
  refine ⟨fun o ho => ?_, fun hd => ?_, fun hn o ho => ?_⟩
  · rw [ho] at h; exact h
  · rw [hd] at h; exact h
  · rw [ho] at h
    simp only [Rel] at h
    rw [hn] at h
    cases h

-- SPL-1: totalAllocation is exactly the sum of the allocations, one per recipient.
theorem spl1_total_is_sum {i : Input} {o : Output} (h : previewU i = .ok o) :
    o.totalAllocation = o.allocations.sum ∧ o.recipients.length = o.allocations.length :=
  total_is_sum ((spl8_uint256_matches_unbounded i).1 o h)

-- SPL-3: rounding only ever loses: totalAllocation never exceeds PRECISION.
theorem spl3_total_le_precision {i : Input} {o : Output} (h : previewU i = .ok o) :
    o.totalAllocation ≤ PRECISION :=
  total_le_precision ((spl8_uint256_matches_unbounded i).1 o h)

-- SPL-5: preview reverts with division by zero (Panic 0x12) only when both ThanksToken totals are non-zero but received+sent weight is 0, or some role has multiplierBottom = 0, or some role has wearers but a total FractionToken supply of 0; under those conditions it always reverts (with 0x12, or 0x11 if an overflow comes first).
theorem spl5_reverts (i : Input) :
    (previewU i = .error .divZero →
      thanksReverts i.weights i.participants ∨ ∃ r ∈ i.roles, roleReverts r) ∧
    ((thanksReverts i.weights i.participants ∨ ∃ r ∈ i.roles, roleReverts r) →
      ∀ o, previewU i ≠ .ok o) := by
  have h8 := spl8_uint256_matches_unbounded i
  exact ⟨fun hd => (reverts_iff i).mp (h8.2.1 hd), fun hc => h8.2.2 ((reverts_iff i).mpr hc)⟩

end Spec.SplitsCreator
