function MessageInput() {
  return (
    <div className="message-input-container">
      <div className="message-toolbar">
        <span>Markdown supported</span>
        <span>Maximum 4,000 characters</span>
      </div>

      <div className="message-input-box">
        <button
          className="attachment-button"
          aria-label="Attach file"
          type="button"
        >
          +
        </button>

        <input
          type="text"
          placeholder="Message #react..."
          aria-label="Write a message"
        />

        <button
          className="send-button"
          type="button"
          disabled
        >
          ↑
        </button>
      </div>

      <p className="input-hint">
        Press Enter to send · Use Shift + Enter for a new line
      </p>
    </div>
  );
}

export default MessageInput;