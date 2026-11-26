
import { memo } from "react";

function TypingIndicator({ userCount = 0 }) {
  if (userCount <= 0) {
    return null;
  }

  const label =
    userCount === 1
      ? "Someone is typing"
      : `${userCount} people are typing`;

  return (
    <div
      className="typing-indicator"
      role="status"
      aria-live="polite"
      aria-label={label}
    >
      <span className="typing-dots" aria-hidden="true">
        <span className="typing-dot" />
        <span className="typing-dot" />
        <span className="typing-dot" />
      </span>

      <span className="typing-label">
        {label}
        <span className="typing-ellipsis" aria-hidden="true">
          ...
        </span>
      </span>
    </div>
  );
}

export default memo(TypingIndicator);
