function Navbar() {
  return (
    <header className="navbar">
      <div className="navbar-brand">
        <div className="brand-icon">D</div>

        <span className="brand-name">DevConnect</span>
      </div>

      <div className="navbar-search">
        <span className="search-icon">⌕</span>

        <input
          type="text"
          placeholder="Search discussions, rooms..."
          aria-label="Search"
        />

        <span className="search-shortcut">Ctrl K</span>
      </div>

      <div className="navbar-actions">
        <button className="icon-button" aria-label="Notifications">
          ♧
          <span className="notification-dot"></span>
        </button>

        <div className="navbar-divider"></div>

        <div className="user-profile">
          <div className="avatar avatar-you">YO</div>

          <div className="profile-info">
            <span className="profile-name">You</span>
            <span className="profile-status">Developer</span>
          </div>

          <span className="profile-menu">⌄</span>
        </div>
      </div>
    </header>
  );
}

export default Navbar;