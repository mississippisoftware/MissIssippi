import { createBrowserRouter } from "react-router-dom";
import ViewInventory from "./Pages/ViewInventory";
import App from "./App";
import EnterInventory from "./Pages/EnterInventory";
import DataMaintenance from "./Pages/DataMaintenance";


const router = createBrowserRouter(
    [
        {
            path: "/", element: <App />, children: [
                { path: "/enterinventory", element: <EnterInventory /> },
                { path: "/viewinventory", element: <ViewInventory /> },
                { path: "/datamaintenance", element: <DataMaintenance /> },
            ]
        },
    ]);
export default router;