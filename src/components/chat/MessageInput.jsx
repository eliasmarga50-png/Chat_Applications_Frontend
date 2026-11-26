import {
  useEffect,
  useRef,
  useState,
} from "react";

const MAX_MESSAGE_LENGTH = 4000;
const TYPING_IDLE_MS = 1500;

function MessageInput({
  onSendMessage,
  onTypingChange,
  onNotify,
  disabled = false,
}) {
  const [draft, setDraft] = useState("");
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);

  const typingTimerRef = useRef(null);

  const remainingCharacters =
    MAX_MESSAGE_LENGTH - draft.length;

  function stopTypingTimer() {
    if (typingTimerRef.current) {
      clearTimeout(typingTimerRef.current);
      typingTimerRef.current = null;
    }
  }

  function handleChange(event) {
    const value = event.target.value;

    setDraft(value);

    if (error) {
      setError("");
    }

    stopTypingTimer();

    const typing = value.trim().length > 0;

    onTypingChange?.(typing);

    if (typing) {
      typingTimerRef.current = setTimeout(() => {
        onTypingChange?.(false);
        typingTimerRef.current = null;
      }, TYPING_IDLE_MS);
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const trimmedMessage = draft.trim();

    if (!trimmedMessage) {
      setError("Message cannot be empty.");
      return;
    }

    if (trimmedMessage.length > MAX_MESSAGE_LENGTH) {
      setError(
        "Message exceeds the 4,000 character limit."
      );
      return;
    }

    if (sending || disabled) {
      return;
    }

    setSending(true);
    setError("");

    stopTypingTimer();
    onTypingChange?.(false);

    try {
      // Wait for the backend acknowledgement.
      await onSendMessage(trimmedMessage);

      // Clear the draft only after successful acknowledgement.
      setDraft("");

      onNotify?.(
        "success",
        "Message sent successfully."
      );
    } catch (sendError) {
      const errorMessage =
        sendError.message ||
        "Message could not be sent. Try again.";

      setError(errorMessage);

      onNotify?.("error", errorMessage);
    } finally {
      setSending(false);
    }
  }

  function handleKeyDown(event) {
    if (
      event.key === "Enter" &&
      !event.shiftKey
    ) {
      event.preventDefault();
      event.currentTarget.form.requestSubmit();
    }
  }

  useEffect(() => {
    return () => {
      stopTypingTimer();
      onTypingChange?.(false);
    };
  }, [onTypingChange]);

  return (
    <div className="message-input-container">
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
            disabled
          >
            +
          </button>

          <textarea
            value={draft}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder={
              disabled
                ? "Connecting to chat..."
                : "Write a message..."
            }
            aria-label="Write a message"
            maxLength={MAX_MESSAGE_LENGTH}
            rows={1}
            disabled={disabled || sending}
          />

          <button
            className="send-button"
            type="submit"
            disabled={
              !draft.trim() ||
              disabled ||
              sending
            }
            aria-label="Send message"
          >
            {sending ? "…" : "↑"}
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