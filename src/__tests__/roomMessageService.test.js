
import {
  describe,
  it,
  expect,
  vi,
  afterEach,
} from "vitest";

import {
  getRooms,
  getRoom,
} from "../services/roomService";

import {
  getRoomMessages,
} from "../services/messageService";

describe("Room API services", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    sessionStorage.clear();
  });

  it("retrieves all available rooms", async () => {
    const rooms = [
      {
        _id: "room1",
        slug: "javascript",
        name: "JavaScript",
      },
      {
        _id: "room2",
        slug: "python",
        name: "Python",
      },
    ];

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        count: 2,
        rooms,
      }),
    });

    vi.stubGlobal("fetch", fetchMock);

    const result = await getRooms();

    expect(result).toEqual(rooms);

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/api/rooms"),
      expect.any(Object)
    );
  });

  it("retrieves a room by its slug", async () => {
    const room = {
      _id: "room1",
      slug: "javascript",
      name: "JavaScript",
    };

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => room,
    });

    vi.stubGlobal("fetch", fetchMock);

    const result = await getRoom("javascript");

    expect(result).toEqual(room);

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining(
        "/api/rooms/javascript"
      ),
      expect.any(Object)
    );
  });

  it("encodes special characters in room slugs", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        slug: "core-team",
      }),
    });

    vi.stubGlobal("fetch", fetchMock);

    await getRoom("core team");

    expect(fetchMock.mock.calls[0][0]).toContain(
      "core%20team"
    );
  });
});

describe("Message history API services", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    sessionStorage.clear();
  });

  it("retrieves the first page of messages", async () => {
    const responseData = {
      room: {
        slug: "javascript",
        name: "JavaScript",
      },
      count: 2,
      hasMore: true,
      nextCursor: {
        createdAt: "2026-01-01T10:00:00.000Z",
        _id: "507f1f77bcf86cd799439011",
      },
      messages: [
        { _id: "message2", content: "Second" },
        { _id: "message1", content: "First" },
      ],
    };

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => responseData,
    });

    vi.stubGlobal("fetch", fetchMock);

    const result = await getRoomMessages(
      "javascript",
      { limit: 2 }
    );

    expect(result).toEqual(responseData);

    expect(fetchMock.mock.calls[0][0]).toContain(
      "limit=2"
    );
  });

  it("retrieves older messages using both cursor parameters", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        messages: [],
        hasMore: false,
        nextCursor: null,
      }),
    });

    vi.stubGlobal("fetch", fetchMock);

    const before = "2026-01-01T10:00:00.000Z";
    const beforeId = "507f1f77bcf86cd799439011";

    await getRoomMessages("javascript", {
      limit: 20,
      before,
      beforeId,
    });

    const requestedUrl = new URL(
      fetchMock.mock.calls[0][0]
    );

    expect(requestedUrl.searchParams.get("limit"))
      .toBe("20");

    expect(requestedUrl.searchParams.get("before"))
      .toBe(before);

    expect(requestedUrl.searchParams.get("beforeId"))
      .toBe(beforeId);
  });

  it("does not send an incomplete pagination cursor", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        messages: [],
      }),
    });

    vi.stubGlobal("fetch", fetchMock);

    await getRoomMessages("javascript", {
      before: "2026-01-01T10:00:00.000Z",
    });

    const requestedUrl = new URL(
      fetchMock.mock.calls[0][0]
    );

    expect(
      requestedUrl.searchParams.has("before")
    ).toBe(false);

    expect(
      requestedUrl.searchParams.has("beforeId")
    ).toBe(false);
  });

  it("handles missing rooms", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      json: async () => ({
        error: {
          message: "Room not found",
          code: "ROOM_NOT_FOUND",
        },
      }),
    });

    vi.stubGlobal("fetch", fetchMock);

    await expect(
      getRoomMessages("unknown")
    ).rejects.toMatchObject({
      status: 404,
      code: "ROOM_NOT_FOUND",
    });
  });
});
