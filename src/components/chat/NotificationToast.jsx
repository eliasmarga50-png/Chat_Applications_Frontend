import { useEffect } from "react";

function NotificationToast({
  notification,
  onDismiss,
}) {
  useEffect(() => {
    if (!notification) {
      return undefined;
    }

    const timer = window.setTimeout(() => {
      onDismiss();
    }, 3200);

    return () => {
      window.clearTimeout(timer);
    };
  }, [notification, onDismiss]);

  if (!notification) {
    return null;
  }

  const isError = notification.type === "error";

  return (
    <div
      className={`notification-toast ${
        isError
          ? "notification-toast-error"
          : "notification-toast-success"
      }`}
      role={isError ? "alert" : "status"}
      aria-live={isError ? "assertive" : "polite"}
    >
      <span
        className="notification-icon"
        aria-hidden="true"
      >
        {isError ? "!" : "✓"}
      </span>

      <span className="notification-message">
        {notification.message}
      </span>

      <button
        type="button"
        className="notification-close"
        onClick={onDismiss}
        aria-label="Dismiss notification"
      >
        ×
      </button>
    </div>
  );
}

export default NotificationToast;