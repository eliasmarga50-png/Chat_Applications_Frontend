
import { NavLink } from "react-router-dom";
import { NavLink } from "react-router-dom";

function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar-section">
        <p className="sidebar-heading">WORKSPACE</p>

        <nav className="sidebar-nav">
          <a href="#discover" className="sidebar-link">
            <span>⌕</span>
            Discover
          </a>

          <NavLink
            to="/chat"
            className={({ isActive }) =>
              `sidebar-link ${isActive ? "active" : ""}`
            }
          >
            <span>▤</span>
            Messages
          </NavLink>

          <NavLink
            to="/developer"
            className={({ isActive }) =>
              `sidebar-link ${isActive ? "active" : ""}`
            }
          >
            <span>{"</>"}</span>
            Developer Tools
          </NavLink>

          <NavLink
             to="/developer/uploads"
             className={({ isActive }) =>
             `sidebar-link ${isActive ? "active" : ""}`
               }
             >
              <span>{"</>"}</span>
              Developer Uploads
            </NavLink>

          <a href="#saved" className="sidebar-link">
            <span>☆</span>
            Saved messages
          </a>
        </nav>
      </div>

      <div className="sidebar-section sidebar-bottom">
        <p className="sidebar-heading">YOUR ACCOUNT</p>

        <nav className="sidebar-nav">
          <a href="#settings" className="sidebar-link">
            <span>⚙</span>
            Settings
          </a>

          <a href="#help" className="sidebar-link">
            <span>?</span>
            Help and support
          </a>
        </nav>
      </div>

      <div className="sidebar-footer">
        <div className="online-indicator"></div>
        <span>All systems operational</span>
      </div>
    </aside>
  );
}

export default Sidebar;
