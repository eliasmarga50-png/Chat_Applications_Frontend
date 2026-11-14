import { useState } from "react";

import MessageItem from "./MessageItem";
import MessageInput from "./MessageInput";

function ChatWindow({ room, messages, onSendMessage }) {
  const [isLoading, setIsLoading] = useState(false);

  function simulateRefresh() {
    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);
    }, 600);
  }

  return (
    <main className="chat-window">
      <header className="chat-header">
        <div>
          <div className="chat-room-title">
            <span className="hash-symbol">#</span>
            <h2>{room.name}</h2>
          </div>

          <p>{room.description}</p>
        </div>

        <div className="chat-header-actions">
          <div className="member-count">
            <span>♙</span>
            {room.members} members
          </div>

          <button
            className="icon-button"
            type="button"
            aria-label="Simulate message loading"
            onClick={simulateRefresh}
          >
            ↻
          </button>
        </div>
      </header>

      <div className="message-list">
        {isLoading ? (
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>Loading messages...</p>
          </div>
        ) : messages.length > 0 ? (
          <>
            <div className="date-divider">
              <span>Today</span>
            </div>

            {messages.map((message) => (
              <MessageItem
                key={message.id}
                message={message}
              />
            ))}
          </>
        ) : (
          <div className="empty-messages">
            <div className="empty-message-icon">#</div>

            <h3>Welcome to #{room.name}</h3>

            <p>
              This channel is waiting for its first message.
              Start the conversation!
            </p>
          </div>
        )}
      </div>

      <MessageInput onSendMessage={onSendMessage} />
    </main>
  );
}

export default ChatWindow;