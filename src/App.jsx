import Navbar from "./components/layout/Navbar";
import Sidebar from "./components/layout/Sidebar";

import RoomList from "./components/chat/RoomList";
import ChatWindow from "./components/chat/ChatWindow";

import { rooms, messages, activeRoomId } from "./data/mockData";

import "./App.css";

function App() {
  const activeRoom = rooms.find(
    (room) => room.id === activeRoomId
  );

  return (
    <div className="app">
      <Navbar />

      <div className="app-body">
        <Sidebar />

        <RoomList
          rooms={rooms}
          activeRoomId={activeRoomId}
        />

        {activeRoom ? (
          <ChatWindow
            room={activeRoom}
            messages={messages}
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