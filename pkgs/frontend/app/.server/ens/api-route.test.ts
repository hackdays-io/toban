import type { NameData } from "types/ens";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { NameProvider } from "./provider";

const provider = {
  resolveByAddresses: vi.fn<NameProvider["resolveByAddresses"]>(),
  resolveByName: vi.fn<NameProvider["resolveByName"]>(),
  isAvailable: vi.fn<NameProvider["isAvailable"]>(),
  upsert: vi.fn<NameProvider["upsert"]>(),
  delete: vi.fn<NameProvider["delete"]>(),
};

vi.mock("~/.server/ens", async () => {
  const actual = await vi.importActual<typeof import("./index")>("./index");
  return { ...actual, getNameProvider: () => provider };
});

const { action, loader } = await import("~/routes/api.ens.$action");

const ALICE = "0xAAAA000000000000000000000000000000000001";
const BOB = "0xBBBB000000000000000000000000000000000002";

const nameData = (name: string, address: string): NameData => ({
  name,
  address,
  domain: "toban.eth",
  text_records: {},
});

const post = (operation: string, body: unknown) =>
  action({
    request: new Request(`http://localhost/api/ens/${operation}`, {
      method: "POST",
      body: JSON.stringify(body),
    }),
    params: { action: operation },
    context: {},
    // biome-ignore lint/suspicious/noExplicitAny: route args stub
  } as any);

const get = (operation: string, query: string) =>
  loader({
    request: new Request(`http://localhost/api/ens/${operation}?${query}`),
    params: { action: operation },
    context: {},
    // biome-ignore lint/suspicious/noExplicitAny: route args stub
  } as any);

/** `data()` throws a `DataWithResponseInit`, not a `Response`. */
const statusOf = async (run: () => unknown): Promise<number> => {
  try {
    await run();
  } catch (thrown) {
    // biome-ignore lint/suspicious/noExplicitAny: DataWithResponseInit is not exported
    return (thrown as any).init?.status;
  }
  throw new Error("expected the handler to throw");
};

describe("/api/ens", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    provider.resolveByName.mockResolvedValue([]);
    provider.resolveByAddresses.mockResolvedValue([[]]);
    provider.upsert.mockResolvedValue(undefined);
    provider.delete.mockResolvedValue(undefined);
  });

  describe("set-name", () => {
    it("409s when another address already holds the name", async () => {
      provider.resolveByName.mockResolvedValue([nameData("alice", BOB)]);

      expect(
        await statusOf(() =>
          post("set-name", { name: "alice", address: ALICE }),
        ),
      ).toBe(409);
      expect(provider.upsert).not.toHaveBeenCalled();
    });

    it("lets the current holder re-save their own name", async () => {
      // The old NameStone route 409'd on any existing record, so re-saving
      // your own profile failed.
      provider.resolveByName.mockResolvedValue([nameData("alice", ALICE)]);

      await expect(
        post("set-name", { name: "alice", address: ALICE }),
      ).resolves.toEqual({ message: "OK", success: true });
      expect(provider.upsert).toHaveBeenCalledWith({
        name: "alice",
        address: ALICE,
        text_records: undefined,
      });
    });

    it("400s on a missing name", async () => {
      expect(await statusOf(() => post("set-name", { address: ALICE }))).toBe(
        400,
      );
    });

    it("surfaces upstream failures as 502 rather than hanging", async () => {
      provider.resolveByName.mockRejectedValue(
        new Error("timeout of 8000ms exceeded"),
      );

      expect(
        await statusOf(() =>
          post("set-name", { name: "alice", address: ALICE }),
        ),
      ).toBe(502);
    });
  });

  describe("update-name", () => {
    it("keeps a name conflict a 409 instead of turning it into a 500", async () => {
      // Regression guard: the old route threw `data(…, 409)` from inside a
      // try/catch, so its own catch re-reported the conflict as a 500.
      provider.resolveByName.mockResolvedValue([nameData("alice", BOB)]);

      expect(
        await statusOf(() =>
          post("update-name", { name: "alice", address: ALICE }),
        ),
      ).toBe(409);
    });

    it("deletes the caller's previous names but keeps the new one", async () => {
      provider.resolveByAddresses.mockResolvedValue([
        [nameData("old-alice", ALICE), nameData("alice", ALICE)],
      ]);

      await post("update-name", {
        name: "alice",
        address: ALICE,
        text_records: { description: "hi" },
      });

      expect(provider.upsert).toHaveBeenCalledWith({
        name: "alice",
        address: ALICE,
        text_records: { description: "hi" },
      });
      expect(provider.delete).toHaveBeenCalledTimes(1);
      expect(provider.delete).toHaveBeenCalledWith("old-alice");
    });
  });

  describe("loader", () => {
    it("resolves names for each requested address", async () => {
      provider.resolveByAddresses.mockResolvedValue([
        [nameData("alice", ALICE)],
        [],
      ]);

      await expect(
        get("resolve-names", `addresses=${ALICE},${BOB}`),
      ).resolves.toEqual([[nameData("alice", ALICE)], []]);
      expect(provider.resolveByAddresses).toHaveBeenCalledWith([ALICE, BOB]);
    });

    it("passes exact_match through as a boolean", async () => {
      await get("resolve-addresses", "names=alice&exact_match=true");
      expect(provider.resolveByName).toHaveBeenCalledWith("alice", true);

      await get("resolve-addresses", "names=alice");
      expect(provider.resolveByName).toHaveBeenCalledWith("alice", false);
    });

    it("404s an unknown operation", async () => {
      expect(await statusOf(() => get("nope", ""))).toBe(404);
    });
  });
});
