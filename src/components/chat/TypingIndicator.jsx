function TypingIndicator({ isTyping }) {
  if (!isTyping) {
    return null;
  }

  return (
    <div className="typing-indicator">
      <span className="typing-dot"></span>
      <span className="typing-dot"></span>
      <span className="typing-dot"></span>

      <span>You are typing...</span>
    </div>
  );
}

export default TypingIndicator;