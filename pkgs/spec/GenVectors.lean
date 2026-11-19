/-
Test vector generator: runs each module's uint256 model on hand-written edge
cases plus seeded pseudo-random inputs and writes `<outDir>/<module>.json`.

  lake exe gen-vectors <outDir>

`modules` below is the only list of modules: `pnpm spec vectors` writes them to
vectors/, and `pnpm spec verify` fails if vectors/ differs from a fresh run.
pkgs/contract/test/<Module>.Differential.ts replays every case against the
Solidity contract. Numbers are decimal strings (they exceed 2^53).
-/
import Vectors.SplitsCreator
import Vectors.ThanksToken
import Vectors.HatsTimeFrameModule

def modules : List (String × String) :=
  [("splits-creator", Vectors.SplitsCreator.json), ("thanks-token", Vectors.ThanksToken.json),
   ("hats-time-frame-module", Vectors.HatsTimeFrameModule.json)]

def main (args : List String) : IO UInt32 := do
  match args with
  | [outDir] =>
    for (name, json) in modules do
      IO.FS.writeFile (System.FilePath.mk outDir / s!"{name}.json") (json ++ "\n")
    pure 0
  | _ =>
    IO.eprintln "usage: gen-vectors <outDir>"
    pure 1
