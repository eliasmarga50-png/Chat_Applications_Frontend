import { useCallback, useEffect, useRef, useState } from "react";
import {
  createSocket,
  joinRoom,
  leaveRoom,
  sendMessage as emitMessage,
  setTyping as emitTyping,
} from "../services/socketService";

const AUTH_ERROR_CODES = ["AUTH_REQUIRED", "INVALID_TOKEN", "TOKEN_EXPIRED"];

function isAuthError(code) {
  return AUTH_ERROR_CODES.includes(code);
}

function useChatSocket(token, slug, onMessage) {
  const socketRef = useRef(null);

  const currentSlugRef = useRef(slug);
  const onMessageRef = useRef(onMessage);

  const joinedSlugRef = useRef(null);
  const joinedSocketIdRef = useRef(null);
  const pendingJoinRef = useRef(null);

  const transitionIdRef = useRef(0);
  const localTypingRef = useRef(false);

  const [connectionStatus, setConnectionStatus] = useState(
    token ? "connecting" : "disconnected"
  );

  const [connectionError, setConnectionError] = useState(null);
  const [roomJoinError, setRoomJoinError] = useState(null);
  const [joinedRoomSlug, setJoinedRoomSlug] = useState(null);
  const [typingUserIds, setTypingUserIds] = useState([]);

  // Synchronize refs with the latest React values.
  // Ref updates happen inside effects, not during render.
  useEffect(() => {
    currentSlugRef.current = slug;
  }, [slug]);

  useEffect(() => {
    onMessageRef.current = onMessage;
  }, [onMessage]);

  const clearTypingUsers = useCallback(() => {
    setTypingUserIds([]);
  }, []);

  const transitionToRoom = useCallback(async (socket, targetSlug) => {
    if (!socket?.connected || !targetSlug) {
      return;
    }

    // Already joined this room using this socket connection.
    if (
      joinedSlugRef.current === targetSlug &&
      joinedSocketIdRef.current === socket.id
    ) {
      return;
    }

    // Prevent duplicate join requests for the same room/socket.
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

    // Leave the previously acknowledged room before joining another.
    if (
      previousSlug &&
      previousSlug !== targetSlug &&
      previousSocketId === socket.id
    ) {
      localTypingRef.current = false;

      emitTyping(socket, "typing:stop", previousSlug).catch(() => {});

      try {
        await leaveRoom(socket, previousSlug);
      } catch {
        // Continue with the new join attempt.
      }
    }

    // Ignore this transition if a newer navigation happened.
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

      // Check whether the room is still the active route.
      if (
        transitionId !== transitionIdRef.current ||
        !socket.connected ||
        currentSlugRef.current !== targetSlug
      ) {
        // This join response is stale. Leave the room if possible.
        try {
          if (socket.connected) {
            await leaveRoom(socket, targetSlug);
          }
        } catch {
          // The connection may have disconnected already.
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
  }, []);

  // Establish and manage the authenticated Socket.IO connection.
  useEffect(() => {
    // No token means there is no authenticated socket to create.
    // The visible status is derived below, so no setState is needed here.
    if (!token) {
      socketRef.current = null;
      joinedSlugRef.current = null;
      joinedSocketIdRef.current = null;
      pendingJoinRef.current = null;

      return undefined;
    }

    const socket = createSocket(token);

    socketRef.current = socket;

    joinedSlugRef.current = null;
    joinedSocketIdRef.current = null;
    pendingJoinRef.current = null;

    function handleConnect() {
      setConnectionStatus("connected");
      setConnectionError(null);

      joinedSlugRef.current = null;
      joinedSocketIdRef.current = null;
      pendingJoinRef.current = null;

      transitionToRoom(socket, currentSlugRef.current);
    }

    function handleDisconnect(reason) {
      // Cancel any join/leave operation currently in progress.
      transitionIdRef.current += 1;

      setConnectionStatus("disconnected");

      if (reason !== "io client disconnect") {
        setConnectionError(reason || "Connection lost. Reconnecting...");
      }

      joinedSlugRef.current = null;
      joinedSocketIdRef.current = null;
      pendingJoinRef.current = null;

      setJoinedRoomSlug(null);

      localTypingRef.current = false;
      clearTypingUsers();
    }

    function handleConnectError(error) {
      setConnectionStatus("disconnected");

      setConnectionError(
        error?.message || "Could not connect to the chat server."
      );

      if (isAuthError(error?.data?.code)) {
        window.dispatchEvent(new Event("auth:unauthorized"));
      }
    }

    function handleMessage(message) {
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

        return previous.filter((id) => id !== payload.userId);
      });
    }

    function handleAuthExpired() {
      window.dispatchEvent(new Event("auth:unauthorized"));
      socket.disconnect();
    }

    function handleReconnectAttempt() {
      setConnectionStatus("connecting");
      setConnectionError("Connection lost. Reconnecting...");
    }

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("connect_error", handleConnectError);
    socket.on("message:new", handleMessage);
    socket.on("typing:update", handleTypingUpdate);
    socket.on("auth:expired", handleAuthExpired);

    socket.io.on("reconnect_attempt", handleReconnectAttempt);

    socket.connect();

    return () => {
      transitionIdRef.current += 1;

      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("connect_error", handleConnectError);
      socket.off("message:new", handleMessage);
      socket.off("typing:update", handleTypingUpdate);
      socket.off("auth:expired", handleAuthExpired);

      socket.io.off("reconnect_attempt", handleReconnectAttempt);

      localTypingRef.current = false;
      joinedSlugRef.current = null;
      joinedSocketIdRef.current = null;
      pendingJoinRef.current = null;

      socket.disconnect();

      if (socketRef.current === socket) {
        socketRef.current = null;
      }
    };
  }, [token, transitionToRoom, clearTypingUsers]);

  // Join the selected room whenever the route slug changes.
  useEffect(() => {
    const socket = socketRef.current;

    if (!socket?.connected || !slug) {
      return;
    }

    transitionToRoom(socket, slug);
  }, [slug, transitionToRoom]);

  const retryRoomJoin = useCallback(() => {
    const socket = socketRef.current;
    const targetSlug = currentSlugRef.current;

    if (!socket?.connected || !targetSlug) {
      return;
    }

    joinedSlugRef.current = null;
    joinedSocketIdRef.current = null;
    pendingJoinRef.current = null;

    setRoomJoinError(null);
    setJoinedRoomSlug(null);

    transitionToRoom(socket, targetSlug);
  }, [transitionToRoom]);

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

    const eventName = isTyping ? "typing:start" : "typing:stop";

    emitTyping(socket, eventName, roomSlug).catch(() => {});
  }, []);

  const handleSendMessage = useCallback(async (content) => {
    const socket = socketRef.current;
    const roomSlug = currentSlugRef.current;

    if (!socket?.connected) {
      throw new Error(
        "You are disconnected. Wait for reconnection before sending."
      );
    }

    if (!roomSlug) {
      throw new Error("Select a chat room before sending a message.");
    }

    if (
      joinedSlugRef.current !== roomSlug ||
      joinedSocketIdRef.current !== socket.id
    ) {
      throw new Error(
        "The room connection is not ready yet. Please wait and try again."
      );
    }

    const response = await emitMessage(socket, roomSlug, content);

    handleTypingChange(false);

    return response;
  }, [handleTypingChange]);

  // Derive the disconnected status when there is no authenticated token.
  const visibleConnectionStatus = token
    ? connectionStatus
    : "disconnected";

  const visibleJoinedRoom = token
    ? joinedRoomSlug
    : null;

  return {
    connectionStatus: visibleConnectionStatus,
    connectionError,
    roomJoinError,
    joinedRoomSlug: visibleJoinedRoom,
    typingUserIds,
    sendMessage: handleSendMessage,
    onTypingChange: handleTypingChange,
    retryRoomJoin,
  };
}

export { useChatSocket };