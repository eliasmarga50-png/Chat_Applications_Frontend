import {
  memo,
  useEffect,
  useMemo,
  useState,
} from "react";

import { useChat } from "../../hooks/useChat";

function RoomList({
  onSelectRoom,
  loading,
  error,
  onRetry,
  isMobileOpen = false,
  onClose,
}) {
  const { state } = useChat();

  const rooms = state.rooms;

  const activeRoomId = rooms.find(
    (room) => room.slug === state.activeRoomSlug
  )?.id;

  const [search, setSearch] = useState("");

  const [isMobileViewport, setIsMobileViewport] = useState(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(max-width: 760px)").matches
  );

  useEffect(() => {
    const mediaQuery = window.matchMedia(
      "(max-width: 760px)"
    );

    function updateViewport() {
      setIsMobileViewport(mediaQuery.matches);
    }

    updateViewport();

    mediaQuery.addEventListener(
      "change",
      updateViewport
    );

    return () => {
      mediaQuery.removeEventListener(
        "change",
        updateViewport
      );
    };
  }, []);

  const filteredRooms = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    if (!normalizedSearch) {
      return rooms;
    }

    return rooms.filter((room) =>
      `${room.name} ${room.description || ""} ${(room.tags || []).join(" ")}`
        .toLowerCase()
        .includes(normalizedSearch)
    );
  }, [rooms, search]);

  const roomListClass = [
    "room-list",
    isMobileOpen ? "is-mobile-open" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const shouldHideFromAccessibility =
    isMobileViewport && !isMobileOpen;

  return (
    <section
      id="channel-navigation"
      className={roomListClass}
      aria-label="Channel navigation"
      aria-hidden={shouldHideFromAccessibility}
      inert={shouldHideFromAccessibility}
    >
      <div className="room-list-header">
        <div>
          <h2>Channels</h2>
          <p>Join the conversation</p>
        </div>

        <div className="room-header-actions">
          <button
            className="add-room-button"
            type="button"
            aria-label="Add room"
            disabled
          >
            +
          </button>

          <button
            type="button"
            className="mobile-panel-close"
            onClick={onClose}
            aria-label="Close channel navigation"
          >
            ×
          </button>
        </div>
      </div>

      <div className="room-search">
        <span aria-hidden="true">⌕</span>

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
          <p
            className="room-list-status"
            role="status"
          >
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
              aria-current={
                room.id === activeRoomId
                  ? "page"
                  : undefined
              }
              onClick={() => onSelectRoom(room.id)}
            >
              <div
                className="room-icon"
                aria-hidden="true"
              >
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

export default memo(RoomList);