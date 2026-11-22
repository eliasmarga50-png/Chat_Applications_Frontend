
import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import { getRoomMessages } from "../services/messageService";

const PAGE_SIZE = 20;


function formatTime(date) {
  return new Date(date).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}


function normalizeMessage(message, currentUsername) {
  const sender = message.sender || {};

  const content =
    message.type === "code"
      ? message.codeSnippet?.code || message.content || ""
      : message.content || "";

  const username = sender.username || "Unknown";
  const displayName = sender.displayName || username;

  const initials = displayName
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return {
    ...message,
    id: String(message._id || message.id),
    username,
    displayName,
    initials,
    content,
    createdAt: message.createdAt,
    time: formatTime(message.createdAt),
    isOwn: username === currentUsername,
    isLocal: false,
  };
}


function uniqueMessages(messages) {
  const seen = new Set();

  return messages.filter((message) => {
    if (seen.has(message.id)) {
      return false;
    }

    seen.add(message.id);
    return true;
  });
}


function chronological(messages) {
  return uniqueMessages(messages).sort((a, b) => {
    const timeDifference =
      new Date(a.createdAt) - new Date(b.createdAt);

    if (timeDifference !== 0) {
      return timeDifference;
    }

    return String(a.id).localeCompare(String(b.id));
  });
}


function useMessages(slug, currentUsername) {
  const [state, setState] = useState({
    slug: null,
    messages: [],
    loading: false,
    error: null,
    hasMore: false,
    nextCursor: null,
    loadingOlder: false,
    olderError: null,
  });

  const initialRequestRef = useRef(null);
  const olderRequestRef = useRef(null);
  const olderRequestInProgressRef = useRef(false);


  // Load the initial message page from the REST API.
  const loadMessages = useCallback(async (
    targetSlug,
    signal
  ) => {
    if (!targetSlug) return;

    setState((previous) => ({
      ...previous,
      slug: targetSlug,
      messages:
        previous.slug === targetSlug
          ? previous.messages
          : [],
      loading: true,
      error: null,
    }));

    try {
      const data = await getRoomMessages(targetSlug, {
        limit: PAGE_SIZE,
        signal,
      });

      if (signal?.aborted) return;

      const fetchedMessages = data.messages
        .map((message) =>
          normalizeMessage(message, currentUsername)
        )
        .reverse();

      setState((previous) => ({
        slug: targetSlug,

        // Merge messages received through Socket.IO while
        // the REST request was loading.
        messages: chronological(
          previous.slug === targetSlug
            ? [...previous.messages, ...fetchedMessages]
            : fetchedMessages
        ),

        loading: false,
        error: null,
        hasMore: data.hasMore,
        nextCursor: data.nextCursor,
        loadingOlder: false,
        olderError: null,
      }));
    } catch (error) {
      if (signal?.aborted) return;

      setState((previous) => ({
        ...previous,
        slug: targetSlug,
        loading: false,
        error,
      }));
    }
  }, [currentUsername]);


  // Fetch initial history when the selected room changes.
  useEffect(() => {
    if (!slug) return undefined;

    const controller = new AbortController();
    initialRequestRef.current = controller;

    olderRequestInProgressRef.current = false;

    loadMessages(slug, controller.signal);

    return () => {
      controller.abort();

      olderRequestRef.current?.abort();
      olderRequestRef.current = null;

      olderRequestInProgressRef.current = false;
      initialRequestRef.current = null;
    };
  }, [slug, loadMessages]);


  // Reload current room's message history.
  const reloadMessages = useCallback(() => {
    if (!slug) return;

    initialRequestRef.current?.abort();
    olderRequestRef.current?.abort();

    olderRequestRef.current = null;
    olderRequestInProgressRef.current = false;

    const controller = new AbortController();
    initialRequestRef.current = controller;

    loadMessages(slug, controller.signal);
  }, [slug, loadMessages]);


  // Fetch the next older message page using the existing cursor.
  const loadOlder = useCallback(async () => {
    if (
      !slug ||
      !state.hasMore ||
      !state.nextCursor ||
      state.loading ||
      olderRequestInProgressRef.current
    ) {
      return false;
    }

    olderRequestInProgressRef.current = true;

    const controller = new AbortController();
    olderRequestRef.current = controller;

    setState((previous) => ({
      ...previous,
      loadingOlder: true,
      olderError: null,
    }));

    try {
      const data = await getRoomMessages(slug, {
        limit: PAGE_SIZE,
        before: state.nextCursor.createdAt,
        beforeId: state.nextCursor._id,
        signal: controller.signal,
      });

      if (controller.signal.aborted) {
        return false;
      }

      const olderMessages = data.messages
        .map((message) =>
          normalizeMessage(message, currentUsername)
        )
        .reverse();

      setState((previous) => ({
        ...previous,
        messages: chronological([
          ...olderMessages,
          ...previous.messages,
        ]),
        hasMore: data.hasMore,
        nextCursor: data.nextCursor,
        loadingOlder: false,
        olderError: null,
      }));

      return true;
    } catch (error) {
      if (controller.signal.aborted) {
        return false;
      }

      setState((previous) => ({
        ...previous,
        loadingOlder: false,
        olderError: error,
      }));

      return false;
    } finally {
      olderRequestInProgressRef.current = false;

      if (olderRequestRef.current === controller) {
        olderRequestRef.current = null;
      }
    }
  }, [
    slug,
    state.hasMore,
    state.nextCursor,
    state.loading,
    currentUsername,
  ]);


  // Add a message received from the Socket.IO server.
  const addRealtimeMessage = useCallback((message) => {
    if (!message?.room || message.room !== slug) {
      return;
    }

    const normalizedMessage = normalizeMessage(
      message,
      currentUsername
    );

    setState((previous) => {
      const existingMessages =
        previous.slug === message.room
          ? previous.messages
          : [];

      return {
        ...previous,
        slug: message.room,
        messages: chronological([
          ...existingMessages,
          normalizedMessage,
        ]),
      };
    });
  }, [slug, currentUsername]);


  // Don't show messages belonging to the previous room.
  if (state.slug !== slug) {
    return {
      messages: [],
      loading: Boolean(slug),
      error: null,
      hasMore: false,
      loadingOlder: false,
      olderError: null,
      reloadMessages,
      loadOlder,
      addRealtimeMessage,
    };
  }


  return {
    messages: state.messages,
    loading: state.loading,
    error: state.error,
    hasMore: state.hasMore,
    loadingOlder: state.loadingOlder,
    olderError: state.olderError,
    reloadMessages,
    loadOlder,
    addRealtimeMessage,
  };
}


export { useMessages };
