/-
Principles of HatsTimeFrameModule.

Each principle theorem carries its ID in the comment line directly above it
(`-- HTF-n: ...`). The ID matches the Principles table in
pkgs/document/docs/protocol/modules/hats-time-frame-module.md and the `[HTF-n]`
tags in pkgs/contract/test. `scripts/check-spec-ids.mjs` checks that the three
agree.

The principles compare the module's storage with an abstract history of
*wearing periods* (`Hist`): a successful `mintHat` or `reactivate` opens a
period, `deactivate` closes it, and `renounce` forgets all of them. The wear
time a principle talks about is the total length of those periods; it is
defined without referring to the module's storage variables.

A state is *reachable* (`ReachableU`) if some sequence of calls, made at
non-decreasing block timestamps that are positive and below 2^256, leads to it
from empty storage. Reverted calls change nothing, so they are just time
passing.
-/
import Spec.HatsTimeFrameModule.Refinement

namespace Spec.HatsTimeFrameModule

/-! ## Wearing periods -/

/-- One account's wearing periods since its last renounce: closed periods
`(start, end)` in order, and the start of the current period, if any. -/
structure Hist where
  closed : List (Nat × Nat) := []
  openAt : Option Nat := none
  deriving Repr, DecidableEq

def Hist.start (h : Hist) (t : Nat) : Hist := { h with openAt := some t }

def Hist.stop (h : Hist) (t : Nat) : Hist :=
  match h.openAt with
  | some s => { closed := h.closed ++ [(s, t)], openAt := none }
  | none => h

def closedSum : List (Nat × Nat) → Nat
  | [] => 0
  | (s, e) :: rest => (e - s) + closedSum rest

/-- Total length of the periods at time `now` (the current one runs until `now`). -/
def Hist.length (h : Hist) (now : Nat) : Nat :=
  closedSum h.closed + match h.openAt with
    | some s => now - s
    | none => 0

/-- When the first period began (`now` if there is none). -/
def Hist.firstStart (h : Hist) (now : Nat) : Nat :=
  match h.closed, h.openAt with
  | (s, _) :: _, _ => s
  | [], some t => t
  | [], none => now

abbrev Hists := Addr → Hist

def Hists.set (h : Hists) (w : Addr) (x : Hist) : Hists := fun a => if a = w then x else h a

def recordAll (now : Nat) : Hists → List (Addr × Nat) → Hists
  | h, [] => h
  | h, (w, t) :: rest => recordAll now (h.set w ((h w).start (startTime now t))) rest

/-- The periods a successful call opens or closes. -/
def record (h : Hists) (now : Nat) : Op → Hists
  | .mintHat _ w t => h.set w ((h w).start (startTime now t))
  | .batchMintHat _ ws ts => recordAll now h (ws.zip ts)
  | .deactivate _ w => h.set w ((h w).stop now)
  | .reactivate _ w => h.set w ((h w).start now)
  | .renounce _ w => h.set w {}

def Op.caller : Op → Addr
  | .mintHat c _ _ | .batchMintHat c _ _ | .deactivate c _ | .reactivate c _ | .renounce c _ => c

/-- The calls a wearer may make on their own slot. -/
def Op.selfAllowed : Op → Bool
  | .mintHat .. | .batchMintHat .. => false
  | _ => true

def Op.isRenounce : Op → Bool
  | .renounce .. => true
  | _ => false

