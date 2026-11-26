
import { NavLink } from "react-router-dom";

function Sidebar({
  isMobileOpen = false,
  onNavigate,
  onClose,
}) {
  const sidebarClass = [
    "sidebar",
    isMobileOpen ? "is-mobile-open" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <aside
      id="workspace-sidebar"
      className={sidebarClass}
      aria-label="Workspace navigation"
      aria-hidden={!isMobileOpen && undefined}
    >
      <div className="mobile-sidebar-header">
        <span>Workspace</span>

        <button
          type="button"
          className="mobile-panel-close"
          onClick={onClose}
          aria-label="Close workspace navigation"
        >
          ×
        </button>
      </div>

      <div className="sidebar-section">
        <p className="sidebar-heading">
          WORKSPACE
        </p>

        <nav className="sidebar-nav">
          <a
            href="#discover"
            className="sidebar-link"
            onClick={onNavigate}
          >
            <span aria-hidden="true">⌕</span>
            Discover
          </a>

          <NavLink
            to="/chat"
            end
            className={({ isActive }) =>
              `sidebar-link ${isActive ? "active" : ""}`
            }
            onClick={onNavigate}
          >
            <span aria-hidden="true">▤</span>
            Messages
          </NavLink>

          <NavLink
            to="/developer"
            className={({ isActive }) =>
              `sidebar-link ${isActive ? "active" : ""}`
            }
            onClick={onNavigate}
          >
            <span aria-hidden="true">{"</>"}</span>
            Developer Tools
          </NavLink>

          <NavLink
            to="/developer/uploads"
            className={({ isActive }) =>
              `sidebar-link ${isActive ? "active" : ""}`
            }
            onClick={onNavigate}
          >
            <span aria-hidden="true">{"</>"}</span>
            Developer Uploads
          </NavLink>

          <a
            href="#saved"
            className="sidebar-link"
            onClick={onNavigate}
          >
            <span aria-hidden="true">☆</span>
            Saved messages
          </a>
        </nav>
      </div>

      <div className="sidebar-section sidebar-bottom">
        <p className="sidebar-heading">
          YOUR ACCOUNT
        </p>

        <nav className="sidebar-nav">
          <a
            href="#settings"
            className="sidebar-link"
            onClick={onNavigate}
          >
            <span aria-hidden="true">⚙</span>
            Settings
          </a>

          <a
            href="#help"
            className="sidebar-link"
            onClick={onNavigate}
          >
            <span aria-hidden="true">?</span>
            Help and support
          </a>
        </nav>
      </div>

      <div className="sidebar-footer">
        <div className="online-indicator" />
        <span>All systems operational</span>
      </div>
    </aside>
  );
}

export default Sidebar;
