import type {
  OffchainClient,
  SubnameDTO,
} from "@thenamespace/offchain-manager";
import { AxiosError } from "axios";
import { describe, expect, it, vi } from "vitest";
import { NamespaceProvider } from "./namespace";

const PARENT = "toban.eth";

const notFound = () => {
  const error = new AxiosError("Not Found");
  // biome-ignore lint/suspicious/noExplicitAny: minimal axios response stub
  error.response = { status: 404 } as any;
  return error;
};

const dto = (overrides: Partial<SubnameDTO> = {}): SubnameDTO => ({
  id: "1",
  fullName: `alice.${PARENT}`,
  parentName: PARENT,
  label: "alice",
  texts: { avatar: "ipfs://cid", description: "hi" },
  addresses: { "60": "0xaaaa000000000000000000000000000000000001" },
  metadata: {},
  namehash: "0x0",
  owner: "0xaaaa000000000000000000000000000000000001",
  ...overrides,
});

const makeProvider = (client: Partial<OffchainClient>) =>
  new NamespaceProvider({
    client: client as OffchainClient,
    parentName: PARENT,
  });

describe("NamespaceProvider", () => {
  describe("resolveByAddresses", () => {
    it("returns one NameData list per address, in input order", async () => {
      const getFilteredSubnames = vi.fn(async ({ owner }) =>
        owner === "0xaaaa000000000000000000000000000000000001"
          ? { totalItems: 1, page: 1, size: 100, items: [dto()] }
          : { totalItems: 0, page: 1, size: 100, items: [] },
      );
      const provider = makeProvider({ getFilteredSubnames });

      const result = await provider.resolveByAddresses([
        "0xBBBB000000000000000000000000000000000002",
        "0xAAAA000000000000000000000000000000000001",
      ]);

      expect(result).toEqual([
        [],
        [
          {
            name: "alice",
            address: "0xaaaa000000000000000000000000000000000001",
            domain: PARENT,
            text_records: { avatar: "ipfs://cid", description: "hi" },
          },
        ],
      ]);
      // The owner filter must be queried lowercase — it is an opaque string
      // match on the API side.
      expect(getFilteredSubnames).toHaveBeenCalledWith(
        expect.objectContaining({
          owner: "0xaaaa000000000000000000000000000000000001",
          parentName: PARENT,
        }),
      );
    });

    it("drops rows whose owner does not match the queried address", async () => {
      const provider = makeProvider({
        getFilteredSubnames: async () => ({
          totalItems: 1,
          page: 1,
          size: 100,
          items: [dto({ owner: "0xcccc000000000000000000000000000000000003" })],
        }),
      });

      const [names] = await provider.resolveByAddresses([
        "0xaaaa000000000000000000000000000000000001",
      ]);
      expect(names).toEqual([]);
    });

    it("keeps dotted split labels intact even when the API re-parents them", async () => {
      // `foo.split.toban.eth` may come back split as label `foo` under parent
      // `split.toban.eth`; the label must still read `foo.split`.
      const provider = makeProvider({
        getFilteredSubnames: async () => ({
          totalItems: 1,
          page: 1,
          size: 100,
          items: [
            dto({
              fullName: `foo.split.${PARENT}`,
              label: "foo",
              parentName: `split.${PARENT}`,
            }),
          ],
        }),
      });

      const [names] = await provider.resolveByAddresses([
        "0xaaaa000000000000000000000000000000000001",
      ]);
      expect(names[0]).toMatchObject({ name: "foo.split", domain: PARENT });
    });
  });

  describe("resolveByName", () => {
    it("returns an empty list when an exact lookup 404s", async () => {
      // The SDK's own 404-to-null handling never fires (its try wraps a
      // returned promise), so the provider has to absorb the rejection.
      const provider = makeProvider({
        getSingleSubname: async () => {
          throw notFound();
        },
      });

      await expect(provider.resolveByName("nobody", true)).resolves.toEqual([]);
    });

    it("propagates non-404 failures instead of reporting the name as free", async () => {
      const provider = makeProvider({
        getSingleSubname: async () => {
          throw new Error("upstream exploded");
        },
      });

      await expect(provider.resolveByName("alice", true)).rejects.toThrow(
        "upstream exploded",
      );
    });

    it("uses a label search when exactMatch is false", async () => {
      const getFilteredSubnames = vi.fn(async () => ({
        totalItems: 1,
        page: 1,
        size: 100,
        items: [dto()],
      }));
      const provider = makeProvider({ getFilteredSubnames });

      const result = await provider.resolveByName("ali", false);

      expect(getFilteredSubnames).toHaveBeenCalledWith(
        expect.objectContaining({ labelSearch: "ali", parentName: PARENT }),
      );
      expect(result).toHaveLength(1);
    });
  });

  describe("isAvailable", () => {
    it("asks about the fully-qualified name", async () => {
      const isSubnameAvailable = vi.fn(async () => ({ isAvailable: true }));
      const provider = makeProvider({ isSubnameAvailable });

      await expect(provider.isAvailable("alice")).resolves.toBe(true);
      expect(isSubnameAvailable).toHaveBeenCalledWith(`alice.${PARENT}`);
    });
  });

  describe("upsert", () => {
    it("always writes the full record through createSubname", async () => {
      const createSubname = vi.fn(async () => undefined);
      const updateSubname = vi.fn(async () => undefined);
      const provider = makeProvider({ createSubname, updateSubname });

      await provider.upsert({
        name: "alice",
        address: "0xAAAA000000000000000000000000000000000001",
        text_records: { avatar: "ipfs://cid", description: "" },
      });

      expect(createSubname).toHaveBeenCalledWith({
        parentName: PARENT,
        label: "alice",
        owner: "0xaaaa000000000000000000000000000000000001",
        addresses: [
          { chain: "eth", value: "0xaaaa000000000000000000000000000000000001" },
        ],
        // An empty value means "clear this record", so it must not be sent —
        // `POST /subnames` replaces the whole record.
        texts: [{ key: "avatar", value: "ipfs://cid" }],
      });
      // `updateSubname` rebuilds the record without `owner` and would wipe
      // ownership, so it must never be reached.
      expect(updateSubname).not.toHaveBeenCalled();
    });
  });

  describe("delete", () => {
    it("treats an already-absent name as success", async () => {
      const provider = makeProvider({
        deleteSubname: async () => {
          throw notFound();
        },
      });

      await expect(provider.delete("ghost")).resolves.toBeUndefined();
    });

    it("propagates other failures", async () => {
      const provider = makeProvider({
        deleteSubname: async () => {
          throw new Error("nope");
        },
      });

      await expect(provider.delete("alice")).rejects.toThrow("nope");
    });
  });
});
