import {
  type ActionFunction,
  type LoaderFunction,
  data,
} from "@remix-run/node";
import NameStone, { NameData } from "namestone-sdk";

const ns = new NameStone(import.meta.env.VITE_NAMESTONE_API_KEY);
const domain = "toban.eth";

export const loader: LoaderFunction = async ({ request, params }) => {
  const { action } = params;
  const searchParams = new URL(request.url).searchParams;

  switch (action) {
    case "resolve-names": {
      const addresses = searchParams.get("addresses");
      if (!addresses) return [];

      const resolvedNames = await Promise.all(
        addresses.split(",").map((address) => ns.getNames({ domain, address })),
      );
      return resolvedNames;
    }
    case "resolve-addresses": {
      const names = searchParams.get("names");
      if (!names) return [];

      const exactMatch = searchParams.get("exact_match");

      const resolvedAddresses = await Promise.all(
        names.split(",").map((name) =>
          ns.searchNames({
            domain,
            name,
            exact_match: (exactMatch === "true" ? 1 : 0) as unknown as boolean,
          }),
        ),
      );
      return resolvedAddresses;
    }
    default:
      throw data({ message: "Not Found" }, 404);
  }
};

export const action: ActionFunction = async ({ request, params }) => {
  const { method } = request;
  const { action } = params;

  if (method === "POST") {
    switch (action) {
      case "set-name": {
        const { name, address, text_records } = await request.json();

        // Check if name is already taken
        const existingNames = await ns.searchNames({
          domain,
          name,
          exact_match: true,
        });

        // If name exists and is owned by a different address, throw error
        if (existingNames.length > 0) {
          throw data({ message: "Name is already taken" }, 409);
        }

        await ns.setName({ domain, name, address, text_records });
        return { message: "OK" };
      }
      default:
        throw data({ message: "Not Found" }, 404);
    }
  }

  throw data({ message: "Not Found" }, 404);
};
