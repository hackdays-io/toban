import {
  type ActionFunction,
  type LoaderFunction,
  data,
} from "@remix-run/node";
import NameStone, { type NameData } from "namestone-sdk";

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
          exact_match: 1 as unknown as boolean,
        });

        // If name exists and is owned by a different address, throw error
        if (existingNames.length > 0) {
          throw data({ message: "Name is already taken" }, 409);
        }

        await ns.setName({ domain, name, address, text_records });
        return { message: "OK" };
      }
      case "update-name": {
        const { name, address, text_records } = await request.json();

        if (!name) throw data({ message: "Name is required" }, 400);
        if (!address) throw data({ message: "Address is required" }, 400);

        console.log("Updating name", { name, address, text_records });

        try {
          // Check if name exists and is owned by another address
          const existingNames = await ns.searchNames({
            domain,
            name,
            exact_match: 1 as unknown as boolean,
          });

          console.log("Existing names found:", existingNames);

          if (
            existingNames.length !== 0 &&
            existingNames[0].address.toLowerCase() !== address.toLowerCase()
          ) {
            console.error("Name conflict", {
              existing: existingNames[0].address,
              requested: address,
            });
            throw data(
              {
                message: `Name "${name}" is already taken by address ${existingNames[0].address}`,
              },
              409,
            );
          }

          // Attempt to set the name
          console.log(
            `Calling ns.setName with: domain=${domain}, name=${name}, address=${address}`,
          );
        } catch (error) {
          console.error("Error updating name:", error);
          throw data(
            {
              message: `Failed to update name: ${error instanceof Error ? error.message : "Unknown error"}`,
              error: error,
            },
            500,
          );
        }

        let currentNames: NameData[] = [];
        try {
          currentNames = await ns.getNames({ domain, address });
        } catch (error) {
          console.error("Error updating name:", error);
        }
        console.log("Current names:", currentNames);

        try {
          const result = await ns.setName({
            domain,
            name,
            address,
            text_records,
          });
          console.log("Name update raw result:", result);
          console.log("Name update result type:", typeof result);
          console.log(
            "Name update result stringified:",
            JSON.stringify(result, null, 2),
          );

          if (currentNames.length !== 0) {
            for (const currentName of currentNames) {
              if (currentName.name !== name) {
                const response = await ns.deleteName({
                  name: currentName.name,
                  domain: domain,
                });
                console.log("Delete name response:", response, name);
              }
            }
          }

          return { message: "OK", success: true };
        } catch (setNameError) {
          console.error("Error in ns.setName:", setNameError);
          throw data(
            {
              message: `Failed to set name: ${setNameError instanceof Error ? setNameError.message : "Unknown error"}`,
              error: setNameError,
            },
            500,
          );
        }
      }
      default:
        throw data({ message: "Not Found" }, 404);
    }
  }

  throw data({ message: "Not Found" }, 404);
};
