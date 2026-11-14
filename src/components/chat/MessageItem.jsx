function MessageItem({ message }) {
  return (
    <article
      className={`message-item ${
        message.isOwn ? "own-message" : ""
      }`}
    >
      <div
        className={`avatar ${
          message.isOwn ? "avatar-you" : "avatar-other"
        }`}
      >
        {message.initials}
      </div>

      <div className="message-content">
        <div className="message-meta">
          <span className="message-author">
            {message.displayName}
          </span>

          <span className="message-username">
            @{message.username}
          </span>

          <span className="message-time">{message.time}</span>
        </div>

        <p className="message-text">{message.content}</p>
      </div>
    </article>
  );
}

export default MessageItem;