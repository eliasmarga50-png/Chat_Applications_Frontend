
import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import {
  createSocket,
  joinRoom,
  leaveRoom,
  sendMessage as emitMessage,
  setTyping as emitTyping,
} from "../services/socketService";


function isAuthError(code) {
  return [
    "AUTH_REQUIRED",
    "INVALID_TOKEN",
    "TOKEN_EXPIRED",
  ].includes(code);
}


function useChatSocket(token, slug, onMessage) {
  const socketRef = useRef(null);

  const currentSlugRef = useRef(slug);
  const joinedSlugRef = useRef(null);
  const joinedSocketIdRef = useRef(null);

  const localTypingRef = useRef(false);
  const onMessageRef = useRef(onMessage);


  const [connectionStatus, setConnectionStatus] =
    useState(token ? "connecting" : "disconnected");

  const [connectionError, setConnectionError] =
    useState(null);

  const [roomJoinError, setRoomJoinError] =
    useState(null);

  const [joinedRoomSlug, setJoinedRoomSlug] =
    useState(null);

  const [typingUserIds, setTypingUserIds] =
    useState([]);


  // Keep the latest room and callback available to socket listeners.
  useEffect(() => {
    currentSlugRef.current = slug;
    onMessageRef.current = onMessage;
  }, [slug, onMessage]);


  const clearTypingUsers = useCallback(() => {
    setTypingUserIds([]);
  }, []);


  // Join the room currently selected in React Router.
  const joinCurrentRoom = useCallback(async (socket) => {
    const roomSlug = currentSlugRef.current;

    if (!socket?.connected || !roomSlug) {
      return;
    }

    // Avoid duplicate joins for the same socket and room.
    if (
      joinedSlugRef.current === roomSlug &&
      joinedSocketIdRef.current === socket.id
    ) {
      return;
    }

    // Mark the attempt before awaiting its acknowledgement.
    joinedSlugRef.current = roomSlug;
    joinedSocketIdRef.current = socket.id;

    setRoomJoinError(null);
    setJoinedRoomSlug(null);

    try {
      await joinRoom(socket, roomSlug);

      if (currentSlugRef.current === roomSlug) {
        setJoinedRoomSlug(roomSlug);
      }
    } catch (error) {
      if (
        joinedSlugRef.current === roomSlug &&
        joinedSocketIdRef.current === socket.id
      ) {
        joinedSlugRef.current = null;
        joinedSocketIdRef.current = null;

        setRoomJoinError(error);
        setJoinedRoomSlug(null);
      }
    }
  }, []);


  // Create and manage the authenticated socket connection.
  useEffect(() => {
    if (!token) {
      socketRef.current = null;
      return undefined;
    }

    const socket = createSocket(token);

    socketRef.current = socket;

    joinedSlugRef.current = null;
    joinedSocketIdRef.current = null;


    function handleConnect() {
      setConnectionStatus("connected");
      setConnectionError(null);

      // A reconnect creates a new server-side socket session.
      // It must join the current room again.
      joinedSlugRef.current = null;
      joinedSocketIdRef.current = null;

      joinCurrentRoom(socket);
    }


    function handleDisconnect(reason) {
      setConnectionStatus("disconnected");

      if (reason !== "io client disconnect") {
        setConnectionError(
          reason || "Connection lost. Reconnecting..."
        );
      }

      joinedSlugRef.current = null;
      joinedSocketIdRef.current = null;

      setJoinedRoomSlug(null);
      localTypingRef.current = false;

      clearTypingUsers();
    }


    function handleConnectError(error) {
      setConnectionStatus("disconnected");

      setConnectionError(
        error.message ||
          "Could not connect to the chat server."
      );

      // The backend provides authentication codes through err.data.
      if (isAuthError(error.data?.code)) {
        window.dispatchEvent(
          new Event("auth:unauthorized")
        );
      }
    }


    function handleMessage(message) {
      // Ignore events belonging to another currently selected room.
      if (message?.room === currentSlugRef.current) {
        onMessageRef.current?.(message);
      }
    }


    function handleTypingUpdate(payload) {
      if (
        payload?.room !== currentSlugRef.current ||
        !payload.userId
      ) {
        return;
      }

      setTypingUserIds((previous) => {
        if (payload.isTyping) {
          return previous.includes(payload.userId)
            ? previous
            : [...previous, payload.userId];
        }

        return previous.filter(
          (id) => id !== payload.userId
        );
      });
    }


    function handleAuthExpired() {
      // AuthContext already listens for this event.
      window.dispatchEvent(
        new Event("auth:unauthorized")
      );

      socket.disconnect();
    }


    function handleReconnectAttempt() {
      setConnectionStatus("connecting");

      setConnectionError(
        "Connection lost. Reconnecting..."
      );
    }


    // Register event listeners.
    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("connect_error", handleConnectError);

    socket.on("message:new", handleMessage);
    socket.on("typing:update", handleTypingUpdate);
    socket.on("auth:expired", handleAuthExpired);

    socket.io.on(
      "reconnect_attempt",
      handleReconnectAttempt
    );


    //  intentionally disabled autoConnect in socketService.
    socket.connect();


    // Cleanup: remove listeners and close this connection.
    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("connect_error", handleConnectError);

      socket.off("message:new", handleMessage);
      socket.off("typing:update", handleTypingUpdate);
      socket.off("auth:expired", handleAuthExpired);

      socket.io.off(
        "reconnect_attempt",
        handleReconnectAttempt
      );

      localTypingRef.current = false;
      joinedSlugRef.current = null;
      joinedSocketIdRef.current = null;

      setJoinedRoomSlug(null);

      socket.disconnect();

      if (socketRef.current === socket) {
        socketRef.current = null;
      }
    };
  }, [token, joinCurrentRoom, clearTypingUsers]);


  // Handle room navigation: leave the old room, join the new room.
  useEffect(() => {
    const socket = socketRef.current;

    if (!socket?.connected || !slug) {
      return undefined;
    }

    const previousSlug = joinedSlugRef.current;

    if (previousSlug && previousSlug !== slug) {
      joinedSlugRef.current = null;
      joinedSocketIdRef.current = null;

      setJoinedRoomSlug(null);
      localTypingRef.current = false;

      // Stop typing in the previous room before leaving it.
      emitTyping(
        socket,
        "typing:stop",
        previousSlug
      ).catch(() => {});

      leaveRoom(socket, previousSlug).catch(() => {});

      clearTypingUsers();
    }

    joinCurrentRoom(socket);

    return undefined;
  }, [slug, joinCurrentRoom, clearTypingUsers]);


  // Retry a room join if the backend rejected it.
  const retryRoomJoin = useCallback(() => {
    const socket = socketRef.current;

    if (!socket?.connected || !currentSlugRef.current) {
      return;
    }

    joinedSlugRef.current = null;
    joinedSocketIdRef.current = null;

    setRoomJoinError(null);
    setJoinedRoomSlug(null);

    joinCurrentRoom(socket);
  }, [joinCurrentRoom]);


  // Notify the backend when the local user starts or stops typing.
  const handleTypingChange = useCallback((isTyping) => {
    const socket = socketRef.current;
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

    const event = isTyping
      ? "typing:start"
      : "typing:stop";

    emitTyping(socket, event, roomSlug).catch(() => {
      // Typing is best-effort. It should not block messaging.
    });
  }, []);


  // Send a message and wait for the backend acknowledgement.
  const handleSendMessage = useCallback(async (content) => {
    const socket = socketRef.current;
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

    handleTypingChange(false);

    return response;
  }, [handleTypingChange]);


  return {
    connectionStatus,
    connectionError,
    roomJoinError,
    joinedRoomSlug,
    typingUserIds,

    sendMessage: handleSendMessage,
    onTypingChange: handleTypingChange,
    retryRoomJoin,
  };
}


export { useChatSocket };
