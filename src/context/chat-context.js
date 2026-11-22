import { createContext } from "react";

export function createInitialChatState() {
  return {
    rooms: [],
    activeRoomSlug: null,

    messagesByRoom: {},
    typingUsersByRoom: {},

    // Users we have observed through realtime presence events.
    onlineUsers: {},

    // The authoritative total provided by the backend.
    onlineUserCount: 0,

    roomActivity: {},

    loadingRooms: false,
    loadingMessages: false,

    error: null,
  };
}

export const ChatContext = createContext(null);