import { useState } from "react";

import Navbar from "./components/layout/Navbar";
import Sidebar from "./components/layout/Sidebar";

import RoomList from "./components/chat/RoomList";
import ChatWindow from "./components/chat/ChatWindow";

import {
  rooms,
  messages,
  activeRoomId as initialRoomId,
} from "./data/mockData";

import "./App.css";

function App() {
  // Currently selected room
  const [activeRoomId, setActiveRoomId] = useState(initialRoomId);

  // Messages are stored separately for each room
  const [messagesByRoom, setMessagesByRoom] = useState(() => ({
    "1": [],
    "2": messages,
    "3": [],
    "4": [],
  }));

  // Find the currently selected room
  const activeRoom = rooms.find(
    (room) => room.id === activeRoomId
  );

  // Select a room
  function handleSelectRoom(roomId) {
    setActiveRoomId(roomId);
  }

  // Add a new message to the selected room
  function handleSendMessage(content) {
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

  return (
    <div className="app">
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
            messages={messagesByRoom[activeRoomId] || []}
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

export default App;