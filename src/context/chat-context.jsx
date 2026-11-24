import { createContext } from "react";

export const ChatContext = createContext(null);

export function createInitialChatState() {
  return {
    rooms: [],
    activeRoom: null,
    messagesByRoom: {},
    typingUsersByRoom: {},
    onlineUsers: [],
    onlineUserCount: 0,
    roomActivity: {},
    loadingRooms: false,
    loadingMessages: false,
    error: null,
  };
}