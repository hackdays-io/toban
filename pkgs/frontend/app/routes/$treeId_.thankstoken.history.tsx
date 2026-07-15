import { type LoaderFunctionArgs, redirect } from "react-router";

// The thanks data screen lives at `/{treeId}/history`. This older URL
// stays alive as a 308 redirect so external links keep working.
export const loader = ({ params }: LoaderFunctionArgs) => {
  const treeId = params.treeId;
  if (!treeId) return redirect("/");
  return redirect(`/${treeId}/history`, 308);
};

export default function ThanksTokenHistoryRedirect() {
  return null;
}
