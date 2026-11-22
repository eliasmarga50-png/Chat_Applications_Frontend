import { createInitialChatState } from "../context/chat-context";

export const initialChatState = createInitialChatState();

function uniqueById(items) {
  const seen = new Set();

  return items.filter((item) => {
    const id = String(item.id || item._id);

    if (!id || seen.has(id)) return false;

    seen.add(id);
    return true;
  });
}

function sortMessages(messages) {
  return uniqueById(messages).sort((a, b) => {
    const timeDifference =
      new Date(a.createdAt) - new Date(b.createdAt);

    if (timeDifference !== 0) return timeDifference;

    return String(a.id).localeCompare(String(b.id));
  });
}

function addMessageToRoom(state, roomSlug, message) {
  if (!roomSlug || !message) return state;

  const currentMessages = state.messagesByRoom[roomSlug] || [];

  return {
    ...state,
    messagesByRoom: {
      ...state.messagesByRoom,
      [roomSlug]: sortMessages([
        ...currentMessages,
        message,
      ]),
    },
  };
}

export function chatReducer(state, action) {
  switch (action.type) {
    case "SET_ROOMS":
      return {
        ...state,
        rooms: action.payload || [],
      };

    case "SET_ACTIVE_ROOM":
      return {
        ...state,
        activeRoomSlug: action.payload || null,
        typingUsersByRoom: {
          ...state.typingUsersByRoom,
          [action.payload]: [],
        },
      };

    case "SET_ROOM_MESSAGES":
      return {
        ...state,
        messagesByRoom: {
          ...state.messagesByRoom,
          [action.payload.roomSlug]: sortMessages(
            action.payload.messages || []
          ),
        },
      };

    case "ADD_MESSAGE":
      return addMessageToRoom(
        state,
        action.payload.roomSlug,
        action.payload.message
      );

    case "ADD_MESSAGES":
      return {
        ...state,
        messagesByRoom: {
          ...state.messagesByRoom,
          [action.payload.roomSlug]: sortMessages([
            ...(state.messagesByRoom[action.payload.roomSlug] || []),
            ...(action.payload.messages || []),
          ]),
        },
      };

    case "SET_TYPING_USERS":
      return {
        ...state,
        typingUsersByRoom: {
          ...state.typingUsersByRoom,
          [action.payload.roomSlug]: action.payload.userIds || [],
        },
      };

    case "USER_TYPING": {
      const { roomSlug, userId, isTyping } = action.payload;
      const currentUsers =
        state.typingUsersByRoom[roomSlug] || [];

      const nextUsers = isTyping
        ? currentUsers.includes(userId)
          ? currentUsers
          : [...currentUsers, userId]
        : currentUsers.filter((id) => id !== userId);

      return {
        ...state,
        typingUsersByRoom: {
          ...state.typingUsersByRoom,
          [roomSlug]: nextUsers,
        },
      };
    }

    case "SET_ONLINE_USERS":
      return {
        ...state,
        onlineUsers: action.payload || {},
      };

    case "USER_ONLINE":
      return {
        ...state,
        onlineUsers: {
          ...state.onlineUsers,
          [action.payload.userId]: action.payload.user || {
            id: action.payload.userId,
          },
        },
      };

    case "USER_OFFLINE": {
      const nextUsers = { ...state.onlineUsers };
      delete nextUsers[action.payload.userId];

      return {
        ...state,
        onlineUsers: nextUsers,
      };
    }

    case "SET_ONLINE_USER_COUNT":
      return {
        ...state,
        onlineUserCount: Number(action.payload) || 0,
      };

    case "ROOM_ACTIVITY":
      return {
        ...state,
        roomActivity: {
          ...state.roomActivity,
          [action.payload.roomSlug]: action.payload.activity,
        },
      };

    case "CLEAR_ROOM_ACTIVITY":
      return {
        ...state,
        roomActivity: {
          ...state.roomActivity,
          [action.payload]: null,
        },
      };

    case "SET_LOADING_ROOMS":
      return {
        ...state,
        loadingRooms: Boolean(action.payload),
      };

    case "SET_LOADING_MESSAGES":
      return {
        ...state,
        loadingMessages: Boolean(action.payload),
      };

    case "SET_ERROR":
      return {
        ...state,
        error: action.payload || null,
      };

    case "RESET_CHAT_STATE":
      return createInitialChatState();

    default:
      return state;
  }
}