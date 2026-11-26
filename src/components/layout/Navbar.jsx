
import { useAuth } from "../../context/useAuth";
import { useChat } from "../../hooks/useChat";

function Navbar({ onOpenSidebar, onOpenRooms }) {
  const { user } = useAuth();
  const { state } = useChat();

  const displayName =
    user?.displayName ||
    user?.username ||
    "Developer";

  const initials = displayName
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <header className="navbar">
      <div className="navbar-brand">
        <button
          type="button"
          className="mobile-nav-button"
          onClick={onOpenSidebar}
          aria-label="Open workspace navigation"
          aria-controls="workspace-sidebar"
        >
          ☰
        </button>

        <div className="brand-icon">D</div>

        <span className="brand-name">
          DevConnect
        </span>
      </div>

      <button
        type="button"
        className="mobile-nav-button mobile-rooms-button"
        onClick={onOpenRooms}
        aria-label="Open channels"
        aria-controls="channel-navigation"
      >
        <span aria-hidden="true">#</span>
        <span>Channels</span>
      </button>

      <div className="navbar-search">
        <span className="search-icon">⌕</span>

        <input
          type="text"
          placeholder="Search discussions, rooms..."
          aria-label="Search"
        />

        <span className="search-shortcut">
          Ctrl K
        </span>
      </div>

      <div className="navbar-actions">
        <div
          className="online-count"
          role="status"
          aria-label={`${state.onlineUserCount} users online`}
        >
          <span className="online-indicator" />
          <span>{state.onlineUserCount} online</span>
        </div>

        <div className="navbar-divider" />

        <div className="user-profile">
          <div className="avatar avatar-you">
            {initials}
          </div>

          <div className="profile-info">
            <span className="profile-name">
              {displayName}
            </span>

            <span className="profile-status">
              Developer
            </span>
          </div>

          <span className="profile-menu">⌄</span>
        </div>
      </div>
    </header>
  );
}

export default Navbar;
