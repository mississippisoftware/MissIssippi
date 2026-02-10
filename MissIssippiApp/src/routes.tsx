import { createBrowserRouter } from "react-router-dom";
import App from "./App";
import Dashboard from "./pages/Dashboard";
import EditInventory from "./pages/EditInventory";
import ViewInventory from "./pages/ViewInventory";
import ScanInventory from "./pages/ScanInventory";
import UploadInventory from "./pages/UploadInventory";
import ItemsColors from "./pages/ItemsColors";
import ColorList from "./pages/ColorList";
import PriceList from "./pages/PriceList";



const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      { index: true, element: <Dashboard /> },
      { path: "dashboard", element: <Dashboard /> },
      { path: "inventory", element: <ViewInventory /> },
      { path: "inventory/view", element: <ViewInventory /> },
      { path: "inventory/edit", element: <EditInventory /> },
      { path: "inventory/scan", element: <ScanInventory /> },
      { path: "inventory/upload-inventory", element: <UploadInventory /> },
      { path: "admin/items-colors", element: <ItemsColors /> },
      { path: "admin/color-list", element: <ColorList /> },
      { path: "admin/price-list", element: <PriceList /> },
    ],
  },
]);

export default router;
