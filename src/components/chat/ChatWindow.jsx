import MessageItem from "./MessageItem";
import MessageInput from "./MessageInput";

function ChatWindow({ room, messages }) {
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

          <button className="icon-button" aria-label="More options">
            ⋯
          </button>
        </div>
      </header>

      <div className="message-list">
        <div className="date-divider">
          <span>Today</span>
        </div>

        {messages.length > 0 ? (
          messages.map((message) => (
            <MessageItem
              key={message.id}
              message={message}
            />
          ))
        ) : (
          <div className="empty-messages">
            No messages in this channel yet.
          </div>
        )}
      </div>

      <MessageInput />
    </main>
  );
}

export default ChatWindow;