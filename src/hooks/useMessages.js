import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import { getRoomMessages } from "../services/messageService";
import { useChat } from "./useChat";

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

function useMessages(slug, currentUsername) {
  const { state, dispatch } = useChat();

  const [meta, setMeta] = useState({
    slug: null,
    loading: false,
    error: null,
    hasMore: false,
    nextCursor: null,
    loadingOlder: false,
    olderError: null,
  });

  const initialControllerRef = useRef(null);
  const olderControllerRef = useRef(null);

  const olderInProgressRef = useRef(false);
  const requestVersionRef = useRef(0);

  const loadMessages = useCallback(
    async (targetSlug, signal) => {
      if (!targetSlug) return;

      const requestVersion =
        ++requestVersionRef.current;

      setMeta((previous) => ({
        ...previous,
        slug: targetSlug,
        loading: true,
        error: null,
      }));

      dispatch({
        type: "SET_LOADING_MESSAGES",
        payload: true,
      });

      try {
        const data = await getRoomMessages(
          targetSlug,
          {
            limit: PAGE_SIZE,
            signal,
          }
        );

        if (
          signal?.aborted ||
          requestVersion !== requestVersionRef.current
        ) {
          return;
        }

        const fetched = data.messages
          .map((message) =>
            normalizeMessage(message, currentUsername)
          )
          .reverse();

        // Merge rather than replace, because realtime
        // messages may have arrived while REST was loading.
        dispatch({
          type: "ADD_MESSAGES",
          payload: {
            roomSlug: targetSlug,
            messages: fetched,
          },
        });

        setMeta({
          slug: targetSlug,
          loading: false,
          error: null,
          hasMore: Boolean(data.hasMore),
          nextCursor: data.nextCursor || null,
          loadingOlder: false,
          olderError: null,
        });
      } catch (requestError) {
        if (
          signal?.aborted ||
          requestVersion !== requestVersionRef.current
        ) {
          return;
        }

        setMeta((previous) => ({
          ...previous,
          slug: targetSlug,
          loading: false,
          error: requestError,
        }));
      } finally {
        if (
          !signal?.aborted &&
          requestVersion === requestVersionRef.current
        ) {
          dispatch({
            type: "SET_LOADING_MESSAGES",
            payload: false,
          });
        }
      }
    },
    [currentUsername, dispatch]
  );

  // Fetch message history whenever the URL room changes.
  useEffect(() => {
    if (!slug) return undefined;

    dispatch({
      type: "SET_ACTIVE_ROOM",
      payload: slug,
    });

    const controller = new AbortController();

    initialControllerRef.current = controller;

    olderControllerRef.current?.abort();
    olderInProgressRef.current = false;

    loadMessages(slug, controller.signal);

    return () => {
      controller.abort();

      olderControllerRef.current?.abort();
      olderControllerRef.current = null;

      olderInProgressRef.current = false;
    };
  }, [slug, loadMessages, dispatch]);

  const reloadMessages = useCallback(() => {
    if (!slug) return;

    initialControllerRef.current?.abort();
    olderControllerRef.current?.abort();

    olderInProgressRef.current = false;

    const controller = new AbortController();

    initialControllerRef.current = controller;

    loadMessages(slug, controller.signal);
  }, [slug, loadMessages]);

  // Fetch the next older page using the existing backend cursor.
  const loadOlder = useCallback(async () => {
    if (
      !slug ||
      !meta.hasMore ||
      !meta.nextCursor ||
      meta.loading ||
      olderInProgressRef.current
    ) {
      return false;
    }

    olderInProgressRef.current = true;

    const controller = new AbortController();

    olderControllerRef.current = controller;

    setMeta((previous) => ({
      ...previous,
      loadingOlder: true,
      olderError: null,
    }));

    try {
      const data = await getRoomMessages(slug, {
        limit: PAGE_SIZE,
        before: meta.nextCursor.createdAt,
        beforeId: meta.nextCursor._id,
        signal: controller.signal,
      });

      if (controller.signal.aborted) {
        return false;
      }

      const older = data.messages
        .map((message) =>
          normalizeMessage(message, currentUsername)
        )
        .reverse();

      dispatch({
        type: "ADD_MESSAGES",
        payload: {
          roomSlug: slug,
          messages: older,
        },
      });

      setMeta((previous) => ({
        ...previous,
        hasMore: Boolean(data.hasMore),
        nextCursor: data.nextCursor || null,
        loadingOlder: false,
        olderError: null,
      }));

      return true;
    } catch (requestError) {
      if (controller.signal.aborted) {
        return false;
      }

      setMeta((previous) => ({
        ...previous,
        loadingOlder: false,
        olderError: requestError,
      }));

      return false;
    } finally {
      olderInProgressRef.current = false;

      if (olderControllerRef.current === controller) {
        olderControllerRef.current = null;
      }
    }
  }, [
    slug,
    meta.hasMore,
    meta.nextCursor,
    meta.loading,
    currentUsername,
    dispatch,
  ]);

  // Store incoming Socket.IO messages in the same reducer state.
  const addRealtimeMessage = useCallback(
    (message) => {
      if (!message?.room || message.room !== slug) {
        return;
      }

      dispatch({
        type: "ADD_MESSAGE",
        payload: {
          roomSlug: message.room,
          message: normalizeMessage(
            message,
            currentUsername
          ),
        },
      });
    },
    [slug, currentUsername, dispatch]
  );

  const isCurrentRoom = meta.slug === slug;

  const messages = isCurrentRoom
    ? state.messagesByRoom[slug] || []
    : [];

  return {
    messages,

    loading: !isCurrentRoom || meta.loading,
    error: isCurrentRoom ? meta.error : null,

    hasMore: isCurrentRoom && meta.hasMore,
    loadingOlder: isCurrentRoom && meta.loadingOlder,
    olderError: isCurrentRoom ? meta.olderError : null,

    reloadMessages,
    loadOlder,
    addRealtimeMessage,
  };
}

export { useMessages };