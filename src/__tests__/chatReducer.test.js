
import {
  describe,
  it,
  expect,
} from "vitest";

import {
  chatReducer,
  createInitialChatState,
} from "../reducers/chatReducer";

describe("Chat reducer", () => {
  it("creates the initial state", () => {
    const state = createInitialChatState();

    expect(state.rooms).toEqual([]);
    expect(state.messagesByRoom).toEqual({});
    expect(state.activeRoomSlug).toBeNull();
  });

  it("sets available rooms", () => {
    const state = chatReducer(
      createInitialChatState(),
      {
        type: "SET_ROOMS",
        payload: [
          { slug: "javascript" },
          { slug: "python" },
        ],
      }
    );

    expect(state.rooms).toHaveLength(2);
  });

  it("sets the active room", () => {
    const state = chatReducer(
      createInitialChatState(),
      {
        type: "SET_ACTIVE_ROOM",
        payload: "javascript",
      }
    );

    expect(state.activeRoomSlug).toBe("javascript");
  });

  it("adds and sorts messages by creation time", () => {
    const state = chatReducer(
      createInitialChatState(),
      {
        type: "SET_ROOM_MESSAGES",
        payload: {
          roomSlug: "javascript",
          messages: [
            {
              id: "2",
              content: "Second",
              createdAt: "2026-01-02T10:00:00Z",
            },
            {
              id: "1",
              content: "First",
              createdAt: "2026-01-01T10:00:00Z",
            },
          ],
        },
      }
    );

    expect(
      state.messagesByRoom.javascript.map(
        (message) => message.content
      )
    ).toEqual(["First", "Second"]);
  });

  it("prevents duplicate message IDs", () => {
    const state = chatReducer(
      createInitialChatState(),
      {
        type: "ADD_MESSAGES",
        payload: {
          roomSlug: "javascript",
          messages: [
            {
              id: "1",
              content: "Hello",
              createdAt: "2026-01-01T10:00:00Z",
            },
            {
              id: "1",
              content: "Hello again",
              createdAt: "2026-01-01T10:00:00Z",
            },
          ],
        },
      }
    );

    expect(
      state.messagesByRoom.javascript
    ).toHaveLength(1);
  });

  it("adds a typing user", () => {
    const state = chatReducer(
      createInitialChatState(),
      {
        type: "USER_TYPING",
        payload: {
          roomSlug: "javascript",
          userId: "user123",
          isTyping: true,
        },
      }
    );

    expect(
      state.typingUsersByRoom.javascript
    ).toContain("user123");
  });

  it("removes an offline user", () => {
    const initialState = {
      ...createInitialChatState(),
      onlineUsers: {
        user123: { id: "user123" },
      },
    };

    const state = chatReducer(
      initialState,
      {
        type: "USER_OFFLINE",
        payload: {
          userId: "user123",
        },
      }
    );

    expect(state.onlineUsers.user123).toBeUndefined();
  });

  it("resets the chat state", () => {
    const state = chatReducer(
      createInitialChatState(),
      { type: "RESET_CHAT_STATE" }
    );

    expect(state.rooms).toEqual([]);
    expect(state.messagesByRoom).toEqual({});
    expect(state.onlineUsers).toEqual({});
  });
});
