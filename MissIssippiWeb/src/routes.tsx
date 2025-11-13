import { createBrowserRouter } from "react-router-dom";
import ViewInventory from "./pages/ViewInventory";
import App from "./App";
import DataMaintenance from "./pages/DataMaintenance";
import InventoryCardsPage from "./pages/InventoryCardsPage";


const router = createBrowserRouter(
    [
        {
            path: "/", element: <App />, children: [
                { path: "/enterinventory", element: <InventoryCardsPage /> },
                { path: "/viewinventory", element: <ViewInventory /> },
                { path: "/datamaintenance", element: <DataMaintenance /> },
            ]
        },
    ]);
export default router;