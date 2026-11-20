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

          <span className="message-time">
            {message.time}
          </span>

          {message.isLocal && (
            <span className="message-local-label">
              Not saved
            </span>
          )}
        </div>

        {message.content && (
          <p className="message-text">
            {message.content}
          </p>
        )}

        {message.codeSnippet?.code && (
          <div className="message-code-snippet">
            <div className="message-code-language">
              {message.codeSnippet.language || "code"}

              {message.codeSnippet.filename &&
                ` · ${message.codeSnippet.filename}`}
            </div>

            <pre>
              <code>
                {message.codeSnippet.code}
              </code>
            </pre>
          </div>
        )}
      </div>
    </article>
  );
}

export default MessageItem;