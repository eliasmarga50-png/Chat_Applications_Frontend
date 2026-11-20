import { useCallback, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";

import Navbar from "../components/layout/Navbar";
import Sidebar from "../components/layout/Sidebar";
import RoomList from "../components/chat/RoomList";
import ChatWindow from "../components/chat/ChatWindow";

import { useAuth } from "../context/useAuth";
import { useRooms } from "../hooks/useRooms";
import { useRoom } from "../hooks/useRoom";
import { useMessages } from "../hooks/useMessages";

import NotFound from "./NotFound";

function Chat() {
  const { user, logout } = useAuth();

  const navigate = useNavigate();
  const { slug } = useParams();

  // 1. Fetch public rooms.
  const {
    rooms,
    loading: roomsLoading,
    error: roomsError,
    retry: retryRooms,
  } = useRooms();

  // 2. Redirect /chat to a default room.
  useEffect(() => {
    if (!slug && !roomsLoading && rooms.length > 0) {
      const defaultRoom =
        rooms.find((room) => room.slug === "javascript") ||
        rooms[0];

      navigate(`/chat/${defaultRoom.slug}`, {
        replace: true,
      });
    }
  }, [slug, roomsLoading, rooms, navigate]);

  // 3. Fetch room details by URL slug.
  const {
    room: detailedRoom,
    loading: roomLoading,
    error: roomError,
    retry: retryRoom,
  } = useRoom(slug);

  // 4. Fetch message history for the selected room.
  const {
    messages,
    loading: messagesLoading,
    error: messagesError,
    hasMore,
    loadingOlder,
    olderError,
    reload: reloadMessages,
    loadOlder,
    addLocalMessage,
  } = useMessages(slug, user?.username);

  // The API room details are the preferred source.
  const activeRoom = detailedRoom;

  // 5. Select a room using its ID, then navigate using its slug.
  const handleSelectRoom = useCallback(
    (roomId) => {
      const selectedRoom = rooms.find(
        (item) => item.id === roomId
      );

      if (selectedRoom) {
        navigate(`/chat/${selectedRoom.slug}`);
      }
    },
    [rooms, navigate]
  );

  // 6. Temporary local sending until Step 6.
  function handleSendMessage(content) {
    if (!activeRoom) return;

    const displayName =
      user?.displayName || user?.username || "You";

    const newMessage = {
      id: `local-${Date.now()}`,
      username: user?.username || "you",
      displayName,
      initials: displayName
        .split(" ")
        .map((part) => part[0])
        .join("")
        .slice(0, 2)
        .toUpperCase(),
      content,
      createdAt: new Date().toISOString(),
      time: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      isOwn: true,
      isLocal: true,
    };

    addLocalMessage(newMessage);
  }

  // 7. Logout.
  function handleLogout() {
    logout();

    navigate("/login", {
      replace: true,
    });
  }

  // Unknown room.
  if (slug && roomError?.status === 404) {
    return <NotFound />;
  }

  return (
    <div className="app">
      <div className="session-bar">
        <span>
          Signed in as <strong>{user?.username}</strong>
        </span>

        <button
          type="button"
          onClick={handleLogout}
        >
          Log out
        </button>
      </div>

      <Navbar />

      <div className="app-body">
        <Sidebar />

        <RoomList
          rooms={rooms}
          activeRoomId={activeRoom?.id}
          loading={roomsLoading}
          error={roomsError}
          onRetry={retryRooms}
          onSelectRoom={handleSelectRoom}
        />

        <ChatWindow
          room={activeRoom}
          messages={messages}
          isLoading={roomLoading || messagesLoading}
          error={messagesError}
          olderError={olderError}
          hasMore={hasMore}
          loadingOlder={loadingOlder}
          onLoadOlder={loadOlder}
          onRetry={reloadMessages}
          roomError={roomError}
          onRetryRoom={retryRoom}
          onSendMessage={handleSendMessage}
        />
      </div>
    </div>
  );
}

export default Chat;