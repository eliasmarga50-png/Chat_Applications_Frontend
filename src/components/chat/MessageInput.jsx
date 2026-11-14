import { useState } from "react";
import TypingIndicator from "./TypingIndicator";

const MAX_MESSAGE_LENGTH = 4000;

function MessageInput({ onSendMessage }) {
  const [draft, setDraft] = useState("");
  const [error, setError] = useState("");

  const remainingCharacters =
    MAX_MESSAGE_LENGTH - draft.length;

  const isTyping = draft.trim().length > 0;

  function handleChange(event) {
    const value = event.target.value;

    setDraft(value);

    if (error) {
      setError("");
    }
  }

  function handleSubmit(event) {
    event.preventDefault();

    const trimmedMessage = draft.trim();

    if (!trimmedMessage) {
      setError("Message cannot be empty.");
      return;
    }

    if (trimmedMessage.length > MAX_MESSAGE_LENGTH) {
      setError("Message exceeds the 4,000 character limit.");
      return;
    }

    onSendMessage(trimmedMessage);

    setDraft("");
    setError("");
  }

  function handleKeyDown(event) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      event.currentTarget.form.requestSubmit();
    }
  }

  return (
    <div className="message-input-container">
      <TypingIndicator isTyping={isTyping} />

      <form onSubmit={handleSubmit}>
        <div className="message-toolbar">
          <span>Markdown supported</span>

          <span
            className={
              remainingCharacters < 100
                ? "character-warning"
                : ""
            }
          >
            {draft.length}/{MAX_MESSAGE_LENGTH}
          </span>
        </div>

        <div className="message-input-box">
          <button
            className="attachment-button"
            type="button"
            aria-label="Attach file"
          >
            +
          </button>

          <textarea
            value={draft}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder="Write a message..."
            aria-label="Write a message"
            maxLength={MAX_MESSAGE_LENGTH}
            rows={1}
          />

          <button
            className="send-button"
            type="submit"
            disabled={!draft.trim()}
            aria-label="Send message"
          >
            ↑
          </button>
        </div>

        {error && (
          <p className="message-error" role="alert">
            {error}
          </p>
        )}

        <p className="input-hint">
          Enter to send · Shift + Enter for a new line
        </p>
      </form>
    </div>
  );
}

export default MessageInput;