/-- States reachable with the unbounded model (used in the proofs). Who has
authority (`Env`) may differ from call to call, as minter hats change hands. -/
inductive Reachable : Nat → State → Hists → Prop
  | init : Reachable 0 State.empty (fun _ => {})
  | wait {t t' : Nat} {s : State} {h : Hists} : Reachable t s h → t ≤ t' → Reachable t' s h
  | run {e : Env} {t now : Nat} {s s' : State} {h : Hists} {op : Op} :
      Reachable t s h → t ≤ now → 0 < now → step e s now op = .ok s' →
      Reachable now s' (record h now op)

/-- States the contract can reach: uint256 model, block timestamps below 2^256,
any authority at each call. -/
inductive ReachableU : Nat → State → Hists → Prop
  | init : ReachableU 0 State.empty (fun _ => {})
  | wait {t t' : Nat} {s : State} {h : Hists} :
      ReachableU t s h → t ≤ t' → t' < WORD → ReachableU t' s h
  | run {e : Env} {t now : Nat} {s s' : State} {h : Hists} {op : Op} :
      ReachableU t s h → t ≤ now → 0 < now → now < WORD → stepU e s now op = .ok s' →
      ReachableU now s' (record h now op)

/-! ## Periods form a chain -/

def ChainFrom : Nat → List (Nat × Nat) → Prop
  | _, [] => True
  | lo, (s, e) :: rest => lo ≤ s ∧ s ≤ e ∧ ChainFrom e rest

def lastEnd : Nat → List (Nat × Nat) → Nat
  | lo, [] => lo
  | _, (_, e) :: rest => lastEnd e rest

theorem chain_sum : ∀ (lo : Nat) (l : List (Nat × Nat)), ChainFrom lo l →
    lo ≤ lastEnd lo l ∧ closedSum l + lo ≤ lastEnd lo l
  | lo, [], _ => by simp [closedSum, lastEnd]
  | lo, (s, e) :: rest, ⟨h1, h2, h3⟩ => by
    have := chain_sum e rest h3
    simp only [closedSum, lastEnd]
    omega

theorem chain_append (s e : Nat) : ∀ (lo : Nat) (l : List (Nat × Nat)), ChainFrom lo l →
    lastEnd lo l ≤ s → s ≤ e → ChainFrom lo (l ++ [(s, e)]) ∧ lastEnd lo (l ++ [(s, e)]) = e
  | lo, [], _, h1, h2 => by simp_all [ChainFrom, lastEnd]
  | lo, (a, b) :: rest, ⟨h1, h2, h3⟩, h4, h5 => by
    have := chain_append s e b rest h3 h4 h5
    simp only [List.cons_append, ChainFrom, lastEnd]
    exact ⟨⟨h1, h2, this.1⟩, this.2⟩

theorem closedSum_append (s e : Nat) : ∀ l : List (Nat × Nat),
    closedSum (l ++ [(s, e)]) = closedSum l + (e - s)
  | [] => by simp [closedSum]
  | (a, b) :: rest => by
    simp only [List.cons_append, closedSum, closedSum_append s e rest]
    omega

/-! ## The invariant: storage matches the periods -/

structure Good (now : Nat) (x : Slot) (h : Hist) : Prop where
  active : x.isActive = h.openAt.isSome
  wore : ∀ t, h.openAt = some t → x.woreTime = t
  total : x.totalActiveTime = closedSum h.closed
  fresh : x.woreTime = 0 ↔ (h.closed = [] ∧ h.openAt = none)
  chain : ChainFrom 0 h.closed
  ended : lastEnd 0 h.closed ≤ now
  openAfter : ∀ t, h.openAt = some t → lastEnd 0 h.closed ≤ t
  openPast : ∀ t, h.openAt = some t → h.closed ≠ [] → t ≤ now
  woreClosed : h.openAt = none → x.woreTime ≤ lastEnd 0 h.closed

def Inv (now : Nat) (s : State) (h : Hists) : Prop := ∀ w, Good now (s w) (h w)

theorem good_mono {now now' : Nat} {x : Slot} {h : Hist} (g : Good now x h) (hn : now ≤ now') :
    Good now' x h :=
  { g with
    ended := Nat.le_trans g.ended hn
    openPast := fun t ho hc => Nat.le_trans (g.openPast t ho hc) hn }

theorem inv_mono {now now' : Nat} {s : State} {h : Hists} (hi : Inv now s h) (hn : now ≤ now') :
    Inv now' s h := fun w => good_mono (hi w) hn

theorem good_empty (now : Nat) : Good now {} {} where
  active := rfl
  wore := by intro t ht; cases ht
  total := rfl
  fresh := by simp
  chain := trivial
  ended := Nat.zero_le _
  openAfter := by intro t ht; cases ht
  openPast := by intro t ht; cases ht
  woreClosed := fun _ => Nat.le_refl _

theorem State.set_apply (s : State) (w a : Addr) (x : Slot) :
    s.set w x a = if a = w then x else s a := rfl

theorem Hists.set_apply (h : Hists) (w a : Addr) (x : Hist) :
    h.set w x a = if a = w then x else h a := rfl

theorem inv_set {now : Nat} {s : State} {h : Hists} {w : Addr} {x : Slot} {y : Hist}
    (hi : Inv now s h) (hg : Good now x y) : Inv now (s.set w x) (h.set w y) := by
  intro a
  rw [State.set_apply, Hists.set_apply]
  by_cases ha : a = w
  · simp only [ha, ↓reduceIte]; exact hg
  · simp only [ha, ↓reduceIte]; exact hi a

theorem openAt_of_active {now : Nat} {x : Slot} {h : Hist} (g : Good now x h) (ha : x.isActive = true) :
    h.openAt = some x.woreTime := by
  have := g.active
  cases ho : h.openAt with
  | none => simp [ho, ha] at this
  | some t => rw [g.wore t ho]

theorem openAt_of_inactive {now : Nat} {x : Slot} {h : Hist} (g : Good now x h)
    (ha : x.isActive = false) : h.openAt = none := by
  have := g.active
  cases ho : h.openAt with
  | none => rfl
  | some t => simp [ho, ha] at this

theorem startTime_pos {now : Nat} (t : Nat) (hn : 0 < now) : startTime now t ≠ 0 := by
  unfold startTime; split <;> omega

/-! ## Each successful call keeps the invariant -/

theorem good_mint {now t : Nat} {x : Slot} {h : Hist} (g : Good now x h) (h0 : x.woreTime = 0)
    (ht : t ≠ 0) : Good now { x with woreTime := t, isActive := true } (h.start t) := by
  have hf := g.fresh.mp h0
  exact {
    active := rfl
    wore := by intro t' ht'; simp only [Hist.start, Option.some.injEq] at ht'; exact ht'
    total := g.total
    fresh := by simp [Hist.start, ht]
    chain := g.chain
    ended := g.ended
    openAfter := by intro _ _; simp [Hist.start, hf.1, lastEnd]
    openPast := by intro _ _ hc; exact absurd hf.1 hc
    woreClosed := by intro ho; cases ho }

theorem good_deactivate {now t0 : Nat} {x : Slot} {h : Hist} (g : Good now x h)
    (ho : h.openAt = some t0) (hle : x.woreTime ≤ now) :
    Good now (deactivated x now (now - x.woreTime)) (h.stop now) := by
  have hw := g.wore t0 ho
  have hnz : x.woreTime ≠ 0 := by intro h0; have := (g.fresh.mp h0).2; simp [ho] at this
  have hc := chain_append t0 now 0 h.closed g.chain (g.openAfter t0 ho) (by omega)
  simp only [Hist.stop, ho]
  exact {
    active := rfl
    wore := by intro _ ht; cases ht
    total := by simp only [deactivated, closedSum_append, g.total, hw]
    fresh := by simp [deactivated, hnz]
    chain := hc.1
    ended := by rw [hc.2]; exact Nat.le_refl _
    openAfter := by intro _ ht; cases ht
    openPast := by intro _ ht; cases ht
    woreClosed := by intro _; simp only [deactivated, hc.2]; exact hle }

theorem good_reactivate {now : Nat} {x : Slot} {h : Hist} (g : Good now x h)
    (_ho : h.openAt = none) (hn : 0 < now) :
    Good now { x with isActive := true, woreTime := now } (h.start now) := by
  exact {
    active := rfl
    wore := by intro t' ht'; simp only [Hist.start, Option.some.injEq] at ht'; exact ht'
    total := g.total
    fresh := by simp [Hist.start]; omega
    chain := g.chain
    ended := g.ended
    openAfter := by intro t' ht'; simp only [Hist.start, Option.some.injEq] at ht'; rw [← ht']; exact g.ended
    openPast := by intro t' ht' _; simp only [Hist.start, Option.some.injEq] at ht'; omega
    woreClosed := by intro ho'; cases ho' }

theorem mintOne_preserves {now : Nat} {s s' : State} {h : Hists} {w t : Nat}
    (hi : Inv now s h) (hn : 0 < now) (hm : mintOne now s w t = .ok s') :
    Inv now s' (h.set w ((h w).start (startTime now t))) ∧
      ∀ a, (h a).length now ≤ ((h.set w ((h w).start (startTime now t))) a).length now := by
  unfold mintOne at hm
  split at hm
  · rename_i h0
    cases hm
    have hf := (hi w).fresh.mp h0
    refine ⟨inv_set hi (good_mint (hi w) h0 (startTime_pos t hn)), fun a => ?_⟩
    rw [Hists.set_apply]
    by_cases ha : a = w
    · subst ha; simp [Hist.length, hf.1, hf.2, closedSum]
    · simp only [ha, ↓reduceIte]; exact Nat.le_refl _
  · cases hm

theorem mintAll_preserves {now : Nat} (hn : 0 < now) : ∀ (l : List (Addr × Nat)) (s s' : State)
    (h : Hists), Inv now s h → mintAll now s l = .ok s' →
    Inv now s' (recordAll now h l) ∧ ∀ a, (h a).length now ≤ (recordAll now h l a).length now
  | [], s, s', h, hi, hm => by
    simp only [mintAll] at hm; cases hm
    exact ⟨hi, fun _ => Nat.le_refl _⟩
  | (w, t) :: rest, s, s', h, hi, hm => by
    simp only [mintAll] at hm
    cases h1 : mintOne now s w t with
    | error err => simp [h1] at hm
    | ok s1 =>
      simp only [h1] at hm
      have p1 := mintOne_preserves hi hn h1
      have p2 := mintAll_preserves hn rest s1 s' _ p1.1 hm
      exact ⟨p2.1, fun a => Nat.le_trans (p1.2 a) (p2.2 a)⟩

theorem step_preserves {e : Env} {now : Nat} {s s' : State} {h : Hists} {op : Op}
    (hi : Inv now s h) (hn : 0 < now) (hs : step e s now op = .ok s') :
    Inv now s' (record h now op) ∧
      (op.isRenounce = false → ∀ a, (h a).length now ≤ (record h now op a).length now) := by
  cases op with
  | mintHat c w t =>
    simp only [step] at hs
    split at hs
    · cases hs
    · exact ⟨(mintOne_preserves hi hn hs).1, fun _ => (mintOne_preserves hi hn hs).2⟩
  | batchMintHat c ws ts =>
    simp only [step] at hs
    split at hs
    · cases hs
    split at hs
    · cases hs
    split at hs
    · cases hs
    split at hs
    · cases hs
    cases hp : precheck s ws with
    | error err => simp [hp] at hs
    | ok u =>
      simp only [hp] at hs
      have := mintAll_preserves hn (ws.zip ts) s s' h hi hs
      exact ⟨this.1, fun _ => this.2⟩
  | deactivate c w =>
    simp only [step] at hs
    split at hs
    · cases hs
    rename_i hact
    have ha : (s w).isActive = true := by simpa using hact
    split at hs
    · cases hs
    cases hsub : sub now (s w).woreTime with
    | error err => simp [hsub] at hs
    | ok d =>
      simp only [hsub] at hs
      cases hs
      obtain ⟨hle, hd⟩ := sub_ok hsub
      subst hd
      have ho := openAt_of_active (hi w) ha
      refine ⟨inv_set hi (good_deactivate (hi w) ho hle), fun _ a => ?_⟩
      simp only [record, Hists.set_apply]
      by_cases haw : a = w
      · subst haw
        simp [Hist.stop, Hist.length, ho, closedSum_append]
      · simp only [haw, ↓reduceIte]; exact Nat.le_refl _
  | reactivate c w =>
    simp only [step] at hs
    split at hs
    · cases hs
    rename_i hact
    have ha : (s w).isActive = false := by simpa using hact
    split at hs
    · cases hs
    cases hs
    have ho := openAt_of_inactive (hi w) ha
    refine ⟨inv_set hi (good_reactivate (hi w) ho hn), fun _ a => ?_⟩
    simp only [record, Hists.set_apply]
    by_cases haw : a = w
    · subst haw
      simp [Hist.start, Hist.length, ho]
    · simp only [haw, ↓reduceIte]; exact Nat.le_refl _
  | renounce c w =>
    simp only [step] at hs
    split at hs
    · cases hs
    cases hs
    exact ⟨inv_set hi (good_empty now), fun h => by cases h⟩

theorem reachable_inv {t : Nat} {s : State} {h : Hists} (hr : Reachable t s h) :
    Inv t s h := by
  induction hr with
  | init => intro _; exact good_empty 0
  | wait _ hle ih => exact inv_mono ih hle
  | run _ hle hn hs ih => exact (step_preserves (inv_mono ih hle) hn hs).1

/-! ## No overflow, and the uint256 model equals the unbounded one -/

theorem noOverflow_of_inv {now : Nat} {s : State} {h : Hists} (hi : Inv now s h) (hw : now < WORD) :
    NoOverflow s now := by
  intro w ha hle
  have g := hi w
  have ho := openAt_of_active g ha
  have h1 := (chain_sum 0 _ g.chain).2
  have h2 := g.openAfter _ ho
  rw [g.total]
  omega

theorem reachableU_reachable {t : Nat} {s : State} {h : Hists} (hr : ReachableU t s h) :
    Reachable t s h ∧ t < WORD := by
  induction hr with
  | init => exact ⟨.init, by decide⟩
  | wait _ hle hw ih => exact ⟨.wait ih.1 hle, hw⟩
  | run _ hle hn hw hs ih =>
    have hi := inv_mono (reachable_inv ih.1) hle
    rw [stepU_eq _ (noOverflow_of_inv hi hw)] at hs
    exact ⟨.run ih.1 hle hn hs, hw⟩

-- HTF-7: on every reachable state, the uint256 computation never overflows: each call returns exactly what the unbounded computation returns, including the same revert reason.
theorem uint256_eq_unbounded {t now : Nat} {s : State} {h : Hists}
    (hr : ReachableU t s h) (hle : t ≤ now) (hw : now < WORD) :
    (∀ e op, stepU e s now op = step e s now op) ∧
      (∀ w, getWearingElapsedTimeU s now w = getWearingElapsedTime s now w) := by
  have hi := inv_mono (reachable_inv (reachableU_reachable hr).1) hle
  exact ⟨fun _ op => stepU_eq op (noOverflow_of_inv hi hw),
    fun w => elapsedU_eq w (noOverflow_of_inv hi hw)⟩

/-! ## The wear time is the length of the periods -/

theorem elapsed_eq_length {s : State} {now w v : Nat} {hh : Hist} (g : Good now (s w) hh)
    (he : getWearingElapsedTime s now w = .ok v) : v = hh.length now ∧ (s w).woreTime ≤ now := by
  unfold getWearingElapsedTime at he
  split at he
  · cases he
  rename_i hlt
  split at he
  · rename_i ha
    cases he
    have ho := openAt_of_active g ha
    simp [Hist.length, ho, g.total]
    omega
  · rename_i ha
    cases he
    have ho := openAt_of_inactive g (by simpa using ha)
    simp [Hist.length, ho, g.total]
    omega

theorem elapsed_of_reachable {t now w v : Nat} {s : State} {h : Hists}
    (hr : ReachableU t s h) (hle : t ≤ now) (hw : now < WORD)
    (he : getWearingElapsedTimeU s now w = .ok v) :
    v = (h w).length now ∧ (s w).woreTime ≤ now ∧ Good now (s w) (h w) := by
  rw [(uint256_eq_unbounded hr hle hw).2 w] at he
  have g := inv_mono (reachable_inv (reachableU_reachable hr).1) hle w
  exact ⟨(elapsed_eq_length g he).1, (elapsed_eq_length g he).2, g⟩

-- HTF-1: the wear time getWearingElapsedTime returns is the total length of the wearing periods (from mint or reactivate to deactivate, or to now); paused time is not counted.
theorem elapsed_is_periods {t now w v : Nat} {s : State} {h : Hists}
    (hr : ReachableU t s h) (hle : t ≤ now) (hw : now < WORD)
    (he : getWearingElapsedTimeU s now w = .ok v) : v = (h w).length now :=
  (elapsed_of_reachable hr hle hw he).1

-- HTF-2: as time passes the wear time never decreases, and while paused it stays the same.
theorem elapsed_mono_time {t now now' w v : Nat} {s : State} {h : Hists}
    (hr : ReachableU t s h) (hle : t ≤ now) (hn : now ≤ now') (hw : now' < WORD)
    (he : getWearingElapsedTimeU s now w = .ok v) :
    ∃ v', getWearingElapsedTimeU s now' w = .ok v' ∧ v ≤ v' ∧ ((s w).isActive = false → v' = v) := by
  have eq := uint256_eq_unbounded hr hle (by omega)
  have eq' := uint256_eq_unbounded hr (Nat.le_trans hle hn) hw
  rw [eq.2 w] at he
  rw [eq'.2 w]
  unfold getWearingElapsedTime at he ⊢
  split at he
  · cases he
  rename_i hlt
  have hlt' : ¬ now' < (s w).woreTime := by omega
  simp only [hlt', ↓reduceIte]
  split at he
  · rename_i ha
    cases he
    simp only [ha, ↓reduceIte]
    exact ⟨_, rfl, by omega, fun hf => by simp at hf⟩
  · rename_i ha
    cases he
    simp only [ha]
    exact ⟨_, rfl, Nat.le_refl _, fun _ => rfl⟩

-- HTF-3: no call lowers anyone's wear time except renounce, which resets the renounced wearer's wear time to 0.
theorem only_renounce_lowers {e : Env} {t now : Nat} {s s' : State} {h : Hists} {op : Op}
    (hr : ReachableU t s h) (hle : t ≤ now) (hn : 0 < now) (hw : now < WORD)
    (hs : stepU e s now op = .ok s') :
    (op.isRenounce = false → ∀ w v v', getWearingElapsedTimeU s now w = .ok v →
        getWearingElapsedTimeU s' now w = .ok v' → v ≤ v') ∧
      (∀ c w, op = .renounce c w → getWearingElapsedTimeU s' now w = .ok 0) := by
  have hr' : ReachableU now s' (record h now op) := .run hr hle hn hw hs
  have hi := inv_mono (reachable_inv (reachableU_reachable hr).1) hle
  rw [(uint256_eq_unbounded hr hle hw).1 e op] at hs
  have pres := step_preserves hi hn hs
  refine ⟨fun hnr w v v' he he' => ?_, fun c w hop => ?_⟩
  · rw [elapsed_is_periods hr hle hw he, elapsed_is_periods hr' (Nat.le_refl _) hw he']
    exact pres.2 hnr w
  · subst hop
    simp only [step] at hs
    split at hs
    · cases hs
    cases hs
    simp [getWearingElapsedTimeU, State.set_apply]

-- HTF-4: the wear time is never more than the time since the first period began: it is at most now − firstStart.
theorem elapsed_le_since_first {t now w v : Nat} {s : State} {h : Hists}
    (hr : ReachableU t s h) (hle : t ≤ now) (hw : now < WORD)
    (he : getWearingElapsedTimeU s now w = .ok v) : v ≤ now - (h w).firstStart now := by
  obtain ⟨hv, hwt, g⟩ := elapsed_of_reachable hr hle hw he
  subst hv
  cases hc : (h w).closed with
  | nil =>
    cases ho : (h w).openAt with
    | none => simp [Hist.length, Hist.firstStart, hc, ho, closedSum]
    | some _ => simp [Hist.length, Hist.firstStart, hc, ho, closedSum]
  | cons p rest =>
    obtain ⟨s0, e0⟩ := p
    have gc := g.chain
    rw [hc] at gc
    have hcs := (chain_sum s0 ((s0, e0) :: rest) ⟨Nat.le_refl _, gc.2.1, gc.2.2⟩).2
    have hend := g.ended
    rw [hc] at hend
    simp only [lastEnd] at hcs hend
    simp only [Hist.firstStart, hc]
    cases ho : (h w).openAt with
    | none =>
      simp only [Hist.length, hc, ho]
      omega
    | some t0 =>
      have hoa := g.openAfter t0 ho
      have hwo := g.wore t0 ho
      rw [hc] at hoa
      simp only [lastEnd] at hoa
      simp only [Hist.length, hc, ho]
      omega

/-- The first period was opened by `mintHat` with a time still in the future. -/
def MintedInFuture (h : Hist) (now : Nat) : Prop := h.closed = [] ∧ ∃ t0, h.openAt = some t0 ∧ now < t0

theorem future_of_lt {now : Nat} {x : Slot} {hh : Hist} (g : Good now x hh) (hlt : now < x.woreTime) :
    MintedInFuture hh now := by
  cases ho : hh.openAt with
  | none => have := g.woreClosed ho; have := g.ended; omega
  | some t0 =>
    have hw := g.wore t0 ho
    refine ⟨?_, t0, ho, by omega⟩
    cases hc : hh.closed with
    | nil => rfl
    | cons _ _ => have := g.openPast t0 ho (by simp [hc]); omega

-- HTF-5: getWearingElapsedTime reverts, and deactivate fails with Panic 0x11, only when the wearer was minted with a time that has not come yet.
theorem reverts_only_before_start {e : Env} {t now : Nat} {s : State} {h : Hists}
    (hr : ReachableU t s h) (hle : t ≤ now) (hw : now < WORD) :
    (∀ w err, getWearingElapsedTimeU s now w = .error err →
        err = .invalidWoreTime ∧ MintedInFuture (h w) now) ∧
      (∀ c w err, stepU e s now (.deactivate c w) = .error err →
        err = .alreadyInactive ∨ err = .notAuthorized ∨
          (err = .underflow ∧ MintedInFuture (h w) now)) := by
  have eq := uint256_eq_unbounded hr hle hw
  have hi := inv_mono (reachable_inv (reachableU_reachable hr).1) hle
  refine ⟨fun w err he => ?_, fun c w err hs => ?_⟩
  · rw [eq.2 w] at he
    unfold getWearingElapsedTime at he
    split at he
    · cases he; exact ⟨rfl, future_of_lt (hi w) ‹_›⟩
    split at he <;> cases he
  · rw [eq.1] at hs
    simp only [step] at hs
    split at hs
    · cases hs; exact Or.inl rfl
    split at hs
    · cases hs; exact Or.inr (Or.inl rfl)
    cases hsub : sub now (s w).woreTime with
    | ok d => simp [hsub] at hs
    | error err' =>
      simp only [hsub] at hs
      cases hs
      unfold sub at hsub
      split at hsub
      · cases hsub
      · cases hsub
        exact Or.inr (Or.inr ⟨rfl, future_of_lt (hi w) (by omega)⟩)

/-! ## Who can change a record -/

theorem set_changed {s : State} {w a : Addr} {x : Slot} (h : s.set w x a ≠ s a) : a = w := by
  rw [State.set_apply] at h
  by_cases ha : a = w
  · exact ha
  · simp only [ha, ↓reduceIte] at h; exact absurd rfl h

theorem auth_or_self {e : Env} {c w : Nat} (h : ¬(!(e.hasAuthority c || c == w)) = true) :
    e.hasAuthority c = true ∨ c = w := by
  cases hA : e.hasAuthority c
  · right; simpa [hA] using h
  · left; rfl

theorem changed_by_auth_or_self {e : Env} {s : State} {c w w' : Nat} {x : Slot} {op : Op}
    (hc : op.caller = c) (hself : op.selfAllowed = true)
    (hauth : ¬(!(e.hasAuthority c || c == w')) = true) (hch : s.set w' x w ≠ s w) :
    e.hasAuthority op.caller = true ∨ (op.selfAllowed = true ∧ op.caller = w) := by
  subst hc
  rcases auth_or_self hauth with ha | ha
  · exact Or.inl ha
  · exact Or.inr ⟨hself, by rw [ha, set_changed hch]⟩

-- HTF-6: only an account with authority (admin or wearer of the minter hat) changes a wearer's record, except that wearers may deactivate, reactivate and renounce their own.
theorem only_authorized_changes {e : Env} {s s' : State} {now w : Nat} {op : Op}
    (hs : stepU e s now op = .ok s') (hch : s' w ≠ s w) :
    e.hasAuthority op.caller = true ∨ (op.selfAllowed = true ∧ op.caller = w) := by
  have hs : step e s now op = .ok s' := by
    rcases stepU_rel e s now op with h | h
    · rw [← h]; exact hs
    · rw [hs] at h; cases h
  cases op with
  | mintHat c w' t =>
    simp only [step] at hs
    split at hs
    · cases hs
    · left; simpa [Op.caller] using ‹¬(!e.hasAuthority c) = true›
  | batchMintHat c ws ts =>
    simp only [step] at hs
    split at hs
    · cases hs
    · left; simpa [Op.caller] using ‹¬(!e.hasAuthority c) = true›
  | deactivate c w' =>
    simp only [step] at hs
    split at hs
    · cases hs
    split at hs
    · cases hs
    rename_i hauth
    cases hsub : sub now (s w').woreTime with
    | error err => simp [hsub] at hs
    | ok d =>
      simp only [hsub] at hs
      cases hs
      exact changed_by_auth_or_self rfl rfl hauth hch
  | reactivate c w' =>
    simp only [step] at hs
    split at hs
    · cases hs
    split at hs
    · cases hs
    rename_i hauth
    cases hs
    exact changed_by_auth_or_self rfl rfl hauth hch
  | renounce c w' =>
    simp only [step] at hs
    split at hs
    · cases hs
    rename_i hauth
    cases hs
    exact changed_by_auth_or_self rfl rfl hauth hch

end Spec.HatsTimeFrameModule
