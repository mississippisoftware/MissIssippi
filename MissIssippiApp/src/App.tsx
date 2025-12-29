import { Outlet } from "react-router-dom";
import Sidebar from "./layout/Sidebar/Sidebar";
import Topbar from "./layout/Topbar";
import { useEffect } from "react";
import { useInventoryStore } from "./stores/InventoryStore";
import { Container } from "react-bootstrap";

export default function App() {
  const fetchInventory = useInventoryStore((s) => s.fetchInventory);

  useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);

  return (
    <div className="app-layout">
      <Sidebar />
      <Topbar />
      <div className="content-wrapper">
        <Container fluid className="content-container">
          <Outlet />
        </Container>
      </div>
    </div>
  );
}