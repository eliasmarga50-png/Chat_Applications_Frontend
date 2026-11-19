import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import Navbar from "../components/layout/Navbar";
import Sidebar from "../components/layout/Sidebar";

import RoomList from "../components/chat/RoomList";
import ChatWindow from "../components/chat/ChatWindow";

import { useAuth } from "../context/useAuth";

import {
  rooms,
  messages,
  activeRoomId as initialRoomId,
} from "../data/mockData";

import NotFound from "./NotFound";

function Chat() {
  const { user, logout } = useAuth();

  const navigate = useNavigate();
  const { slug } = useParams();

  // Find the room using the URL slug
  const activeRoom = rooms.find(
    (room) => room.name === slug
  );

  // Use the room's ID for the existing message system
  const activeRoomId = activeRoom?.id;

  // Messages remain separated by room
  const [messagesByRoom, setMessagesByRoom] = useState(() => ({
    "1": [],
    "2": messages,
    "3": [],
    "4": [],
  }));

  // Redirect /chat to the default room
  useEffect(() => {
    if (!slug) {
      const defaultRoom = rooms.find(
        (room) => room.id === initialRoomId
      );

      if (defaultRoom) {
        navigate(`/chat/${defaultRoom.name}`, {
          replace: true,
        });
      }
    }
  }, [slug, navigate]);

  // Select a room by navigating to its URL
  function handleSelectRoom(roomId) {
    const selectedRoom = rooms.find(
      (room) => room.id === roomId
    );

    if (selectedRoom) {
      navigate(`/chat/${selectedRoom.name}`);
    }
  }

  // Send a message to the currently selected room
  function handleSendMessage(content) {
    if (!activeRoomId) return;

    const newMessage = {
      id: Date.now().toString(),
      username: "you",
      displayName: "You",
      initials: "YO",
      content,
      time: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      isOwn: true,
    };

    setMessagesByRoom((previousMessages) => ({
      ...previousMessages,

      [activeRoomId]: [
        ...(previousMessages[activeRoomId] || []),
        newMessage,
      ],
    }));
  }

  // Log out and return to the login page
  function handleLogout() {
    logout();

    navigate("/login", {
      replace: true,
    });
  }

  // Unknown room slug
  if (slug && !activeRoom) {
    return <NotFound />;
  }

  return (
    <div className="app">
      <div className="session-bar">
        <span>
          Signed in as <strong>{user.username}</strong>
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
          activeRoomId={activeRoomId}
          onSelectRoom={handleSelectRoom}
        />

        {activeRoom ? (
          <ChatWindow
            room={activeRoom}
            messages={
              messagesByRoom[activeRoomId] || []
            }
            onSendMessage={handleSendMessage}
          />
        ) : (
          <main className="empty-chat">
            Select a channel to start exploring.
          </main>
        )}
      </div>
    </div>
  );
}

export default Chat;