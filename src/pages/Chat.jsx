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
import { useChatSocket } from "../hooks/useChatSocket";

import NotFound from "./NotFound";

function Chat() {
  const { user, token, logout } = useAuth();

  const navigate = useNavigate();
  const { slug } = useParams();

  const {
    rooms,
    loading: roomsLoading,
    error: roomsError,
    retry: retryRooms,
  } = useRooms();

  // Redirect /chat to the default room.
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

  const {
    room: detailedRoom,
    loading: roomLoading,
    error: roomError,
    retry: retryRoom,
  } = useRoom(slug);

  const {
    loading: messagesLoading,
    error: messagesError,
    hasMore,
    loadingOlder,
    olderError,
    reloadMessages,
    loadOlder,
    addRealtimeMessage,
  } = useMessages(slug, user?.username);

  const roomFromList = rooms.find(
    (item) => item.slug === slug
  );

  const activeRoom = detailedRoom || roomFromList || null;

  const {
    connectionStatus,
    connectionError,
    roomJoinError,
    joinedRoomSlug,
    sendMessage,
    onTypingChange,
    retryRoomJoin,
  } = useChatSocket(
    token,
    slug,
    addRealtimeMessage
  );

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

  function handleLogout() {
    logout();

    navigate("/login", {
      replace: true,
    });
  }

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
          loading={roomsLoading}
          error={roomsError}
          onRetry={retryRooms}
          onSelectRoom={handleSelectRoom}
        />

        <ChatWindow
          room={activeRoom}
          isLoading={roomLoading || messagesLoading}
          error={messagesError}
          olderError={olderError}
          hasMore={hasMore}
          loadingOlder={loadingOlder}
          onLoadOlder={loadOlder}
          onRetry={reloadMessages}
          roomError={roomError}
          onRetryRoom={retryRoom}
          onSendMessage={sendMessage}
          connectionStatus={connectionStatus}
          connectionError={connectionError}
          roomJoinError={roomJoinError}
          joinedRoomSlug={joinedRoomSlug}
          onRetryRoomJoin={retryRoomJoin}
          onTypingChange={onTypingChange}
        />
      </div>
    </div>
  );
}

export default Chat;