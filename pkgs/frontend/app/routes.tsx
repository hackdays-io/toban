import { RouterProvider, createBrowserRouter } from "react-router";
import App from "./root";
import Index from "./routes/_index";
import Login from "./routes/login";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      { index: true, element: <Index /> },
      { path: "login", element: <Login /> },
    ],
  },
]);

export default function Routes() {
  return <RouterProvider router={router} />;
}
