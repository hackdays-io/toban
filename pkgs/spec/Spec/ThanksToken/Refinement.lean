/-
The uint256 model (`Contract.lean`) refines the unbounded model (`Model.lean`):

  `Rel (stepU env s op) (step env s op)`, i.e. `stepU` either reverts with
  Panic 0x11 (overflow), or returns exactly what `step` returns — the same new
  state, or the same revert reason.

`Sim u a` says a computation either yields exactly `a` or overflows.
-/
import Spec.ThanksToken.Contract

namespace Spec.ThanksToken

def Rel {α : Type} (u n : Result α) : Prop := u = .error .overflow ∨ u = n

def Sim {α : Type} (u : Result α) (a : α) : Prop := Rel u (.ok a)

/-! ## Except plumbing -/

theorem rel_refl {α : Type} (u : Result α) : Rel u u := Or.inr rfl

theorem sim_pure {α : Type} (a : α) : Sim (pure a : Result α) a := Or.inr rfl

theorem sim_bind {α β : Type} {u : Result α} {a : α} {g : α → Result β} {n : Result β}
    (hu : Sim u a) (hg : Rel (g a) n) : Rel (u >>= g) n := by
  rcases hu with h | h <;> rw [h]
  · exact Or.inl rfl
  · exact hg

theorem rel_map {α β : Type} {u n : Result α} (f : α → β) (h : Rel u n) :
    Rel (u >>= fun x => pure (f x)) (n.map f) := by
  rcases h with h | h <;> subst h
  · exact Or.inl rfl
  · cases u <;> exact Or.inr rfl

/-! ## Arithmetic -/

theorem sim_add (a b : Nat) : Sim (U.add a b) (a + b) := by
  unfold U.add; split
  · exact Or.inr rfl
  · exact Or.inl rfl

theorem sim_mul (a b : Nat) : Sim (U.mul a b) (a * b) := by
  unfold U.mul; split
  · exact Or.inr rfl
  · exact Or.inl rfl

/-! ## `mintableAmount` -/

theorem sim_roleAmount (env : Env) (o : Nat) (r : RoleRef) :
    Sim (U.roleAmount env o r) (roleAmount env o r) := by
  unfold U.roleAmount roleAmount
  split
  · exact sim_pure _
  · exact sim_bind (sim_mul _ _) (sim_pure _)

theorem sim_roleFold (env : Env) (o : Nat) (l : List RoleRef) (acc : Nat) :
    Sim (l.foldlM (fun acc r => do U.add acc (← U.roleAmount env o r)) acc)
      (acc + (l.map (roleAmount env o)).sum) := by
  induction l generalizing acc with
  | nil => simpa using sim_pure acc
  | cons r rs ih =>
    simp only [List.foldlM_cons, List.map_cons, List.sum_cons]
    refine sim_bind (sim_bind (sim_roleAmount env o r) (sim_add acc _)) ?_
    have := ih (acc + roleAmount env o r)
    rwa [Nat.add_assoc] at this

theorem sim_roleSum (env : Env) (o : Nat) (roles : List RoleRef) :
    Sim (U.roleSum env o roles) (roleSum env o roles) := by
  have := sim_roleFold env o (firstOcc [] roles) 0
  rwa [Nat.zero_add] at this

theorem sim_cap (env : Env) (s : State) (o : Nat) (roles : List RoleRef) :
    Sim (U.cap env s o roles) (cap env s o roles) :=
  sim_bind (sim_roleSum _ _ _) <| sim_bind (sim_mul _ _) <| sim_bind (sim_mul _ _) (sim_add _ _)

theorem sim_mintable (env : Env) (s : State) (o : Nat) (roles : List RoleRef) :
    Sim (U.mintable env s o roles) (mintable env s o roles) :=
  sim_bind (sim_cap _ _ _ _) (sim_pure _)

/-! ## State changes -/

theorem sim_creditMinted (s : State) (o v : Nat) :
    Sim (U.creditMinted s o v) (creditMinted s o v) :=
  sim_bind (sim_add _ _) (sim_pure _)

theorem rel_mintTo (s : State) (a v : Nat) : Rel (U.mintTo s a v) (mintTo s a v) := by
  unfold U.mintTo mintTo
  split
  · exact rel_refl _
  · exact sim_bind (sim_add _ _) (sim_pure _)

theorem rel_mintAll (s : State) (l : List (Nat × Nat)) : Rel (U.mintAll s l) (mintAll s l) := by
  induction l generalizing s with
  | nil => exact rel_refl _
  | cons p rest ih =>
    obtain ⟨a, v⟩ := p
    simp only [U.mintAll, mintAll]
    rcases rel_mintTo s a v with h | h
    · rw [h]; exact Or.inl rfl
    · rw [h]
      cases mintTo s a v with
      | error e => exact Or.inr rfl
      | ok s' => exact ih (addP s' a)

theorem rel_checkBatch (sender acc : Nat) (l : List (Nat × Nat)) :
    Rel (U.checkBatch sender acc l)
      ((checkBatch sender l).map fun _ => acc + (l.map Prod.snd).sum) := by
  induction l generalizing acc with
  | nil => exact Or.inr (by simp [U.checkBatch, checkBatch, Except.map])
  | cons p rest ih =>
    obtain ⟨a, v⟩ := p
    simp only [U.checkBatch, checkBatch]
    split
    · exact Or.inr rfl
    · split
      · exact Or.inr rfl
      · refine sim_bind (sim_add acc v) ?_
        have := ih (acc + v)
        simpa [List.map_cons, List.sum_cons, Nat.add_assoc] using this

/-! ## `step` -/

/-- The uint256 model refines the unbounded one. -/
theorem rel_step (env : Env) (s : State) (op : Op) : Rel (stepU env s op) (step env s op) := by
  cases op with
  | mint sender to amount roles =>
    simp only [stepU, step]
    split
    · exact rel_refl _
    split
    · exact rel_refl _
    refine sim_bind (sim_mintable _ _ _ _) ?_
    split
    · exact rel_refl _
    refine sim_bind (sim_creditMinted _ _ _) ?_
    exact rel_map _ (rel_mintTo _ _ _)
  | batchMint sender tos amounts roles =>
    simp only [stepU, step]
    split
    · exact rel_refl _
    rename_i hlen
    have hsum : ((tos.zip amounts).map Prod.snd).sum = amounts.sum := by
      rw [List.map_snd_zip (by omega)]
    rcases rel_checkBatch sender 0 (tos.zip amounts) with h | h
    · rw [h]; exact Or.inl rfl
    rw [h]
    cases checkBatch sender (tos.zip amounts) with
    | error e => exact Or.inr rfl
    | ok u =>
      simp only [Except.map, hsum, Nat.zero_add]
      refine sim_bind (sim_pure _) ?_
      refine sim_bind (sim_mintable _ _ _ _) ?_
      split
      · exact rel_refl _
      refine sim_bind (sim_creditMinted _ _ _) ?_
      exact rel_map _ (rel_mintAll _ _)
  | mintFrom sender frm to value roles =>
    simp only [stepU, step]
    split
    · exact rel_refl _
    split
    · exact rel_refl _
    split
    · exact rel_refl _
    split
    · exact rel_refl _
    refine sim_bind (sim_mintable _ _ _ _) ?_
    split
    · exact rel_refl _
    refine sim_bind (sim_creditMinted _ _ _) ?_
    exact rel_map _ (rel_mintTo _ _ _)
  | approveMint => exact rel_refl _
  | permitMint => exact rel_refl _
  | transfer => exact rel_refl _
  | setCoefficient => exact rel_refl _

end Spec.ThanksToken
