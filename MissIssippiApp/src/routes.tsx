import { createBrowserRouter } from "react-router-dom";
import App from "./App";
import Dashboard from "./pages/Dashboard";
import ViewInventory from "./pages/ViewInventory";



const router = createBrowserRouter([
  {
    path: "/",
    element: <App/>,
    children: [
      { index: true, element: <Dashboard /> },
      { path: "inventory", element: <ViewInventory /> },
    ],
  },
]);

export default router;