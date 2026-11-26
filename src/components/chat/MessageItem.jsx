
function MessageItem({ message, showHeader = true }) {
  const displayName =
    message.displayName || message.username || "Unknown";

  const initials =
    message.initials ||
    displayName
      .split(" ")
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();

  const createdAt = message.createdAt
    ? new Date(message.createdAt)
    : null;

  const validDate =
    createdAt && !Number.isNaN(createdAt.getTime());

  const fullTimestamp = validDate
    ? createdAt.toLocaleString()
    : "";

  return (
    <article
      className={`message-item ${
        message.isOwn ? "own-message" : ""
      } ${
        showHeader
          ? "message-group-start"
          : "message-group-continuation"
      }`}
    >
      {showHeader ? (
        <div
          className={`avatar ${
            message.isOwn ? "avatar-you" : "avatar-other"
          }`}
          aria-hidden="true"
        >
          {initials}
        </div>
      ) : (
        <div
          className="message-avatar-placeholder"
          aria-hidden="true"
        />
      )}

      <div className="message-content">
        {showHeader && (
          <div className="message-meta">
            <span className="message-author">
              {displayName}
            </span>

            {message.username && (
              <span className="message-username">
                @{message.username}
              </span>
            )}

            {validDate && (
              <time
                className="message-time"
                dateTime={createdAt.toISOString()}
                title={fullTimestamp}
              >
                {createdAt.toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </time>
            )}

            {message.isLocal && (
              <span className="message-local-label">
                Not saved
              </span>
            )}
          </div>
        )}

        {message.content && (
          <p className="message-text">
            {message.content}
          </p>
        )}

        {message.codeSnippet?.code && (
          <div className="message-code-snippet">
            <div className="message-code-language">
              <span>
                {message.codeSnippet.language || "code"}
              </span>

              {message.codeSnippet.filename && (
                <span>
                  {message.codeSnippet.filename}
                </span>
              )}
            </div>

            <pre>
              <code>{message.codeSnippet.code}</code>
            </pre>
          </div>
        )}
      </div>
    </article>
  );
}

export default MessageItem;
