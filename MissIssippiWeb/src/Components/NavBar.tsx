import { NavLink } from "react-router-dom";

export default function NavBar() {
  return (
    <>
      <nav className="navbar navbar-expand-lg bd-navbar sticky-top bg-light w-100" data-bs-theme="light">
        <div className="container-fluid">
          <NavLink className="navbar-brand" to="/">
            <img src="src/assets/Images/MissIssippiLogo.png" width="200" className="d-inline-block pe-3" alt="MissIssippiLogo" />
          </NavLink>
          <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarColor03" aria-controls="navbarColor03" aria-expanded="false" aria-label="Toggle navigation">
            <span className="navbar-toggler-icon"></span>
          </button>
          <div className="collapse navbar-collapse" id="navbarColor03">
            <ul className="navbar-nav me-auto mb-2 mb-lg-0">
              <li className="nav-item">
                <NavLink className="nav-link" to="/scaninventory">Scan Inventory </NavLink>
              </li>
              <li className="nav-item">
                <NavLink className="nav-link" to="/manualinventory">Manual Inventory</NavLink>
              </li>
              <li className="nav-item">
                <NavLink className="nav-link" to="/viewinventory">View Inventory</NavLink>
              </li>
            </ul>
          </div>
        </div>
      </nav>
    </>
  )
}
