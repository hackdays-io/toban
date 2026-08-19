import type { NameData, TextRecords } from "types/ens";

export interface UpsertNameParams {
  /** Label only, e.g. `alice` (not `alice.toban.eth`). */
  name: string;
  address: string;
  text_records?: TextRecords;
}

/**
 * The set of operations Toban needs from an ENS subname host.
 *
 * Introduced in #557 so the NameStone → Namespace swap had a single seam.
 * Everything is expressed in label terms (`alice`), never full names — the
 * provider owns the parent domain and the `label.parent` concatenation.
 */
export interface NameProvider {
  /** One entry per input address, in input order. Empty array = unregistered. */
  resolveByAddresses(addresses: string[]): Promise<NameData[][]>;
  /** `exactMatch` looks up the single label; otherwise it is a prefix search. */
  resolveByName(name: string, exactMatch: boolean): Promise<NameData[]>;
  isAvailable(name: string): Promise<boolean>;
  /** Full-record upsert: fields not passed are cleared. */
  upsert(params: UpsertNameParams): Promise<void>;
  delete(name: string): Promise<void>;
}

/**
 * An error the API route should translate into a specific HTTP status.
 *
 * Route handlers must not `throw data(...)` from inside a `try` — the thrown
 * value is caught by their own `catch` and re-reported as a 500, which is
 * exactly the bug #557 called out in the old NameStone route. Throwing this
 * instead keeps the intended status intact through the catch.
 */
export class NameApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "NameApiError";
  }
}
