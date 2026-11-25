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

export const initialChatState = createInitialChatState();

function messageId(message) {
  return String(message?.id || message?._id || "");
}

function mergeMessages(messages) {
  const byId = new Map();

  for (const message of messages) {
    const id = messageId(message);

    if (id) {
      byId.set(id, { ...message, id });
    }
  }

  return [...byId.values()].sort((a, b) => {
    const difference =
      new Date(a.createdAt) - new Date(b.createdAt);

    return difference || messageId(a).localeCompare(messageId(b));
  });
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
      };

    case "SET_ROOM_MESSAGES": {
      const { roomSlug, messages } = action.payload;

      return {
        ...state,
        messagesByRoom: {
          ...state.messagesByRoom,
          [roomSlug]: mergeMessages(messages || []),
        },
      };
    }

    case "ADD_MESSAGE": {
      const { roomSlug, message } = action.payload;

      if (!roomSlug || !message) return state;

      return {
        ...state,
        messagesByRoom: {
          ...state.messagesByRoom,
          [roomSlug]: mergeMessages([
            ...(state.messagesByRoom[roomSlug] || []),
            message,
          ]),
        },
      };
    }

    case "ADD_MESSAGES": {
      const { roomSlug, messages } = action.payload;

      return {
        ...state,
        messagesByRoom: {
          ...state.messagesByRoom,
          [roomSlug]: mergeMessages([
            ...(state.messagesByRoom[roomSlug] || []),
            ...(messages || []),
          ]),
        },
      };
    }

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

      if (!roomSlug || !userId) return state;

      const current = state.typingUsersByRoom[roomSlug] || [];

      const next = isTyping
        ? current.includes(userId)
          ? current
          : [...current, userId]
        : current.filter((id) => id !== userId);

      return {
        ...state,
        typingUsersByRoom: {
          ...state.typingUsersByRoom,
          [roomSlug]: next,
        },
      };
    }

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
      const onlineUsers = { ...state.onlineUsers };

      delete onlineUsers[action.payload.userId];

      return {
        ...state,
        onlineUsers,
      };
    }

    case "SET_ONLINE_USER_COUNT":
      return {
        ...state,
        onlineUserCount: Math.max(
          0,
          Number(action.payload) || 0
        ),
      };

    case "ROOM_ACTIVITY":
      return {
        ...state,
        roomActivity: {
          ...state.roomActivity,
          [action.payload.roomSlug]: action.payload.activity,
        },
      };

    case "CLEAR_ROOM_ACTIVITY": {
      const roomActivity = { ...state.roomActivity };

      delete roomActivity[action.payload];

      return {
        ...state,
        roomActivity,
      };
    }

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