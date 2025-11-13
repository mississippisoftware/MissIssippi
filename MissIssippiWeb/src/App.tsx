import { Outlet } from "react-router-dom"
import MySidebar from "./Components/SideBar"
import { useEffect } from "react";
import { useInventoryStore } from "./inventory/inventoryStore";


function App() {

  const fetchInventory = useInventoryStore((state) => state.fetchInventory);

  useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);

  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      <MySidebar />
      <div style={{ flexGrow: 1, padding: '2rem' }}>
        <Outlet />
      </div>
    </div>
  )
}

export default App
