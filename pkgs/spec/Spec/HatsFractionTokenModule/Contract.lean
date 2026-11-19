/-
HatsFractionTokenModule with Solidity 0.8 uint256 semantics: the model of
`Model.lean` with every checked `+=` (an ERC1155 balance, `totalSupply(id)`,
`totalSupply()`) reverting with Panic 0x11 when the result does not fit in 256
bits. This is what the test vectors are generated from.

`Refinement.lean` proves that whenever this version succeeds it computes the
same state as the unbounded one, and that it reverts for the same reason
whenever the reason is not an overflow (HFT-8), so the principles proven for the
unbounded model carry over.

Inputs are uint256 values (< 2^256) and addresses (< 2^160).
-/
import Spec.HatsFractionTokenModule.Model

namespace Spec.HatsFractionTokenModule

def WORD : Nat := 2 ^ 256

/-- Checked uint256 addition. -/
def uAdd (a b : Nat) : M Nat := if a + b < WORD then pure (a + b) else throw .overflow

/-- One transaction, as the contract executes it. -/
def stepU (w : World) (s : State) (op : Op) : M State := step uAdd w s op

/-- A sequence of transactions, as the contract executes it. -/
def execU (w : World) (s : State) (ops : List Op) : State := exec uAdd w s ops

end Spec.HatsFractionTokenModule
