import { useParams } from "react-router-dom";

export default function Workspace() {
  const { workspaceId } = useParams();
  return <div>Workspace: {workspaceId}</div>;
}
