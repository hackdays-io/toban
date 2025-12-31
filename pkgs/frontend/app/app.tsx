import { RouterProvider, createBrowserRouter } from "react-router-dom";
import routes from "./routes"; // your flat-file RouteConfigEntry[] array

//const router = createBrowserRouter(routes);
const router = createBrowserRouter(routes);

const App = () => {
  // For client-side, use createBrowserRouter
  return <RouterProvider router={router} />;
};

export default App;
