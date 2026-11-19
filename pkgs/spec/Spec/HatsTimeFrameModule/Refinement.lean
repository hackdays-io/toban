/-
The uint256 model (`Contract.lean`) refines the unbounded model (`Model.lean`):
each call either returns exactly what the unbounded model returns (a new
state, a value, or the same revert reason), or overflows (Panic 0x11).

The additions overflow only when an active slot's `totalActiveTime +
(now - woreTime)` reaches 2^256; `Theorems.lean` shows that never happens on a
reachable state (HTF-7), so there the two models are equal.
-/
import Spec.HatsTimeFrameModule.Contract

namespace Spec.HatsTimeFrameModule

/-- `u` is `n`, or `u` overflowed. -/
def Rel {α : Type} (u n : Result α) : Prop := u = n ∨ u = .error .overflow

/-- No active slot is close enough to 2^256 for its addition to overflow at `now`. -/
def NoOverflow (s : State) (now : Nat) : Prop :=
  ∀ w, (s w).isActive = true → (s w).woreTime ≤ now →
    (s w).totalActiveTime + (now - (s w).woreTime) < WORD

theorem add_eq_of_lt {a b : Nat} (h : a + b < WORD) : U.add a b = .ok (a + b) := by
  simp [U.add, h]

theorem add_rel (a b : Nat) : U.add a b = .ok (a + b) ∨ U.add a b = .error .overflow := by
  unfold U.add; split
  · exact Or.inl rfl
  · exact Or.inr rfl

theorem stepU_rel (e : Env) (s : State) (now : Nat) (op : Op) :
    Rel (stepU e s now op) (step e s now op) := by
  cases op with
  | deactivate c w =>
    simp only [stepU, step]
    split
    · exact Or.inl rfl
    split
    · exact Or.inl rfl
    cases hs : sub now (s w).woreTime with
    | error err => exact Or.inl rfl
    | ok d =>
      rcases add_rel (s w).totalActiveTime d with h | h <;> simp only [h]
      · exact Or.inl rfl
      · exact Or.inr rfl
  | _ => exact Or.inl rfl

theorem sub_ok {a b d : Nat} (h : sub a b = .ok d) : b ≤ a ∧ d = a - b := by
  unfold sub at h
  split at h
  · cases h; exact ⟨‹_›, rfl⟩
  · cases h

theorem stepU_eq {e : Env} {s : State} {now : Nat} (op : Op) (h : NoOverflow s now) :
    stepU e s now op = step e s now op := by
  cases op with
  | deactivate c w =>
    simp only [stepU, step]
    split
    · rfl
    split
    · rfl
    rename_i hact _
    cases hd : sub now (s w).woreTime with
    | error err => rfl
    | ok d =>
      obtain ⟨hle, hd'⟩ := sub_ok hd
      have := h w (by simpa using hact) hle
      simp only [add_eq_of_lt (show (s w).totalActiveTime + d < WORD by rw [hd']; exact this)]
  | _ => rfl

theorem elapsedU_rel (s : State) (now w : Nat) :
    Rel (getWearingElapsedTimeU s now w) (getWearingElapsedTime s now w) := by
  unfold getWearingElapsedTimeU getWearingElapsedTime
  split
  · exact Or.inl rfl
  split
  · exact add_rel _ _
  · exact Or.inl rfl

theorem elapsedU_eq {s : State} {now : Nat} (w : Nat) (h : NoOverflow s now) :
    getWearingElapsedTimeU s now w = getWearingElapsedTime s now w := by
  unfold getWearingElapsedTimeU getWearingElapsedTime
  split
  · rfl
  rename_i hlt
  split
  · rename_i hact
    exact add_eq_of_lt (h w hact (Nat.le_of_not_lt hlt))
  · rfl

end Spec.HatsTimeFrameModule
