import {
  useEffect,
  useReducer,
  useRef,
} from "react";

import { ChatContext } from "./chat-context";
import {
  chatReducer,
  initialChatState,
} from "../reducers/chatReducer";

import { useSocket } from "../hooks/useSocket";
import { useAuth } from "./useAuth";

export function ChatProvider({ children }) {
  const [state, dispatch] = useReducer(
    chatReducer,
    initialChatState
  );

  const { socket } = useSocket();
  const { token } = useAuth();

  const previousTokenRef = useRef(token);

  // Clear cached chat data when the authenticated session changes.
  useEffect(() => {
    if (previousTokenRef.current === token) return;

    previousTokenRef.current = token;

    queueMicrotask(() => {
      dispatch({ type: "RESET_CHAT_STATE" });
    });
  }, [token]);

  // Global presence and room activity listeners.
  useEffect(() => {
    if (!socket) return undefined;

    function onOnline({
      userId,
      onlineUsers,
    } = {}) {
      if (userId) {
        dispatch({
          type: "USER_ONLINE",
          payload: { userId },
        });
      }

      if (Number.isFinite(Number(onlineUsers))) {
        dispatch({
          type: "SET_ONLINE_USER_COUNT",
          payload: onlineUsers,
        });
      }
    }

    function onOffline({
      userId,
      onlineUsers,
    } = {}) {
      if (userId) {
        dispatch({
          type: "USER_OFFLINE",
          payload: { userId },
        });
      }

      if (Number.isFinite(Number(onlineUsers))) {
        dispatch({
          type: "SET_ONLINE_USER_COUNT",
          payload: onlineUsers,
        });
      }
    }

    function onPresenceCount({
      onlineUsers,
    } = {}) {
      if (Number.isFinite(Number(onlineUsers))) {
        dispatch({
          type: "SET_ONLINE_USER_COUNT",
          payload: onlineUsers,
        });
      }
    }

    function onRoomJoined({ room, user } = {}) {
      if (!room || !user) return;

      dispatch({
        type: "ROOM_ACTIVITY",
        payload: {
          roomSlug: room,
          activity: {
            type: "joined",
            user,
            at: Date.now(),
          },
        },
      });
    }

    function onRoomLeft({ room, user } = {}) {
      if (!room || !user) return;

      dispatch({
        type: "ROOM_ACTIVITY",
        payload: {
          roomSlug: room,
          activity: {
            type: "left",
            user,
            at: Date.now(),
          },
        },
      });
    }

    socket.on("presence:user_online", onOnline);
    socket.on("presence:user_offline", onOffline);
    socket.on("presence:count", onPresenceCount);

    socket.on("room:user_joined", onRoomJoined);
    socket.on("room:user_left", onRoomLeft);

    return () => {
      socket.off("presence:user_online", onOnline);
      socket.off("presence:user_offline", onOffline);
      socket.off("presence:count", onPresenceCount);

      socket.off("room:user_joined", onRoomJoined);
      socket.off("room:user_left", onRoomLeft);
    };
  }, [socket]);

  return (
    <ChatContext.Provider
      value={{ state, dispatch }}
    >
      {children}
    </ChatContext.Provider>
  );
}