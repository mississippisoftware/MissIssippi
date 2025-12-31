import { Outlet } from "react-router-dom";
import Sidebar from "./layout/Sidebar/Sidebar";
import Topbar from "./layout/Topbar";
import { Container } from "react-bootstrap";

export default function App() {
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