import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  useNavigate,
  useParams,
} from "react-router-dom";

import Navbar from "../components/layout/Navbar";
import Sidebar from "../components/layout/Sidebar";
import RoomList from "../components/chat/RoomList";
import ChatWindow from "../components/chat/ChatWindow";
import NotificationToast from "../components/chat/NotificationToast";

import { useAuth } from "../context/useAuth";
import { useSocket } from "../hooks/useSocket";

import { useRooms } from "../hooks/useRooms";
import { useRoom } from "../hooks/useRoom";
import { useMessages } from "../hooks/useMessages";
import { useChatSocket } from "../hooks/useChatSocket";

import NotFound from "./NotFound";

function Chat() {
  const { user, token, logout } = useAuth();

  const { retryConnection } = useSocket();

  const navigate = useNavigate();
  const { slug } = useParams();

  const [mobilePanel, setMobilePanel] = useState(null);
  const [notification, setNotification] = useState(null);

  const {
    rooms,
    loading: roomsLoading,
    error: roomsError,
    retry: retryRooms,
  } = useRooms();

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
  } = useChatSocket(token, slug, addRealtimeMessage);

  const handleSelectRoom = useCallback(
    (roomId) => {
      const selectedRoom = rooms.find(
        (item) => item.id === roomId
      );

      if (selectedRoom) {
        navigate(`/chat/${selectedRoom.slug}`);
        setMobilePanel(null);
      }
    },
    [rooms, navigate]
  );

  const closeMobilePanel = useCallback(() => {
    setMobilePanel(null);
  }, []);

  const notify = useCallback((type, message) => {
    setNotification({
      type,
      message,
      id: Date.now(),
    });
  }, []);

  const dismissNotification = useCallback(() => {
    setNotification(null);
  }, []);

  function handleLogout() {
    setMobilePanel(null);
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

      <Navbar
        onOpenSidebar={() => setMobilePanel("sidebar")}
        onOpenRooms={() => setMobilePanel("rooms")}
        isSidebarOpen={mobilePanel === "sidebar"}
        isRoomsOpen={mobilePanel === "rooms"}
      />

      <div className="app-body">
        {mobilePanel && (
          <button
            type="button"
            className="mobile-panel-backdrop"
            aria-label="Close navigation menu"
            onClick={closeMobilePanel}
          />
        )}

        <Sidebar
          isMobileOpen={mobilePanel === "sidebar"}
          onNavigate={closeMobilePanel}
          onClose={closeMobilePanel}
        />

        <RoomList
          loading={roomsLoading}
          error={roomsError}
          onRetry={retryRooms}
          onSelectRoom={handleSelectRoom}
          isMobileOpen={mobilePanel === "rooms"}
          onClose={closeMobilePanel}
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
          onRetryConnection={retryConnection}
          onNotify={notify}
        />
      </div>

      <NotificationToast
        notification={notification}
        onDismiss={dismissNotification}
      />
    </div>
  );
}

export default Chat;