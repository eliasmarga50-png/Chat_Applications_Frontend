
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


  // 1. Fetch public rooms.
  const {
    rooms,
    loading: roomsLoading,
    error: roomsError,
    retry: retryRooms,
  } = useRooms();


  // 2. Redirect /chat to a default room.
  useEffect(() => {
    if (
      !slug &&
      !roomsLoading &&
      rooms.length > 0
    ) {
      const defaultRoom =
        rooms.find(
          (room) => room.slug === "javascript"
        ) || rooms[0];

      navigate(`/chat/${defaultRoom.slug}`, {
        replace: true,
      });
    }
  }, [slug, roomsLoading, rooms, navigate]);


  // 3. Fetch room details from REST.
  const {
    room: detailedRoom,
    loading: roomLoading,
    error: roomError,
    retry: retryRoom,
  } = useRoom(slug);


  // 4. Load room messages through REST.
  // Real-time messages will be merged into this same state.
  const {
    messages,
    loading: messagesLoading,
    error: messagesError,
    hasMore,
    loadingOlder,
    olderError,
    reloadMessages,
    loadOlder,
    addRealtimeMessage,
  } = useMessages(slug, user?.username);


  // Prefer the room detail response, falling back to the room list.
  const roomFromList = rooms.find(
    (item) => item.slug === slug
  );

  const activeRoom = detailedRoom || roomFromList || null;


  // 5. Connect to Socket.IO and handle real-time chat.
  const {
    connectionStatus,
    connectionError,
    roomJoinError,
    joinedRoomSlug,
    typingUserIds,
    sendMessage,
    onTypingChange,
    retryRoomJoin,
  } = useChatSocket(
    token,
    slug,
    addRealtimeMessage
  );


  // 6. Room selection changes the URL.
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
          onSendMessage={sendMessage}
          connectionStatus={connectionStatus}
          connectionError={connectionError}
          roomJoinError={roomJoinError}
          joinedRoomSlug={joinedRoomSlug}
          onRetryRoomJoin={retryRoomJoin}
          typingUserCount={typingUserIds.length}
          onTypingChange={onTypingChange}
        />
      </div>
    </div>
  );
}


export default Chat;
