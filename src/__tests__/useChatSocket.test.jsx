
import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useChatSocket } from "../hooks/useChatSocket";
import { useSocket } from "../hooks/useSocket";
import { useChat } from "../hooks/useChat";

import {
  joinRoom,
  leaveRoom,
  sendMessage,
  setTyping,
} from "../services/socketService";

vi.mock("../hooks/useSocket", () => ({
  useSocket: vi.fn(),
}));

vi.mock("../hooks/useChat", () => ({
  useChat: vi.fn(),
}));

vi.mock("../services/socketService", () => ({
  joinRoom: vi.fn(),
  leaveRoom: vi.fn(),
  sendMessage: vi.fn(),
  setTyping: vi.fn(),
}));

function createFakeSocket() {
  const listeners = new Map();

  return {
    id: "socket-123",
    connected: true,

    on: vi.fn((event, callback) => {
      listeners.set(event, callback);
    }),

    off: vi.fn((event) => {
      listeners.delete(event);
    }),

    trigger(event, ...args) {
      listeners.get(event)?.(...args);
    },

    listeners,
  };
}

describe("useChatSocket", () => {
  let socket;
  let dispatch;

  beforeEach(() => {
    vi.clearAllMocks();

    socket = createFakeSocket();
    dispatch = vi.fn();

    useSocket.mockReturnValue({
      socket,
      connectionStatus: "connected",
      connectionError: null,
      retryConnection: vi.fn(),
    });

    useChat.mockReturnValue({
      dispatch,
    });

    joinRoom.mockResolvedValue({
      ok: true,
      room: {
        slug: "javascript",
        name: "JavaScript",
      },
    });

    leaveRoom.mockResolvedValue({ ok: true });
    sendMessage.mockResolvedValue({
      ok: true,
      id: "message-123",
    });
    setTyping.mockResolvedValue({ ok: true });
  });

  it("joins the selected room when the socket is connected", async () => {
    const { result } = renderHook(() =>
      useChatSocket("valid-jwt", "javascript")
    );

    await waitFor(() => {
      expect(joinRoom).toHaveBeenCalledWith(
        socket,
        "javascript"
      );
    });

    await waitFor(() => {
      expect(result.current.joinedRoomSlug).toBe(
        "javascript"
      );
    });
  });

  it("registers the required socket event listeners", () => {
    renderHook(() =>
      useChatSocket("valid-jwt", "javascript")
    );

    expect(socket.on).toHaveBeenCalledWith(
      "connect",
      expect.any(Function)
    );

    expect(socket.on).toHaveBeenCalledWith(
      "disconnect",
      expect.any(Function)
    );

    expect(socket.on).toHaveBeenCalledWith(
      "message:new",
      expect.any(Function)
    );

    expect(socket.on).toHaveBeenCalledWith(
      "typing:update",
      expect.any(Function)
    );
  });

  it("receives messages for the currently selected room", async () => {
    const onMessage = vi.fn();

    renderHook(() =>
      useChatSocket("valid-jwt", "javascript", onMessage)
    );

    await waitFor(() => {
      expect(joinRoom).toHaveBeenCalledWith(
        socket,
        "javascript"
      );
    });

    const message = {
      id: "message-123",
      room: "javascript",
      content: "Hello from another user",
    };

    act(() => {
      socket.trigger("message:new", message);
    });

    expect(onMessage).toHaveBeenCalledWith(message);
  });

  it("ignores messages belonging to another room", async () => {
    const onMessage = vi.fn();

    renderHook(() =>
      useChatSocket("valid-jwt", "javascript", onMessage)
    );

    await waitFor(() => {
      expect(joinRoom).toHaveBeenCalledWith(
        socket,
        "javascript"
      );
    });

    act(() => {
      socket.trigger("message:new", {
        id: "message-456",
        room: "python",
        content: "A message from another room",
      });
    });

    expect(onMessage).not.toHaveBeenCalled();
  });

  it("dispatches typing updates for the selected room", async () => {
    renderHook(() =>
      useChatSocket("valid-jwt", "javascript")
    );

    await waitFor(() => {
      expect(joinRoom).toHaveBeenCalledWith(
        socket,
        "javascript"
      );
    });

    act(() => {
      socket.trigger("typing:update", {
        room: "javascript",
        userId: "user-456",
        isTyping: true,
      });
    });

    expect(dispatch).toHaveBeenCalledWith({
      type: "USER_TYPING",
      payload: {
        roomSlug: "javascript",
        userId: "user-456",
        isTyping: true,
      },
    });
  });

  it("ignores typing updates from another room", async () => {
    renderHook(() =>
      useChatSocket("valid-jwt", "javascript")
    );

    await waitFor(() => {
      expect(joinRoom).toHaveBeenCalledWith(
        socket,
        "javascript"
      );
    });

    act(() => {
      socket.trigger("typing:update", {
        room: "python",
        userId: "user-456",
        isTyping: true,
      });
    });

    expect(dispatch).not.toHaveBeenCalled();
  });

  it("leaves the previous room and joins the new room after switching", async () => {
    const { result, rerender } = renderHook(
      ({ slug }) => useChatSocket("valid-jwt", slug),
      {
        initialProps: {
          slug: "javascript",
        },
      }
    );

    await waitFor(() => {
      expect(result.current.joinedRoomSlug).toBe(
        "javascript"
      );
    });

    rerender({
      slug: "python",
    });

    await waitFor(() => {
      expect(leaveRoom).toHaveBeenCalledWith(
        socket,
        "javascript"
      );

      expect(joinRoom).toHaveBeenCalledWith(
        socket,
        "python"
      );
    });

    await waitFor(() => {
      expect(result.current.joinedRoomSlug).toBe("python");
    });
  });

  it("sends typing start and stop events only when the state changes", async () => {
    const { result } = renderHook(() =>
      useChatSocket("valid-jwt", "javascript")
    );

    await waitFor(() => {
      expect(result.current.joinedRoomSlug).toBe(
        "javascript"
      );
    });

    act(() => {
      result.current.onTypingChange(true);
      result.current.onTypingChange(true);
    });

    expect(setTyping).toHaveBeenCalledTimes(1);
    expect(setTyping).toHaveBeenCalledWith(
      socket,
      "typing:start",
      "javascript"
    );

    act(() => {
      result.current.onTypingChange(false);
    });

    expect(setTyping).toHaveBeenCalledTimes(2);
    expect(setTyping).toHaveBeenLastCalledWith(
      socket,
      "typing:stop",
      "javascript"
    );
  });

  it("sends a message after successfully joining the room", async () => {
    const { result } = renderHook(() =>
      useChatSocket("valid-jwt", "javascript")
    );

    await waitFor(() => {
      expect(result.current.joinedRoomSlug).toBe(
        "javascript"
      );
    });

    let response;

    await act(async () => {
      response = await result.current.sendMessage(
        "Hello DevConnect"
      );
    });

    expect(sendMessage).toHaveBeenCalledWith(
      socket,
      "javascript",
      "Hello DevConnect"
    );

    expect(response).toEqual({
      ok: true,
      id: "message-123",
    });
  });

  it("rejects sending a message when disconnected", async () => {
    socket.connected = false;

    const { result } = renderHook(() =>
      useChatSocket("valid-jwt", "javascript")
    );

    await expect(
      result.current.sendMessage("Hello")
    ).rejects.toThrow(
      "You are disconnected. Wait for reconnection before sending."
    );

    expect(sendMessage).not.toHaveBeenCalled();
  });

  it("clears typing users after a socket disconnects", async () => {
    renderHook(() =>
      useChatSocket("valid-jwt", "javascript")
    );

    await waitFor(() => {
      expect(joinRoom).toHaveBeenCalledWith(
        socket,
        "javascript"
      );
    });

    act(() => {
      socket.trigger("disconnect", "transport close");
    });

    expect(dispatch).toHaveBeenCalledWith({
      type: "SET_TYPING_USERS",
      payload: {
        roomSlug: "javascript",
        userIds: [],
      },
    });
  });

  it("removes socket listeners when the hook unmounts", () => {
    const { unmount } = renderHook(() =>
      useChatSocket("valid-jwt", "javascript")
    );

    unmount();

    expect(socket.off).toHaveBeenCalledWith(
      "connect",
      expect.any(Function)
    );

    expect(socket.off).toHaveBeenCalledWith(
      "disconnect",
      expect.any(Function)
    );

    expect(socket.off).toHaveBeenCalledWith(
      "message:new",
      expect.any(Function)
    );

    expect(socket.off).toHaveBeenCalledWith(
      "typing:update",
      expect.any(Function)
    );
  });
});
