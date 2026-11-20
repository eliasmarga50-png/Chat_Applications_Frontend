
import { useCallback, useEffect, useRef, useState } from "react";
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

  // Pagination guard: tracks whether an older-page request is already running.
  const olderRequestInProgressRef = useRef(false);

  // Load the initial page of messages.
  const loadMessages = useCallback(
    async (targetSlug, signal, updateLoading = true) => {
      if (!targetSlug) return;

      if (updateLoading) {
        setState((previous) => ({
          ...previous,
          slug: targetSlug,
          loading: true,
          error: null,
        }));
      }

      try {
        const data = await getRoomMessages(targetSlug, {
          limit: PAGE_SIZE,
          signal,
        });

        if (signal?.aborted) return;

        const normalizedMessages = data.messages
          .map((message) => normalizeMessage(message, currentUsername))
          .reverse();

        setState((previous) => ({
          slug: targetSlug,
          messages:
            previous.slug === targetSlug
              ? uniqueMessages([...previous.messages, ...normalizedMessages])
              : normalizedMessages,
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
    },
    [currentUsername]
  );

  // Fetch initial messages whenever the active room changes.
  useEffect(() => {
    if (!slug) return;

    const controller = new AbortController();

    initialRequestRef.current = controller;

    // Reset pagination lock for the new room.
    olderRequestInProgressRef.current = false;

    loadMessages(slug, controller.signal, false);

    return () => {
      controller.abort();
      olderRequestRef.current?.abort();
      olderRequestRef.current = null;

      // Release the pagination guard when leaving the room.
      olderRequestInProgressRef.current = false;

      initialRequestRef.current = null;
    };
  }, [slug, loadMessages]);

  // Reload the current room's messages.
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

  // Load the next older page.
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

    // Lock immediately before starting the request.
    // Repeated calls cannot start another pagination request.
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
        .map((message) => normalizeMessage(message, currentUsername))
        .reverse();

      setState((previous) => ({
        ...previous,
        messages: uniqueMessages([
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
      // Always release the lock when the request finishes.
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

  // Add a temporary message locally.
  // Step 5 does not persist messages through the backend yet.
  const addLocalMessage = useCallback(
    (message) => {
      const normalizedMessage = {
        ...message,
        id: message.id || `local-${Date.now()}`,
        username: currentUsername,
        displayName: message.displayName || currentUsername,
        initials: message.initials || currentUsername?.slice(0, 2).toUpperCase(),
        time: message.time || formatTime(message.createdAt || new Date()),
        isOwn: true,
        isLocal: true,
      };

      setState((previous) => ({
        ...previous,
        messages: [...previous.messages, normalizedMessage],
      }));
    },
    [currentUsername]
  );

  // Prevent messages from the previous room appearing during navigation.
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
      addLocalMessage,
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
    addLocalMessage,
  };
}

export { useMessages };
