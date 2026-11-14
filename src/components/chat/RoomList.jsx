function RoomList({ rooms, activeRoomId }) {
  return (
    <section className="room-list">
      <div className="room-list-header">
        <div>
          <h2>Channels</h2>
          <p>Join the conversation</p>
        </div>

        <button className="add-room-button" aria-label="Add room">
          +
        </button>
      </div>

      <div className="room-search">
        <span>⌕</span>
        <input type="text" placeholder="Find a channel..." />
      </div>

      <div className="room-category">
        <span>YOUR CHANNELS</span>
        <span>{rooms.length}</span>
      </div>

      <div className="rooms">
        {rooms.map((room) => (
          <div
            key={room.id}
            className={`room-item ${
              room.id === activeRoomId ? "selected" : ""
            }`}
          >
            <div className="room-icon">{room.icon}</div>

            <div className="room-info">
              <span className="room-name">#{room.name}</span>
              <span className="room-description">
                {room.description}
              </span>
            </div>

            {room.unread > 0 && (
              <span className="unread-count">{room.unread}</span>
            )}
          </div>
        ))}
      </div>

      <div className="room-list-footer">
        <span className="online-indicator"></span>
        <span>340 developers online</span>
      </div>
    </section>
  );
}

export default RoomList;