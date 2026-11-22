
import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import { useSocket } from "./useSocket";

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

  const currentSlugRef = useRef(slug);
  const onMessageRef = useRef(onMessage);

  const joinedSlugRef = useRef(null);
  const joinedSocketIdRef = useRef(null);
  const pendingJoinRef = useRef(null);

  const transitionIdRef = useRef(0);
  const localTypingRef = useRef(false);

  const [roomJoinError, setRoomJoinError] =
    useState(null);

  const [joinedRoomSlug, setJoinedRoomSlug] =
    useState(null);

  const [typingUserIds, setTypingUserIds] =
    useState([]);


  // Keep the latest room slug available to socket callbacks.
  useEffect(() => {
    currentSlugRef.current = slug;
  }, [slug]);


  // Keep the latest message callback available without
  // reconnecting the socket every time the callback changes.
  useEffect(() => {
    onMessageRef.current = onMessage;
  }, [onMessage]);


  const clearTypingUsers = useCallback(() => {
    setTypingUserIds([]);
  }, []);


  // Safely transition from one socket room to another.
  const transitionToRoom = useCallback(
    async (targetSocket, targetSlug) => {
      if (!targetSocket?.connected || !targetSlug) {
        return;
      }

      // Already joined this room on this socket.
      if (
        joinedSlugRef.current === targetSlug &&
        joinedSocketIdRef.current === targetSocket.id
      ) {
        return;
      }

      // Prevent duplicate pending joins.
      if (
        pendingJoinRef.current?.slug === targetSlug &&
        pendingJoinRef.current?.socketId === targetSocket.id
      ) {
        return;
      }

      const transitionId =
        ++transitionIdRef.current;

      pendingJoinRef.current = {
        slug: targetSlug,
        socketId: targetSocket.id,
      };

      setRoomJoinError(null);
      setJoinedRoomSlug(null);

      const previousSlug = joinedSlugRef.current;
      const previousSocketId =
        joinedSocketIdRef.current;


      // Leave the previous room first.
      if (
        previousSlug &&
        previousSlug !== targetSlug &&
        previousSocketId === targetSocket.id
      ) {
        localTypingRef.current = false;

        emitTyping(
          targetSocket,
          "typing:stop",
          previousSlug
        ).catch(() => {});

        try {
          await leaveRoom(
            targetSocket,
            previousSlug
          );
        } catch {
          // Continue with the new room transition.
        }
      }


      // Ignore stale room transitions.
      if (
        transitionId !== transitionIdRef.current ||
        !targetSocket.connected ||
        currentSlugRef.current !== targetSlug
      ) {
        if (
          pendingJoinRef.current?.slug === targetSlug
        ) {
          pendingJoinRef.current = null;
        }

        return;
      }

      joinedSlugRef.current = null;
      joinedSocketIdRef.current = null;


      try {
        await joinRoom(
          targetSocket,
          targetSlug
        );


        // The user may have navigated while the join
        // request was waiting for its acknowledgement.
        if (
          transitionId !== transitionIdRef.current ||
          !targetSocket.connected ||
          currentSlugRef.current !== targetSlug
        ) {
          try {
            if (targetSocket.connected) {
              await leaveRoom(
                targetSocket,
                targetSlug
              );
            }
          } catch {
            // Connection may have disappeared already.
          }

          return;
        }


        joinedSlugRef.current = targetSlug;
        joinedSocketIdRef.current =
          targetSocket.id;

        setJoinedRoomSlug(targetSlug);
      } catch (error) {
        if (
          transitionId === transitionIdRef.current
        ) {
          joinedSlugRef.current = null;
          joinedSocketIdRef.current = null;

          setJoinedRoomSlug(null);
          setRoomJoinError(error);
        }
      } finally {
        if (
          pendingJoinRef.current?.slug === targetSlug &&
          pendingJoinRef.current?.socketId === targetSocket.id
        ) {
          pendingJoinRef.current = null;
        }
      }
    },
    []
  );


  // Subscribe to chat events using the shared socket.
  useEffect(() => {
    if (!socket) {
      return undefined;
    }


    function handleConnect() {
      // A reconnect creates a new socket ID. The old room
      // acknowledgement cannot be considered valid anymore.
      joinedSlugRef.current = null;
      joinedSocketIdRef.current = null;
      pendingJoinRef.current = null;

      setJoinedRoomSlug(null);
      clearTypingUsers();

      transitionToRoom(
        socket,
        currentSlugRef.current
      );
    }


    function handleDisconnect() {
      // Cancel any room transition in progress.
      transitionIdRef.current += 1;

      joinedSlugRef.current = null;
      joinedSocketIdRef.current = null;
      pendingJoinRef.current = null;

      setJoinedRoomSlug(null);

      localTypingRef.current = false;
      clearTypingUsers();
    }


    function handleMessage(message) {
      if (
        message?.room === currentSlugRef.current
      ) {
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


    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("message:new", handleMessage);
    socket.on("typing:update", handleTypingUpdate);


    // The Provider may have connected before this hook mounted.
    if (socket.connected) {
      handleConnect();
    }


    return () => {
      transitionIdRef.current += 1;

      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("message:new", handleMessage);
      socket.off("typing:update", handleTypingUpdate);

      localTypingRef.current = false;

      joinedSlugRef.current = null;
      joinedSocketIdRef.current = null;
      pendingJoinRef.current = null;
    };
  }, [
    socket,
    transitionToRoom,
    clearTypingUsers,
  ]);


  // Join the room selected through the URL.
  useEffect(() => {
    if (
      !socket?.connected ||
      !slug
    ) {
      return undefined;
    }

    // Defer the external socket operation so the effect
    // does not synchronously trigger state updates.
    const transitionTimer = setTimeout(() => {
      transitionToRoom(socket, slug);
    }, 0);

    return () => clearTimeout(transitionTimer);
  }, [
    socket,
    slug,
    transitionToRoom,
  ]);


  // Retry joining the current room.
  const retryRoomJoin = useCallback(() => {
    const targetSlug = currentSlugRef.current;

    if (
      !socket?.connected ||
      !targetSlug
    ) {
      return;
    }

    joinedSlugRef.current = null;
    joinedSocketIdRef.current = null;
    pendingJoinRef.current = null;

    setRoomJoinError(null);
    setJoinedRoomSlug(null);

    transitionToRoom(
      socket,
      targetSlug
    );
  }, [
    socket,
    transitionToRoom,
  ]);


  // Send typing:start or typing:stop to the backend.
  const handleTypingChange = useCallback(
    (isTyping) => {
      const targetSlug = currentSlugRef.current;

      if (
        !socket?.connected ||
        !targetSlug ||
        joinedSlugRef.current !== targetSlug ||
        joinedSocketIdRef.current !== socket.id ||
        localTypingRef.current === isTyping
      ) {
        return;
      }

      localTypingRef.current = isTyping;

      const eventName = isTyping
        ? "typing:start"
        : "typing:stop";

      emitTyping(
        socket,
        eventName,
        targetSlug
      ).catch(() => {});
    },
    [socket]
  );


  // Send a message through Socket.IO and await acknowledgement.
  const handleSendMessage = useCallback(
    async (content) => {
      const targetSlug = currentSlugRef.current;

      if (!socket?.connected) {
        throw new Error(
          "You are disconnected. Wait for reconnection before sending."
        );
      }

      if (!targetSlug) {
        throw new Error(
          "Select a chat room before sending a message."
        );
      }

      if (
        joinedSlugRef.current !== targetSlug ||
        joinedSocketIdRef.current !== socket.id
      ) {
        throw new Error(
          "The room connection is not ready yet. Please wait and try again."
        );
      }

      const response = await emitMessage(
        socket,
        targetSlug,
        content
      );

      handleTypingChange(false);

      return response;
    },
    [
      socket,
      handleTypingChange,
    ]
  );


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
