import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import { useSocket } from "./useSocket";
import { useChat } from "./useChat";

import {
  joinRoom,
  leaveRoom,
  sendMessage as emitMessage,
  setTyping as emitTyping,
} from "../services/socketService";

function useChatSocket(_token, slug, onMessage) {
  const {
    socket,
    connectionStatus,
    connectionError,
  } = useSocket();

  const { dispatch } = useChat();

  const currentSlugRef = useRef(slug);
  const onMessageRef = useRef(onMessage);

  const joinedSlugRef = useRef(null);
  const joinedSocketIdRef = useRef(null);
  const pendingJoinRef = useRef(null);

  const transitionIdRef = useRef(0);
  const localTypingRef = useRef(false);

  const [roomJoinError, setRoomJoinError] = useState(null);
  const [joinedRoomSlug, setJoinedRoomSlug] = useState(null);

  useEffect(() => {
    currentSlugRef.current = slug;
  }, [slug]);

  useEffect(() => {
    onMessageRef.current = onMessage;
  }, [onMessage]);

  const transitionToRoom = useCallback(
    async (targetSlug) => {
      if (!socket?.connected || !targetSlug) return;

      if (
        joinedSlugRef.current === targetSlug &&
        joinedSocketIdRef.current === socket.id
      ) {
        return;
      }

      if (
        pendingJoinRef.current?.slug === targetSlug &&
        pendingJoinRef.current?.socketId === socket.id
      ) {
        return;
      }

      const transitionId = ++transitionIdRef.current;

      pendingJoinRef.current = {
        slug: targetSlug,
        socketId: socket.id,
      };

      setRoomJoinError(null);
      setJoinedRoomSlug(null);

      const previousSlug = joinedSlugRef.current;
      const previousSocketId = joinedSocketIdRef.current;

      if (
        previousSlug &&
        previousSlug !== targetSlug &&
        previousSocketId === socket.id
      ) {
        localTypingRef.current = false;

        emitTyping(
          socket,
          "typing:stop",
          previousSlug
        ).catch(() => {});

        try {
          await leaveRoom(socket, previousSlug);
        } catch {
          // Continue with the target room.
        }
      }

      if (
        transitionId !== transitionIdRef.current ||
        !socket.connected ||
        currentSlugRef.current !== targetSlug
      ) {
        if (pendingJoinRef.current?.slug === targetSlug) {
          pendingJoinRef.current = null;
        }

        return;
      }

      joinedSlugRef.current = null;
      joinedSocketIdRef.current = null;

      try {
        await joinRoom(socket, targetSlug);

        if (
          transitionId !== transitionIdRef.current ||
          !socket.connected ||
          currentSlugRef.current !== targetSlug
        ) {
          if (socket.connected) {
            try {
              await leaveRoom(socket, targetSlug);
            } catch {
              // The connection may have disconnected.
            }
          }

          return;
        }

        joinedSlugRef.current = targetSlug;
        joinedSocketIdRef.current = socket.id;

        setJoinedRoomSlug(targetSlug);
      } catch (error) {
        if (transitionId === transitionIdRef.current) {
          joinedSlugRef.current = null;
          joinedSocketIdRef.current = null;

          setJoinedRoomSlug(null);
          setRoomJoinError(error);
        }
      } finally {
        if (
          pendingJoinRef.current?.slug === targetSlug &&
          pendingJoinRef.current?.socketId === socket.id
        ) {
          pendingJoinRef.current = null;
        }
      }
    },
    [socket]
  );

  // Listen to the shared socket.
  useEffect(() => {
    if (!socket) return undefined;

    function onConnect() {
      joinedSlugRef.current = null;
      joinedSocketIdRef.current = null;
      pendingJoinRef.current = null;

      transitionToRoom(currentSlugRef.current);
    }

    function onDisconnect() {
      transitionIdRef.current += 1;

      joinedSlugRef.current = null;
      joinedSocketIdRef.current = null;
      pendingJoinRef.current = null;

      localTypingRef.current = false;

      setJoinedRoomSlug(null);

      dispatch({
        type: "SET_TYPING_USERS",
        payload: {
          roomSlug: currentSlugRef.current,
          userIds: [],
        },
      });
    }

    function onMessage(message) {
      if (message?.room === currentSlugRef.current) {
        onMessageRef.current?.(message);
      }
    }

    function onTyping(payload) {
      if (
        payload?.room !== currentSlugRef.current ||
        !payload.userId
      ) {
        return;
      }

      dispatch({
        type: "USER_TYPING",
        payload: {
          roomSlug: payload.room,
          userId: payload.userId,
          isTyping: Boolean(payload.isTyping),
        },
      });
    }

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("message:new", onMessage);
    socket.on("typing:update", onTyping);

    if (socket.connected) {
      transitionToRoom(currentSlugRef.current);
    }

    return () => {
      transitionIdRef.current += 1;

      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("message:new", onMessage);
      socket.off("typing:update", onTyping);

      localTypingRef.current = false;

      joinedSlugRef.current = null;
      joinedSocketIdRef.current = null;
      pendingJoinRef.current = null;
    };
  }, [socket, transitionToRoom, dispatch]);

  // Change rooms when the URL slug changes.
  useEffect(() => {
    if (!socket?.connected || !slug) return undefined;

    const timer = window.setTimeout(
      () => transitionToRoom(slug),
      0
    );

    return () => window.clearTimeout(timer);
  }, [socket, slug, connectionStatus, transitionToRoom]);

  const retryRoomJoin = useCallback(() => {
    if (!socket?.connected || !currentSlugRef.current) {
      return;
    }

    joinedSlugRef.current = null;
    joinedSocketIdRef.current = null;
    pendingJoinRef.current = null;

    setRoomJoinError(null);
    setJoinedRoomSlug(null);

    transitionToRoom(currentSlugRef.current);
  }, [socket, transitionToRoom]);

  const onTypingChange = useCallback(
    (isTyping) => {
      const roomSlug = currentSlugRef.current;

      if (
        !socket?.connected ||
        !roomSlug ||
        joinedSlugRef.current !== roomSlug ||
        joinedSocketIdRef.current !== socket.id ||
        localTypingRef.current === isTyping
      ) {
        return;
      }

      localTypingRef.current = isTyping;

      emitTyping(
        socket,
        isTyping ? "typing:start" : "typing:stop",
        roomSlug
      ).catch(() => {});
    },
    [socket]
  );

  const sendMessage = useCallback(
    async (content) => {
      const roomSlug = currentSlugRef.current;

      if (!socket?.connected) {
        throw new Error(
          "You are disconnected. Wait for reconnection before sending."
        );
      }

      if (!roomSlug) {
        throw new Error(
          "Select a chat room before sending a message."
        );
      }

      if (
        joinedSlugRef.current !== roomSlug ||
        joinedSocketIdRef.current !== socket.id
      ) {
        throw new Error(
          "The room connection is not ready yet. Please wait and try again."
        );
      }

      const response = await emitMessage(
        socket,
        roomSlug,
        content
      );

      onTypingChange(false);

      return response;
    },
    [socket, onTypingChange]
  );

  return {
    connectionStatus,
    connectionError,
    roomJoinError,
    joinedRoomSlug,
    sendMessage,
    onTypingChange,
    retryRoomJoin,
  };
}

export { useChatSocket };