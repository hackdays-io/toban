import { type ActionFunction, type LoaderFunction, data } from "react-router";
import {
  NameApiError,
  type NameProvider,
  getNameProvider,
} from "~/.server/ens";

/**
 * Never `throw data(...)` from inside the `try` blocks below — the throw would
 * be swallowed by the surrounding `catch` and re-reported as a generic error,
 * which is how the old NameStone route turned its intended 409 into a 500.
 * Throw `NameApiError` instead and let this translate it at the boundary.
 */
const toResponse = (error: unknown) => {
  if (error instanceof NameApiError) {
    return data({ message: error.message }, error.status);
  }
  console.error("ENS name request failed", error);
  return data({ message: "ENS name request failed" }, 502);
};

/**
 * A name is free if nobody holds it, or if the caller already does — that
 * second case is what lets a user re-save their profile without renaming.
 */
const assertNameFree = async (
  provider: NameProvider,
  name: string,
  address: string,
) => {
  const existing = await provider.resolveByName(name, true);
  const takenByOther = existing.some(
    (entry) => entry.address.toLowerCase() !== address.toLowerCase(),
  );
  if (takenByOther) {
    throw new NameApiError(409, `Name "${name}" is already taken`);
  }
};

export const loader: LoaderFunction = async ({ request, params }) => {
  const { action: operation } = params;
  const searchParams = new URL(request.url).searchParams;

  try {
    const provider = getNameProvider();

    switch (operation) {
      case "resolve-names": {
        const addresses = searchParams.get("addresses");
        if (!addresses) return [];
        return await provider.resolveByAddresses(addresses.split(","));
      }
      case "resolve-addresses": {
        const names = searchParams.get("names");
        if (!names) return [];
        const exactMatch = searchParams.get("exact_match") === "true";
        return await Promise.all(
          names
            .split(",")
            .map((name) => provider.resolveByName(name, exactMatch)),
        );
      }
      default:
        throw new NameApiError(404, "Not Found");
    }
  } catch (error) {
    throw toResponse(error);
  }
};

export const action: ActionFunction = async ({ request, params }) => {
  if (request.method !== "POST") throw data({ message: "Not Found" }, 404);

  const { action: operation } = params;

  try {
    const provider = getNameProvider();
    const body = await request.json();
    const name = typeof body?.name === "string" ? body.name.trim() : "";
    const address = typeof body?.address === "string" ? body.address : "";
    const text_records = body?.text_records;

    if (!name) throw new NameApiError(400, "Name is required");
    if (!address) throw new NameApiError(400, "Address is required");

    switch (operation) {
      case "set-name": {
        await assertNameFree(provider, name, address);
        await provider.upsert({ name, address, text_records });
        return { message: "OK", success: true };
      }
      case "update-name": {
        await assertNameFree(provider, name, address);
        // Read the caller's current names *before* upserting, so the record we
        // are about to write can't be mistaken for a stale one to clean up.
        const [previousNames = []] = await provider.resolveByAddresses([
          address,
        ]);
        await provider.upsert({ name, address, text_records });
        for (const previous of previousNames) {
          if (previous.name !== name) await provider.delete(previous.name);
        }
        return { message: "OK", success: true };
      }
      default:
        throw new NameApiError(404, "Not Found");
    }
  } catch (error) {
    throw toResponse(error);
  }
};
