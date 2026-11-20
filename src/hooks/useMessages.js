import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import { getRoomMessages } from "../services/messageService";

const PAGE_SIZE = 20;

function formatTime(value) {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function normalizeMessage(message, currentUsername) {
  const sender =
    message.sender && typeof message.sender === "object"
      ? message.sender
      : {};

  const username = sender.username || "unknown";
  const displayName = sender.displayName || username;

  const createdAt =
    message.createdAt || message.updatedAt || null;

  const content =
    message.content || message.codeSnippet?.code || "";

  return {
    ...message,

    id: String(message._id ?? message.id),

    username,
    displayName,

    initials:
      displayName
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0].toUpperCase())
        .join("") || "?",

    content,
    createdAt,
    time: formatTime(createdAt),

    isOwn: Boolean(
      currentUsername &&
        username === currentUsername
    ),
  };
}

function uniqueMessages(messages) {
  const seen = new Set();

  return messages.filter((message) => {
    if (seen.has(message.id)) return false;

    seen.add(message.id);
    return true;
  });
}

function sortMessages(messages) {
  return [...messages].sort((a, b) => {
    const timeDifference =
      new Date(a.createdAt) - new Date(b.createdAt);

    if (timeDifference !== 0) {
      return timeDifference;
    }

    return a.id.localeCompare(b.id);
  });
}

export function useMessages(slug, currentUsername) {
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

  const olderControllerRef = useRef(null);
  const initialControllerRef = useRef(null);

  // Fetch initial history.
  const loadInitial = useCallback(
    async (targetSlug, signal, updateLoading = true) => {
      if (!targetSlug) return;

      if (updateLoading) {
        setState({
          slug: targetSlug,
          messages: [],
          loading: true,
          error: null,
          hasMore: false,
          nextCursor: null,
          loadingOlder: false,
          olderError: null,
        });
      }

      try {
        const data = await getRoomMessages(targetSlug, {
          limit: PAGE_SIZE,
          signal,
        });

        if (signal?.aborted) return;

        // Backend order is newest -> oldest.
        // UI order should be oldest -> newest.
        const normalized = (data.messages || [])
          .map((message) =>
            normalizeMessage(message, currentUsername)
          )
          .reverse();

        setState((previous) => {
          const localMessages =
            previous.slug === targetSlug
              ? previous.messages.filter(
                  (message) => message.isLocal
                )
              : [];

          return {
            slug: targetSlug,
            messages: uniqueMessages([
              ...normalized,
              ...localMessages,
            ]),
            loading: false,
            error: null,
            hasMore: Boolean(data.hasMore),
            nextCursor: data.nextCursor,
            loadingOlder: false,
            olderError: null,
          };
        });
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

  // Fetch history when the selected room changes.
  useEffect(() => {
    if (!slug) return;

    const controller = new AbortController();

    initialControllerRef.current = controller;

    loadInitial(slug, controller.signal, false);

    return () => {
      controller.abort();

      initialControllerRef.current?.abort();
      initialControllerRef.current = null;

      olderControllerRef.current?.abort();
      olderControllerRef.current = null;
    };
  }, [slug, loadInitial]);

  // Retry the initial history request.
  const reload = useCallback(() => {
    if (!slug) return;

    initialControllerRef.current?.abort();
    olderControllerRef.current?.abort();

    const controller = new AbortController();

    initialControllerRef.current = controller;

    loadInitial(slug, controller.signal);
  }, [slug, loadInitial]);

  // Fetch the next older page using the backend cursor.
  const loadOlder = useCallback(async () => {
    if (
      !slug ||
      state.slug !== slug ||
      !state.hasMore ||
      !state.nextCursor ||
      state.loadingOlder
    ) {
      return false;
    }

    olderControllerRef.current?.abort();

    const controller = new AbortController();

    olderControllerRef.current = controller;

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

      const olderMessages = (data.messages || [])
        .map((message) =>
          normalizeMessage(message, currentUsername)
        )
        .reverse();

      setState((previous) => {
        if (previous.slug !== slug) {
          return previous;
        }

        return {
          ...previous,
          messages: uniqueMessages([
            ...olderMessages,
            ...previous.messages,
          ]),
          hasMore: Boolean(data.hasMore),
          nextCursor: data.nextCursor,
          loadingOlder: false,
          olderError: null,
        };
      });

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
    }
  }, [
    slug,
    state.slug,
    state.hasMore,
    state.nextCursor,
    state.loadingOlder,
    currentUsername,
  ]);

  // Temporary local sending until Step 6.
  const addLocalMessage = useCallback(
    (message) => {
      setState((previous) => {
        if (previous.slug !== slug) {
          return {
            slug,
            messages: [message],
            loading: true,
            error: null,
            hasMore: false,
            nextCursor: null,
            loadingOlder: false,
            olderError: null,
          };
        }

        return {
          ...previous,
          messages: [
            ...previous.messages,
            message,
          ],
        };
      });
    },
    [slug]
  );

  // Prevent displaying previous room's messages.
  if (state.slug !== slug) {
    return {
      messages: [],
      loading: Boolean(slug),
      error: null,
      hasMore: false,
      loadingOlder: false,
      olderError: null,
      reload,
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
    reload,
    loadOlder,
    addLocalMessage,
  };
}