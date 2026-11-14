function RoomList({
  rooms,
  activeRoomId,
  onSelectRoom,
}) {
  return (
    <section className="room-list">
      <div className="room-list-header">
        <div>
          <h2>Channels</h2>
          <p>Join the conversation</p>
        </div>

        <button
          className="add-room-button"
          type="button"
          aria-label="Add room"
        >
          +
        </button>
      </div>

      <div className="room-search">
        <span>⌕</span>
        <input
          type="text"
          placeholder="Find a channel..."
          aria-label="Find a channel"
        />
      </div>

      <div className="room-category">
        <span>YOUR CHANNELS</span>
        <span>{rooms.length}</span>
      </div>

      <div className="rooms">
        {rooms.map((room) => (
          <button
            key={room.id}
            type="button"
            className={`room-item ${
              room.id === activeRoomId ? "selected" : ""
            }`}
            onClick={() => onSelectRoom(room.id)}
          >
            <div className="room-icon">{room.icon}</div>

            <div className="room-info">
              <span className="room-name">#{room.name}</span>

              <span className="room-description">
                {room.description}
              </span>
            </div>

            {room.unread > 0 && (
              <span className="unread-count">
                {room.unread}
              </span>
            )}
          </button>
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