import { useState } from "react";

function RoomList({
  rooms,
  activeRoomId,
  onSelectRoom,
  loading,
  error,
  onRetry,
}) {
  const [search, setSearch] = useState("");

  const filteredRooms = rooms.filter((room) =>
    `${room.name} ${room.description || ""} ${(room.tags || []).join(" ")}`
      .toLowerCase()
      .includes(search.trim().toLowerCase())
  );

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
          disabled
        >
          +
        </button>
      </div>

      <div className="room-search">
        <span>⌕</span>

        <input
          type="search"
          placeholder="Find a channel..."
          aria-label="Find a channel"
          value={search}
          onChange={(event) =>
            setSearch(event.target.value)
          }
        />
      </div>

      <div className="room-category">
        <span>PUBLIC CHANNELS</span>
        <span>{loading ? "..." : rooms.length}</span>
      </div>

      <div className="rooms">
        {loading ? (
          <p className="room-list-status">
            Loading channels...
          </p>
        ) : error ? (
          <div className="room-list-status room-list-error">
            <p>Channels couldn't be loaded.</p>

            <button
              type="button"
              onClick={onRetry}
            >
              Retry
            </button>
          </div>
        ) : filteredRooms.length > 0 ? (
          filteredRooms.map((room) => (
            <button
              key={room.id}
              type="button"
              className={`room-item ${
                room.id === activeRoomId ? "selected" : ""
              }`}
              onClick={() => onSelectRoom(room.id)}
            >
              <div className="room-icon">
                {room.icon}
              </div>

              <div className="room-info">
                <span className="room-name">
                  #{room.name}
                </span>

                <span className="room-description">
                  {room.description}
                </span>
              </div>
            </button>
          ))
        ) : (
          <p className="room-list-status">
            No channels match your search.
          </p>
        )}
      </div>

      <div className="room-list-footer">
        <span>Public rooms from DevConnect API</span>
      </div>
    </section>
  );
}

export default RoomList;