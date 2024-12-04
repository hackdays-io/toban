import { FaCircleUser } from "react-icons/fa6";

export const DefaultUserIcon = () => {
  return (
    <FaCircleUser
      style={{
        color: "#e9ecef",
        width: "100%",
        height: "100%",
        objectFit: "cover",
        borderRadius: "100%",
        border: "1px solid #343a40",
      }}
    />
  );
};
