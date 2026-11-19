/-
The uint256 model (`Contract.lean`) refines the unbounded one (`Model.lean`).

`step` is written once over its addition, so it suffices to show that
swapping unbounded addition for checked uint256 addition can only turn a result
into Panic 0x11: `RelE u m` says `u` is exactly `m`, or an overflow.
-/
import Spec.HatsFractionTokenModule.Contract

namespace Spec.HatsFractionTokenModule

def RelE {α : Type} (u m : M α) : Prop := u = m ∨ u = .error .overflow

theorem relE_refl {α : Type} (m : M α) : RelE m m := Or.inl rfl

theorem relE_bind {α β : Type} {u m : M α} {g h : α → M β}
    (hu : RelE u m) (hg : ∀ a, RelE (g a) (h a)) : RelE (u >>= g) (m >>= h) := by
  rcases hu with rfl | rfl
  · cases u with
    | ok a => exact hg a
    | error e => exact Or.inl rfl
  · exact Or.inr rfl

theorem relE_foldlM {α β : Type} {f g : β → α → M β}
    (hfg : ∀ b a, RelE (f b a) (g b a)) (l : List α) (b : β) :
    RelE (l.foldlM f b) (l.foldlM g b) := by
  induction l generalizing b with
  | nil => exact relE_refl _
  | cons a l ih =>
    simp only [List.foldlM_cons]
    exact relE_bind (hfg b a) ih

theorem relE_uAdd (a b : Nat) : RelE (uAdd a b) (natAdd a b) := by
  unfold uAdd natAdd
  split
  · exact Or.inl rfl
  · exact Or.inr rfl

/-- Peel `do` blocks that differ only in their addition: same `if` on both
sides, `>>=` on related computations, identical pure parts. -/
syntax "relE_tac" : tactic
set_option hygiene false in
macro_rules
  | `(tactic| relE_tac) => `(tactic| first
      | exact relE_refl _
      | exact hadd _ _
      | exact relE_mintTo hadd ..
      | exact relE_transferCore hadd ..
      | exact relE_foldlM (relE_moveOne hadd _ _) _ _
      | exact relE_foldlM (fun _ _ => relE_mintInitialSupply hadd ..) _ _
      | (refine relE_bind ?_ fun _ => ?_) <;> relE_tac
      | split <;> relE_tac
      | (intro _) <;> relE_tac
      | (dsimp only) <;> relE_tac)

section
variable {add₁ add₂ : Nat → Nat → M Nat} (hadd : ∀ a b, RelE (add₁ a b) (add₂ a b))
include hadd

theorem relE_mintTo (s : State) (to : Addr) (sh : Share) (v : Nat) :
    RelE (mintTo add₁ s to sh v) (mintTo add₂ s to sh v) := by
  unfold mintTo; relE_tac

theorem relE_moveOne (src dst : Addr) (s : State) (p : Share × Nat) :
    RelE (moveOne add₁ src dst s p) (moveOne add₂ src dst s p) := by
  obtain ⟨_, _⟩ := p
  unfold moveOne; relE_tac

theorem relE_transferCore (s : State) (sender src dst : Addr) (ids : List Share)
    (amounts : List Nat) :
    RelE (transferCore add₁ s sender src dst ids amounts)
      (transferCore add₂ s sender src dst ids amounts) := by
  unfold transferCore; relE_tac

theorem relE_mintInitialSupply (w : World) (s : State) (sender : Addr) (hat : Hat)
    (wearer : Addr) (amount : Nat) :
    RelE (mintInitialSupply add₁ w s sender hat wearer amount)
      (mintInitialSupply add₂ w s sender hat wearer amount) := by
  unfold mintInitialSupply; relE_tac

theorem relE_step (w : World) (s : State) (op : Op) :
    RelE (step add₁ w s op) (step add₂ w s op) := by
  cases op <;> unfold step <;> relE_tac

end

/-- One transaction: the uint256 model is the unbounded one, or Panic 0x11. -/
theorem relE_stepU (w : World) (s : State) (op : Op) : RelE (stepU w s op) (step natAdd w s op) :=
  relE_step relE_uAdd w s op

end Spec.HatsFractionTokenModule
