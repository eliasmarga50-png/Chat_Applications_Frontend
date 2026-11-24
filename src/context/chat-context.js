import { createContext } from "react";

export function createInitialChatState() {
  return {
    rooms: [],
    activeRoomSlug: null,
    messagesByRoom: {},
    typingUsersByRoom: {},
    onlineUsers: {},
    onlineUserCount: 0,
    roomActivity: {},
    loadingRooms: false,
    loadingMessages: false,
    error: null,
  };
}

export const ChatContext = createContext(null);