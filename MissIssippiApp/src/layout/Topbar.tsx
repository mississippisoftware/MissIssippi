import { Button } from "primereact/button";

export default function Topbar() {
  return (
    <header className="topbar">
      <div className="topbar-left">
        <h2 className="topbar-title">Miss Issippi</h2>
      </div>

      <div className="topbar-right">
        <Button icon="pi pi-user" className="btn-text btn-icon" aria-label="User menu" />
      </div>
    </header>
  );
}
