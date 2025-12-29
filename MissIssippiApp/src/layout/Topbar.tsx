import { Button } from "primereact/button";

export default function Topbar() {
  return (
    <header className="topbar">
      <div className="topbar-left">
        <h2 className="topbar-title">Portal</h2>
      </div>

      <div className="topbar-right">
        <Button icon="pi pi-user" className="p-button-text" />
      </div>
    </header>
  );
}