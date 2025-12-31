import { createBrowserRouter } from "react-router-dom";
import App from "./App";
import Dashboard from "./pages/Dashboard";
import EditInventory from "./pages/EditInventory";
import ViewInventory from "./pages/ViewInventory";



const router = createBrowserRouter([
  {
    path: "/",
    element: <App/>,
    children: [
      { index: true, element: <Dashboard /> },
      { path: "inventory", element: <ViewInventory /> },
      { path: "inventory/view", element: <ViewInventory /> },
      { path: "inventory/edit", element: <EditInventory /> },
    ],
  },
]);

export default router;