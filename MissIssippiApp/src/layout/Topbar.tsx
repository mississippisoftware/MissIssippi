export default function Topbar() {
  return (
    <header className="portal-topbar">
      <div className="portal-topbar__left">
        <span className="portal-topbar__logo-mark" aria-hidden="true">M</span>
        <h2 className="portal-topbar__brand">Miss Issippi</h2>
      </div>

      <div className="portal-topbar__right">
        <button type="button" className="portal-topbar__icon-btn" aria-label="Notifications">
          <i className="pi pi-bell" aria-hidden="true" />
          <span className="portal-topbar__badge" aria-label="3 notifications">3</span>
        </button>
        <button type="button" className="portal-topbar__icon-btn" aria-label="Settings">
          <i className="pi pi-cog" aria-hidden="true" />
        </button>
        <button type="button" className="portal-topbar__icon-btn portal-topbar__avatar" aria-label="User menu">
          <span className="portal-topbar__avatar-initials">MI</span>
        </button>
      </div>
    </header>
  );
}
