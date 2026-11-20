import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import { getRoomMessages } from "../services/messageService";

const PAGE_SIZE = 20;

// Convert backend message data into the format
// used by the existing frontend components.
function normalizeMessage(message, currentUsername) {
  const sender =
    typeof message.sender === "object"
      ? message.sender
      : null;

  const username =
    sender?.username ||
    message.username ||
    "unknown";

  const displayName =
    sender?.displayName ||
    message.displayName ||
    username;

  const createdAt =
    message.createdAt ||
    message.time ||
    new Date().toISOString();

  return {
    ...message,

    id: String(message._id ?? message.id),

    username,
    displayName,

    initials: displayName
      .split(" ")
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase(),

    content: message.content || "",

    createdAt,

    time: new Date(createdAt).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    }),

    isOwn: username === currentUsername,
  };
}

// Remove duplicate messages using their IDs.
function deduplicateMessages(messages) {
  const seen = new Set();

  return messages.filter((message) => {
    if (seen.has(message.id)) {
      return false;
    }

    seen.add(message.id);
    return true;
  });
}

// Sort messages chronologically.
function sortMessages(messages) {
  return [...messages].sort((a, b) => {
    const dateDifference =
      new Date(a.createdAt) - new Date(b.createdAt);

    if (dateDifference !== 0) {
      return dateDifference;
    }

    return a.id.localeCompare(b.id);
  });
}

export function useMessages(slug, currentUsername) {
  const [messages, setMessages] = useState([]);

  const [loading, setLoading] = useState(Boolean(slug));
  const [error, setError] = useState(null);

  const [hasMore, setHasMore] = useState(false);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [olderError, setOlderError] = useState(null);

  const cursorRef = useRef(null);
  const olderRequestRef = useRef(false);

  const [refreshKey, setRefreshKey] = useState(0);

  const reload = useCallback(() => {
    setRefreshKey((previous) => previous + 1);
  }, []);

  // Load the initial page whenever the room changes.
  useEffect(() => {
    if (!slug) {
      setMessages([]);
      setLoading(false);
      setError(null);
      setHasMore(false);
      cursorRef.current = null;
      return;
    }

    const controller = new AbortController();

    async function fetchInitialMessages() {
      setLoading(true);
      setError(null);
      setOlderError(null);
      setLoadingOlder(false);
      setHasMore(false);
      cursorRef.current = null;
      olderRequestRef.current = false;

      try {
        const data = await getRoomMessages(slug, {
          limit: PAGE_SIZE,
          signal: controller.signal,
        });

        const normalizedMessages = (
          data.messages || []
        ).map((message) =>
          normalizeMessage(message, currentUsername)
        );

        setMessages(
          sortMessages(
            deduplicateMessages(normalizedMessages)
          )
        );

        setHasMore(Boolean(data.hasMore));
        cursorRef.current = data.nextCursor || null;
      } catch (err) {
        if (err.name === "AbortError") return;

        setMessages([]);
        setError(err);
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    fetchInitialMessages();

    return () => {
      controller.abort();
    };
  }, [slug, currentUsername, refreshKey]);

  // Fetch the next older page.
  const loadOlder = useCallback(async () => {
    if (
      !slug ||
      loading ||
      loadingOlder ||
      olderRequestRef.current ||
      !hasMore ||
      !cursorRef.current
    ) {
      return;
    }

    olderRequestRef.current = true;
    setLoadingOlder(true);
    setOlderError(null);

    const cursor = cursorRef.current;

    try {
      const data = await getRoomMessages(slug, {
        limit: PAGE_SIZE,
        before: cursor.createdAt,
        beforeId: cursor._id,
      });

      const olderMessages = (data.messages || []).map(
        (message) =>
          normalizeMessage(message, currentUsername)
      );

      setMessages((previousMessages) =>
        sortMessages(
          deduplicateMessages([
            ...previousMessages,
            ...olderMessages,
          ])
        )
      );

      cursorRef.current = data.nextCursor || null;
      setHasMore(Boolean(data.hasMore));
    } catch (err) {
      setOlderError(err);
    } finally {
      olderRequestRef.current = false;
      setLoadingOlder(false);
    }
  }, [
    slug,
    loading,
    loadingOlder,
    hasMore,
    currentUsername,
  ]);

  // Add a temporary local message.
  // Step 6 will replace this with real Socket.IO sending.
  const addLocalMessage = useCallback((message) => {
    setMessages((previousMessages) =>
      sortMessages(
        deduplicateMessages([
          ...previousMessages,
          message,
        ])
      )
    );
  }, []);

  return {
    messages,
    loading,
    error,
    hasMore,
    loadingOlder,
    olderError,
    reload,
    loadOlder,
    addLocalMessage,
  };
}