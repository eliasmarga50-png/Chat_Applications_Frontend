
import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockIo } = vi.hoisted(() => ({
  mockIo: vi.fn(),
}));

vi.mock("socket.io-client", () => ({
  io: mockIo,
}));

describe("socketService", () => {
  let socketService;

  beforeEach(async () => {
    vi.resetModules();
    vi.clearAllMocks();
    vi.stubEnv("VITE_API_URL", "http://localhost:4000");

    socketService = await import("../services/socketService");
  });

  it("creates a socket with the configured server URL", () => {
    const fakeSocket = { connected: false };
    mockIo.mockReturnValue(fakeSocket);

    const result = socketService.createSocket("valid-jwt");

    expect(result).toBe(fakeSocket);
    expect(mockIo).toHaveBeenCalledWith(
      "http://localhost:4000",
      expect.objectContaining({
        autoConnect: false,
        auth: {
          token: "valid-jwt",
        },
      })
    );
  });

  it("configures automatic reconnection", () => {
    mockIo.mockReturnValue({});

    socketService.createSocket("valid-jwt");

    expect(mockIo).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        reconnection: true,
        reconnectionAttempts: Infinity,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        timeout: 10000,
      })
    );
  });

  it("rejects socket creation without a JWT", () => {
    expect(() => socketService.createSocket()).toThrow(
      "A JWT token is required to create a socket."
    );

    expect(mockIo).not.toHaveBeenCalled();
  });

  it("rejects events when the socket is disconnected", async () => {
    const socket = { connected: false };

    await expect(
      socketService.emitWithAck(socket, "message:send", {})
    ).rejects.toThrow("Socket is not connected.");
  });

  it("resolves when the server acknowledges an event successfully", async () => {
    const response = {
      ok: true,
      id: "message-123",
    };

    const socket = {
      connected: true,
      timeout: vi.fn().mockReturnThis(),
      emit: vi.fn((event, payload, callback) => {
        callback(null, response);
      }),
    };

    await expect(
      socketService.emitWithAck(
        socket,
        "message:send",
        { slug: "javascript", content: "Hello" }
      )
    ).resolves.toEqual(response);

    expect(socket.timeout).toHaveBeenCalledWith(8000);
    expect(socket.emit).toHaveBeenCalledWith(
      "message:send",
      { slug: "javascript", content: "Hello" },
      expect.any(Function)
    );
  });

  it("rejects when the acknowledgement times out", async () => {
    const socket = {
      connected: true,
      timeout: vi.fn().mockReturnThis(),
      emit: vi.fn((event, payload, callback) => {
        callback(new Error("ack timeout"), undefined);
      }),
    };

    await expect(
      socketService.emitWithAck(socket, "room:join", {
        slug: "javascript",
      })
    ).rejects.toThrow(
      "The server did not acknowledge the event in time."
    );
  });

  it("rejects when the server returns an unsuccessful acknowledgement", async () => {
    const socket = {
      connected: true,
      timeout: vi.fn().mockReturnThis(),
      emit: vi.fn((event, payload, callback) => {
        callback(null, {
          ok: false,
          error: {
            code: "ROOM_NOT_FOUND",
            message: "Room not found",
          },
        });
      }),
    };

    await expect(
      socketService.emitWithAck(socket, "room:join", {
        slug: "unknown-room",
      })
    ).rejects.toMatchObject({
      message: "Room not found",
      code: "ROOM_NOT_FOUND",
    });
  });

  it("uses the correct payload when joining and leaving a room", async () => {
    const socket = {
      connected: true,
      timeout: vi.fn().mockReturnThis(),
      emit: vi.fn((event, payload, callback) => {
        callback(null, { ok: true });
      }),
    };

    await socketService.joinRoom(socket, "javascript");
    await socketService.leaveRoom(socket, "javascript");

    expect(socket.emit).toHaveBeenNthCalledWith(
      1,
      "room:join",
      { slug: "javascript" },
      expect.any(Function)
    );

    expect(socket.emit).toHaveBeenNthCalledWith(
      2,
      "room:leave",
      { slug: "javascript" },
      expect.any(Function)
    );
  });

  it("sends messages with the correct room and content", async () => {
    const socket = {
      connected: true,
      timeout: vi.fn().mockReturnThis(),
      emit: vi.fn((event, payload, callback) => {
        callback(null, { ok: true, id: "message-123" });
      }),
    };

    await socketService.sendMessage(
      socket,
      "javascript",
      "Hello DevConnect"
    );

    expect(socket.emit).toHaveBeenCalledWith(
      "message:send",
      {
        slug: "javascript",
        content: "Hello DevConnect",
      },
      expect.any(Function)
    );
  });

  it("sends typing start and stop events with the room slug", async () => {
    const socket = {
      connected: true,
      timeout: vi.fn().mockReturnThis(),
      emit: vi.fn((event, payload, callback) => {
        callback(null, { ok: true });
      }),
    };

    await socketService.setTyping(
      socket,
      "typing:start",
      "javascript"
    );

    await socketService.setTyping(
      socket,
      "typing:stop",
      "javascript"
    );

    expect(socket.emit).toHaveBeenNthCalledWith(
      1,
      "typing:start",
      { slug: "javascript" },
      expect.any(Function)
    );

    expect(socket.emit).toHaveBeenNthCalledWith(
      2,
      "typing:stop",
      { slug: "javascript" },
      expect.any(Function)
    );
  });
});
