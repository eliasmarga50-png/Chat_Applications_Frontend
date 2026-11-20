import { useLayoutEffect, useRef } from "react";

import MessageItem from "./MessageItem";
import MessageInput from "./MessageInput";

function dateLabel(value) {
  if (!value) return "Earlier";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Earlier";
  }

  const today = new Date();
  const yesterday = new Date(today);

  yesterday.setDate(today.getDate() - 1);

  const sameDay = (a, b) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

  if (sameDay(date, today)) return "Today";
  if (sameDay(date, yesterday)) return "Yesterday";

  return date.toLocaleDateString([], {
    month: "long",
    day: "numeric",
    year:
      date.getFullYear() === today.getFullYear()
        ? undefined
        : "numeric",
  });
}

function ChatWindow({
  room,
  messages,
  isLoading,
  error,
  olderError,
  hasMore,
  loadingOlder,
  onLoadOlder,
  onRetry,
  roomError,
  onRetryRoom,
  onSendMessage,
}) {
  const messageContainerRef = useRef(null);

  const previousMessagesHeightRef = useRef(null);
  const previousRoomSlugRef = useRef(room?.slug);

  async function handleLoadOlder() {
    const container = messageContainerRef.current;

    if (container) {
      previousMessagesHeightRef.current = {
        height: container.scrollHeight,
        top: container.scrollTop,
      };
    }

    const succeeded = await onLoadOlder?.();

    if (!succeeded) {
      previousMessagesHeightRef.current = null;
    }
  }

  // Maintain scroll position when older messages are prepended.
  useLayoutEffect(() => {
    const container = messageContainerRef.current;

    if (!container) return;

    // Room changed.
    if (previousRoomSlugRef.current !== room?.slug) {
      previousRoomSlugRef.current = room?.slug;
      previousMessagesHeightRef.current = null;
      return;
    }

    const previousMetrics =
      previousMessagesHeightRef.current;

    // Older messages were loaded.
    if (previousMetrics) {
      container.scrollTop =
        previousMetrics.top +
        (container.scrollHeight - previousMetrics.height);

      previousMessagesHeightRef.current = null;
    } else if (!isLoading && messages.length > 0) {
      // Initial history: scroll to the latest messages.
      container.scrollTop = container.scrollHeight;
    }
  }, [room?.slug, messages, isLoading]);

  let previousDate = null;

  return (
    <main className="chat-window">
      <header className="chat-header">
        <div>
          <div className="chat-room-title">
            <span className="hash-symbol">#</span>

            <h2>
              {room?.name || "Loading channel..."}
            </h2>
          </div>

          <p>
            {room?.description ||
              "Loading channel information"}
          </p>

          {room?.tags?.length > 0 && (
            <div className="room-tags">
              {room.tags.map((tag) => (
                <span key={tag}>{tag}</span>
              ))}
            </div>
          )}
        </div>

        <div className="chat-header-actions">
          <button
            className="icon-button"
            type="button"
            aria-label="Refresh message history"
            title="Refresh message history"
            onClick={onRetry}
            disabled={isLoading}
          >
            ↻
          </button>
        </div>
      </header>

      {roomError && (
        <div className="api-inline-error" role="alert">
          <span>
            Room details could not be loaded.
          </span>

          <button
            type="button"
            onClick={onRetryRoom}
          >
            Retry
          </button>
        </div>
      )}

      <div
        className="message-list"
        ref={messageContainerRef}
      >
        {hasMore && !isLoading && !error && (
          <div className="older-messages-control">
            <button
              type="button"
              onClick={handleLoadOlder}
              disabled={loadingOlder}
            >
              {loadingOlder
                ? "Loading older messages..."
                : "Load older messages"}
            </button>
          </div>
        )}

        {olderError && (
          <div className="api-inline-error" role="alert">
            <span>
              {olderError.message ||
                "Couldn't load older messages."}
            </span>

            <button
              type="button"
              onClick={handleLoadOlder}
            >
              Retry
            </button>
          </div>
        )}

        {isLoading ? (
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>Loading messages...</p>
          </div>
        ) : error ? (
          <div className="api-error-state" role="alert">
            <h3>Couldn't load messages</h3>
            <p>{error.message}</p>

            <button
              type="button"
              onClick={onRetry}
            >
              Try again
            </button>
          </div>
        ) : messages.length > 0 ? (
          messages.map((message) => {
            const label = dateLabel(message.createdAt);
            const showDivider = label !== previousDate;

            previousDate = label;

            return (
              <div key={message.id}>
                {showDivider && (
                  <div className="date-divider">
                    <span>{label}</span>
                  </div>
                )}

                <MessageItem message={message} />
              </div>
            );
          })
        ) : (
          <div className="empty-messages">
            <div className="empty-message-icon">#</div>

            <h3>
              {room
                ? `Welcome to #${room.name}`
                : "Welcome to DevConnect"}
            </h3>

            <p>
              {room
                ? "This channel has no messages yet. Start the conversation!"
                : "Select a channel to start exploring."}
            </p>
          </div>
        )}
      </div>

      <MessageInput onSendMessage={onSendMessage} />
    </main>
  );
}

export default ChatWindow;