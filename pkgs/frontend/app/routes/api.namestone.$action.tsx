import { ActionFunction, LoaderFunction } from "@remix-run/node";
import NameStone, { NameData } from "namestone-sdk";

const ns = new NameStone(import.meta.env.VITE_NAMESTONE_API_KEY);
const domain = "toban.eth";

export const loader: LoaderFunction = async ({ request, params }) => {
  const { action } = params;
  const searchParams = new URL(request.url).searchParams;

  switch (action) {
    case "resolve-names":
      const addresses = searchParams.get("addresses");
      if (!addresses) return Response.json([]);

      const resolvedNames = await Promise.all(
        addresses.split(",").map((address) => ns.getNames({ domain, address }))
      );
      return Response.json(resolvedNames);
    case "resolve-addresses":
      const names = searchParams.get("names");
      if (!names) return Response.json([]);

      const exactMatch = searchParams.get("exact_match");

      const resolvedAddresses = await Promise.all(
        names
          .split(",")
          .map((name) =>
            ns.searchNames({
              domain,
              name,
              exact_match: exactMatch === "true" ? 1 : (0 as any),
            })
          )
      );
      return Response.json(resolvedAddresses);
    default:
      throw Response.json({ message: "Not Found" }, { status: 404 });
  }
};

export const action: ActionFunction = async ({ request, params }) => {
  const { method } = request;
  const { action } = params;

  if (method === "POST") {
    switch (action) {
      case "set-name":
        const { name, address, text_records } = await request.json();
        await ns.setName({ domain, name, address, text_records });
        return Response.json({ message: "OK" });
      default:
        throw Response.json({ message: "Not Found" }, { status: 404 });
    }
  }

  throw Response.json({ message: "Not Found" }, { status: 404 });
};
