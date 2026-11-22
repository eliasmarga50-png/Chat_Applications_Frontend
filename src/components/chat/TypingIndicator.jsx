
function TypingIndicator({ userCount = 0 }) {
  if (!userCount) return null;

  const label =
    userCount === 1
      ? "Someone is typing..."
      : `${userCount} people are typing...`;

  return (
    <div className="typing-indicator" aria-live="polite">
      <span className="typing-dot"></span>
      <span className="typing-dot"></span>
      <span className="typing-dot"></span>
      <span>{label}</span>
    </div>
  );
}

export default TypingIndicator;
