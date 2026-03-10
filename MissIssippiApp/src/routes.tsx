import { createBrowserRouter } from "react-router-dom";
import App from "./App";
import Dashboard from "./pages/Dashboard";
import EditInventory from "./pages/EditInventory";
import ViewInventory from "./pages/ViewInventory";
import ScanInventory from "./pages/ScanInventory";
import UploadInventory from "./pages/UploadInventory";
import InventoryHistory from "./pages/InventoryHistory";
import InventoryLabels from "./pages/InventoryLabels";
import ItemsColors from "./pages/ItemsColors";
import ColorList from "./pages/ColorList";
import PriceList from "./pages/PriceList";
import SeasonList from "./pages/SeasonList";
import SizeList from "./pages/SizeList";
import SkuList from "./pages/SkuList";



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
      { path: "inventory/history", element: <InventoryHistory /> },
      { path: "inventory/labels", element: <InventoryLabels /> },
      { path: "admin/items-colors", element: <ItemsColors /> },
      { path: "admin/color-list", element: <ColorList /> },
      { path: "admin/skus", element: <SkuList /> },
      { path: "admin/price-list", element: <PriceList /> },
      { path: "admin/season-list", element: <SeasonList /> },
      { path: "admin/size-list", element: <SizeList /> },
    ],
  },
]);

export default router;
